var util = require("util"),
	gr = require("./grammar.js");
console.log(util.inspect(gr.parse("bla=http://bla.com, web=http://web.de; -> miau.on || dfg && -> 123 (myfunction() || {temp:123}.temp > 12 && {temp:1233}.temp < 123 && b)"), false, null));
console.log(util.inspect(gr.parse("bla=http://bla.com, web=http://web.de; -> a && b"), false, null));
console.log(util.inspect(gr.parse("bla=http://bla.com, web=http://web.de; b && (-> a)"), false, null));
console.log(util.inspect(gr.parse("bla=http://bla.com, web=http://web.de; (-> a) && b"), false, null));
