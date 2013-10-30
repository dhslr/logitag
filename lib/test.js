var util = require("util"),
	gr = require("./grammar.js");
/*
console.log(util.inspect(gr.parse("bla=http://bla.com, web=http://web.de; -> a && b"), false, null));
console.log(util.inspect(gr.parse("bla=http://bla.com, web=http://web.de; b && (-> a)"), false, null));
*/

/*
console.log(util.inspect(gr.parse("-> tag1 || test.on && -> ((projector.temp > 20) && (projector.on))")));

console.log(util.inspect(gr.parse("tag1 || test.on && (projector.temp > 20)")));

console.log(util.inspect(gr.parse("-> 123 tag1 || test.on && -> 099 ((projector.temp > 20) && (projector.on))")));

console.log(util.inspect(gr.parse("tag1 || test.on && projector.temp > 20")));

console.log(util.inspect(gr.parse("var bla=http://bla.com, web=http://web.de; -> a && b"), false, null));

console.log(util.inspect(gr.parse("var bla='http://bla.com', web='http://web.de'; -> a && b"), false, null));


console.log(util.inspect(gr.parse("-> tag1 || !test.on && -> ((projector.temp > 53) && !(projector.on))"), false, null));
console.log(util.inspect(gr.parse("var projector=http://teco.edu:123/projector; projector.on && (projector.temp > 420)"), false, null));
*/


console.log(util.inspect(gr.parse("-> tag1 || ((function { if (test.on) { return false; } else { return true;} ; })()) || !projector.on"), false, null));
//console.log(util.inspect(gr.parse("(-> 123 tag1) || test.on && (-> 099 ((projector.temp > 20) && (projector.on)))")));
