(function () {
	"use strict";
	var evaluator = require("../lib/evaluator.js"),
		tags,
		now = new Date();

	tags = [ [ ["a", "b", "c", {"bla": {"on": true}}, {"blubb" : false}], (new Date(now - 110000)).valueOf()], 
			 [ ["a", "f"], (new Date(now - 55000)).valueOf()],

			 [ ["a", "b", "e"], (new Date(now - 50000)).valueOf()],

			 [ ["b", {"test" : {"on": true, "getOn" : function () { return true; }},}, 
				{"projector" : {"on" : true, "temp" : 43}}, 
				{"third": true}], now.valueOf()]
    ]; 
	console.log("Tags history for test:");
	console.log(tags[0]);
	console.log(tags[1]);
	console.log(tags[2]);
	evaluator.setTags(tags);

	exports.test_true = function (test) {

		test.ok(evaluator.evaluate("-> a"));
		test.ok(evaluator.evaluate("-> 60 a"));
		test.ok(evaluator.evaluate("-> e"));
		test.ok(evaluator.evaluate("-> (a && b)"));
		test.ok(evaluator.evaluate("-> (a && b) && b"));
		test.ok(evaluator.evaluate("-> (a && b && c) && b"));
		test.ok(evaluator.evaluate("-> 120 (a && b && c) && b"));
		//test.ok(evaluator.evaluate("-> (-> b)"));
		//test.ok(evaluator.evaluate("-> 1 (-> 60 a)"));
		//test.ok(evaluator.evaluate("-> c && (-> 60 a && b)"));
		//test.ok(evaluator.evaluate("(-> a && b) && (-> e && b) && (-> c && b)"));
		//test.ok(evaluator.evaluate("(-> a) && b"));
		//test.ok(evaluator.evaluate("(-> b) && b"));
		//test.ok(evaluator.evaluate("(-> 60 a) && b"));		
		test.ok(evaluator.evaluate("-> c && b"));
		test.ok(evaluator.evaluate("-> 120  c && b"));
		test.ok(evaluator.evaluate("-> e && (b || !b)"));
		test.ok(evaluator.evaluate("var projector=http://teco.edu:123/projector; projector.on"));
		test.ok(evaluator.evaluate("var projector=http://teco.edu:123/projector, test=http://lamp; projector.on && test.on"));
		test.ok(evaluator.evaluate("var projector=http://teco.edu:123/projector, test=http://lamp; test.on && projector.on && test.on"));
		test.ok(evaluator.evaluate("var projector=http://teco.edu:123/projector, test=http://lamp, third=http://miau.org; test.on && projector.on && test.on && third"));
		test.ok(evaluator.evaluate("var projector=http://teco.edu:123/projector, test=http://lamp, third=http://miau.org; test.on && (projector.temp > 40) && test.on && third"));
		test.ok(evaluator.evaluate("var projector=http://teco.edu:123/projector; projector.on && (projector.temp > 42)"));
		test.ok(evaluator.evaluate("var projector=http://teco.edu:123/projector; (projector.temp > 42) && projector.on"));
		test.ok(evaluator.evaluate("var blubb=http://localhost:777; -> !blubb && (b || !b)"));
		test.ok(evaluator.evaluate("var bla=http://web.de,blubb=http://google.de; -> !blubb && (b|| !b)"));
		test.ok(evaluator.evaluate("var bla=http://web.de,blubb=http://google.de; -> e && (b || !b)"));
		test.ok(evaluator.evaluate("var bla=http://web.de,blubb=http://google.de; -> (a && (bla.on && true))"));
		test.ok(evaluator.evaluate("var bla=http://web.de,blubb=http://google.de; -> (blubb || (bla.on && true))"));
		test.ok(evaluator.evaluate("var bla=http://web.de,blubb=http://google.de; -> (blubb || (bla.on && true))"));
		test.ok(evaluator.evaluate("-> tag1 || (test.on && projector.on && projector.temp > 25) "));
		test.ok(evaluator.evaluate("-> tag1 || test.on && -> ((projector.temp > 20) && (projector.on))"));
		test.ok(evaluator.evaluate("-> tag1 || test.getOn() && -> ((projector.temp > 20) && (projector.on))"));
		
		test.done();
	};
	exports.test_false = function (test) {
		
	  test.ok(!evaluator.evaluate("-> (a && b && f)"));
		test.ok(!evaluator.evaluate("-> 60 (a && e && f)"));
		test.ok(!evaluator.evaluate("-> 30 a"));
		test.ok(!evaluator.evaluate("-> b && a"));
		test.ok(!evaluator.evaluate("-> 30 (a && b) && b"));
		test.ok(!evaluator.evaluate("-> d && b"));
		test.ok(!evaluator.evaluate("-> a && d"));
		test.ok(!evaluator.evaluate("-> 60 c && b"));
		test.ok(!evaluator.evaluate("-> 0 c && b"));
		test.ok(!evaluator.evaluate("-> c && c"));
		test.ok(!evaluator.evaluate("-> (a && b && e) && c"));
		test.ok(!evaluator.evaluate("var bla=http://web.de; -> bla.off && (b|| !b)"));
		test.ok(!evaluator.evaluate("var projector=http://teco.edu:123/projector; projector.on && (projector.temp > 420)"));
		test.ok(!evaluator.evaluate("-> tag1 || (test.on && projector.on && projector.temp > 45) "));
		test.ok(!evaluator.evaluate("-> tag1 || (!test.on || !projector.on)"));
		test.ok(!evaluator.evaluate("-> tag1 || !test.on && -> ((projector.temp > 53) && !(projector.on))"));
		test.ok(!evaluator.evaluate("-> tag1 || ( (function { if (test.on) { return false; } else { return true;} ; })() ) || !projector.on"));
		
		/*
		test.throws(function () {
			evaluator.evaluate("bla=http://web.de, -> e && (b|| !b)");
		});
		test.throws(function () {
			evaluator.evaluate("bla=http://web.de,http:/; -> e && (b|| !b)");
		});
		test.throws(function () {
			evaluator.evaluate("test=dummy;-> e && (b|| !b)");
		});
		test.throws(function () {
			evaluator.evaluate("malformed;-> e && (b|| !b)");
		});
		*/
		
		test.done();
	};

})();
