var gr = require("./grammar2.js"),
	util = require("util");

console.log(util.inspect(gr.parse("test=\"abcd\", test2=123; true"), false, null));

