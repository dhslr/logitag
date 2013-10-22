var util = require("util"),
	gr = require("./grammar.js");
console.log(util.inspect(gr.parse("-> abc || dfg && -> 123 (myfunction() || {temp:123}.temp > 12 && {temp:1233}.temp < 123 && b)"), false, null));
