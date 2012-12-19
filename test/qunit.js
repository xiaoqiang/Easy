module("Easy 基础");

test("Easy 命名空间", function() {
	equal(typeof Easy, 'function', "Easy 可用");
	equal(typeof easy, 'function', "easy 可用");
	equal(typeof E, 'function', "E 可用");
});

test("Easy API", function() {
	equal(typeof Easy.js, 'function', "Easy.js 可用");
	equal(typeof Easy.add, 'function', "Easy.add 可用");
});

module("Easy 加载模块");

asyncTest("Easy 加载一个模块", function() {
	Easy.js('mod:test1');
});

asyncTest("Easy 加载多个模块，顺序执行", function() {
	Easy.js('mod:test2', 'mod:test3');
});

asyncTest("Easy 重复加载同一模块", function() {
	Easy.js('mod:test4');
	Easy.js('mod:test4');
});

asyncTest("Easy 合并加载模块", function() {
	Easy.js(['mod:test5', 'mod:test6']);
});

asyncTest("Easy 混合加载模块", function() {
	Easy.js('mod:test7');
	Easy.js(['mod:test7', 'mod:test8', 'mod:test9'], 'mod:test10');
});