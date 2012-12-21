Easy.js
===

简单的JS模块/文件加载器

API
===

E.js
----

`E.js('mod:a');`

异步加载http://baseurl/mod/a.js;

	E.js('mod:a', 'mod:b', 'mod:c');
	或者
	E.js('mod:a').js('mod:b').js('mod:c');
	或者
	E.js('mod:a');
	E.js('mod:b');
	E.js('mod:c');


异步并发请求a.js, b.js, c.js加载完毕之后按顺序执行;

`E.js(['mod:a', 'mod:b', 'mod:c']);`

请求合并服务接口http://combourl/?mod/a.js&mod/b.js&mod/c.js;

E.add
----

`E.add('mod:a');`

主要在内联js中用于声明mod/a.js已经加载;



