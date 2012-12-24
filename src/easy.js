/* 
 * Easy.js
 * Version 1.0
 * https://github.com/xiaoqiang/Easy/
 */
;(function(win, undefined) {
	var doc = win.document,
		//全局模块数组
		assets = {},
		//事件队列
		handlers = {},
		//模块队列
		queue = [],
		//是否支持异步
		isAsync = 'async' in doc.createElement('script') || 'MozAppearance' in doc.documentElement.style || win.opera,
		//头部是否准备好
		isHeadReady,
		//each方法摘自underscore
		nativeForEach = Array.prototype.forEach,
		//初始化
		api = function(obj) {
			if(obj instanceof api) return obj;
			if(!(this instanceof api)) return new api(obj);
		},
		//js模块路径
		BASEURL = '',		
		//合并api
		COMBOURL = '/combo?',
		//合并分隔符
		DELIMITER = '&',
		//状态机
		PRELOADING = 1,
		PRELOADED = 2,
		LOADING = 3,
		LOADED = 4;

	if(isAsync) { //支持异步模式
		api.load = function() {
			var args = arguments;
			each(args, function(_item) {
				load(getAsset(_item));

			});
			return api;
		};
	} else { //不支持异步模式
		api.load = function() {
			var args = arguments,
				rest = deepSlice(args, 1),
				next = rest[0];
			if(!isHeadReady) { //等待头部准备好 just hack for some IE 
				queue.push(function() {
					api.load.apply(null, args);
				});
				return api;
			}
			if( !! next) { //预加载(cache)剩下的队列
				each(rest, function(_item) {
					preLoad(getAsset(_item));
				});
				load(getAsset(args[0]), function() {
					api.load.apply(null, rest);
				});
			} else { //常规加载当前模块
				load(getAsset(args[0]));
			}
			return api;
		};
	}

	/* 
	 * 外链js加载
	 * Example
	 * E.js('fun:id');
	 * E.js('fun:id','mod:xxx');
	 * E.js(['fun:id','mod:xxx']); 合并加载['fun:id','mod:xxx']数组内模块
	 *
	 */

	api.js = api.load;

	/*
	 * 内联js声明
	 * Example
	 * E.add('fun:id','mod:xxx');
	 * 标记已经加载的模块
	 *
	 */

	api.add = function() {
		var args = arguments;
		each(args, function(_item) {
			_item = trim(_item);
			if(isAdded(_item)) {
				assets[isAdded(_item)].state = LOADED;
			} else {
				assets[_item] = {
					name: _item,
					state: LOADED
				};
			}
		});
		return api;
	};

	/*
	 * 工具函数
	 */

	function has(obj, key) {
		return {}.hasOwnProperty.call(obj, key);
	}

	function each(obj, iterator, context) { //by underscore
		if(obj == null) return;
		if(nativeForEach && obj.forEach === nativeForEach) {
			obj.forEach(iterator, context);
		} else if(obj.length === +obj.length) {
			for(var i = 0, l = obj.length; i < l; i++) {
				if(iterator.call(context, obj[i], i, obj) === {}) return;
			}
		} else {
			for(var key in obj) {
				if(has(obj, key)) {
					if(iterator.call(context, obj[key], key, obj) === {}) return;
				}
			}
		}
	}

	function isFunction(item) {
		return !!item.call;
	}

	function isArray(item) {
		return !!item.pop;
	}

	function trim(item) {
		return item.replace(/^\s+|\s+$/g, '');
	}

	function deepSlice(arr, num) { //数组深拷贝
		var out = [];
		for(var i = num, len = arr.length; i < len; i++) {
			if(isArray(arr[i])) {
				out[i - num] = deepSlice(arr[i], 0);
			} else {
				out[i - num] = arr[i];
			}
		}
		return out;
	}

	function one(callback) {
		callback = callback || noop;
		if(callback._done) {
			return;
		}
		callback();
		callback._done = 1;
	}

	function noop() {} //空函数
	
	/*
	 * 功能函数
	 */
	function nameToPath(item) { //模块名转路径,如'mod:a.js'转成'/mod/a.js'
		var path = item.split(':'),
		url = '';
		each(path, function(_item, i){
			url += '/' + _item;
		});		
		return url + '.js';
	}

	function isAdded(item) { //模块是否已经处理
		var tag = !1;
		each(assets, function(_item, i) {
			i = ' ' + i + ' ';
			if(~i.indexOf(' ' + item + ' ')) {
				tag = trim(i);
			}
		});
		return tag;
	}

	function getAsset(item) { //根据模块名获取模块，获取不到就新建
		if(isArray(item)) {
			var url = COMBOURL,
				asset,
				temparr = deepSlice(item, 0),
				itemStr = trim(temparr.join(''));
			each(assets, function(_item) {
				if(_item.tag == itemStr) {
					asset = _item;
					return asset;
				}
			});
			temparr.reverse();
			for(var i = temparr.length - 1; i > -1; i--) {
				temparr[i] = trim(temparr[i]);
				if(isAdded(temparr[i])) {
					temparr.splice(i, 1);
				} else {
					url += nameToPath(temparr[i]) + DELIMITER;
				}
			}
			if(temparr.length > 1) {
				asset = {
					name: temparr.join(' '),
					url: url.slice(0, -1),
					tag: trim(item.join(''))
				};
				assets[asset.name] = asset;
			} else if(temparr.length == 1) {
				asset = {
					name: trim(temparr[0]),
					url: BASEURL + nameToPath(temparr[0]),
					tag: trim(item.join(''))
				};
				assets[asset.name] = asset;
			}
			return asset;
		} else {
			item = trim(item);
			if(isAdded(item)) {
				return assets[isAdded(item)];
			}
			var asset = {
				name: item,
				url: BASEURL + nameToPath(item)
			};
			assets[asset.name] = asset;
			return asset;
		}
	}

	function ready(item, callback) {
		callback = callback || noop;
		var key = isAdded(item);
		if(key && !handlers[key]) {
			handlers[key] = [callback];
		} else if(key && !! handlers[key]) {
			handlers[key].push(callback);
		}
	}

	function onPreload(asset) { //预加载状态标记
		asset.state = PRELOADED;
		each(asset.onpreload, function(afterPreload) {
			afterPreload.call();
		});
	}

	function preLoad(asset) { //预加载，先cache起来
		if(asset && asset.state === undefined) {
			asset.state = PRELOADING;
			asset.onpreload = [];
			loadAsset({
				url: asset.url,
				type: 'cache'
			}, function() {
				onPreload(asset);
			});
		}
	}

	function load(asset, callback) { //加载状态处理
		if(!asset) {
			return;
		}
		callback = callback || noop;
		if(asset.state === LOADED) {
			callback();
			return;
		}
		if(asset.state === LOADING) {
			ready(asset.name, callback);
			return;
		}
		if(asset.state === PRELOADING) {
			asset.onpreload.push(function() {
				load(asset, callback);
			});
			return;
		}
		asset.state = LOADING;
		loadAsset(asset, function() {
			asset.state = LOADED;
			callback();
			var key = isAdded(asset.name);
			key && each(handlers[key], function(fn) {
				one(fn);
			});
		});
	}

	function loadAsset(asset, callback) { //加载请求
		callback = callback || noop;
		var ele;
		ele = doc.createElement('script');
		ele.type = 'text/' + (asset.type || 'javascript');
		ele.src = asset.url;
		ele.onload = ele.onreadystatechange = process;
		ele.onerror = error;
		ele.async = false;
		ele.defer = false;

		function error(event) { //错误处理
			event = event || win.event;
			//这里可以做错误上报
			ele.onload = ele.onreadystatechange = ele.onerror = null;
			callback();
		}

		function process(event) {
			event = event || win.event;
			if(event.type === 'load' || (/loaded|complete/.test(ele.readyState) && (!doc.documentMode || doc.documentMode < 9))) {
				ele.onload = ele.onreadystatechange = ele.onerror = null;
				callback();
			}
		}
		var head = doc['head'] || doc.getElementsByTagName('head')[0];
		head.insertBefore(ele, head.lastChild);
	}
	isAsync || setTimeout(function() { //just a hack for some IE
		isHeadReady = true;
		each(queue, function(fn) {
			fn();
		});
	}, 300);
	win.E = win.Easy = win.easy = api;
})(window);