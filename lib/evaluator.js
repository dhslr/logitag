/**
 * This module implements the semantic analysis of expression declared with jison 
 * in #crossLink "Logitag/Grammar". 
 * @module logitag
 * @submodule evaluator
 */
(function () {
	"use strict";
	var jison = require("./grammar.js"),
		assert = require("assert"),
		_ = require("lodash"),
		sandbox = require("./sandbox.js"),
		check_tag_at,
		check_variable_at,
		set_tags,
		real_time = true,
		evaluate,
		url_map = {},
		tags = [];

	exports.setTags  = set_tags = function (t) {
		assert.ok(_.isArray(t), "Tags must be an array!");
		if (t.length > 0) {
			assert.equal(t[0].length, 2, 
				"Tags array must consist of arrays with exactly two elements!");
			assert.ok(_.isArray(t[0][0]), 
				"First entry must be an array of the actual tags!");
			assert.equal(typeof t[0][1], "number", 
				"Second entry must be a number (ms since the unix epoch)!");
			assert.ok(t[0][1] > 0, 
				"Second entry must be a positive number (ms since the unix epoch)!");
		}

		tags = t;
	};

	check_variable_at = function (variable, local_tags) {
		var obj;
		//console.log("Check variable %j at %j", variable, local_tags);
		for (var j = 0; j < local_tags.length; j++) {
			if (_.isObject(local_tags[j]) && 
					!_.isUndefined(local_tags[j][variable[0]])) {
				obj = local_tags[j][variable[0]];
				break;
			}
		}
		if (!_.isUndefined(obj)) {
			if (variable.length === 1) {
				//console.log("Variable found: %j=%j", variable[0], obj);
				return obj;
			} else if (variable.length === 2) {
				//console.log("Variable found: %j.%j=%j", variable[0], 	variable[1], obj[variable[1]]);
				return obj[variable[1]];
			}
		}
		return false;
	};

	check_tag_at = function (tag, local_tags) {
		var res = false;
		for (var j = 0; (!res) && j < local_tags.length; j++) {
			res = (local_tags[j] === tag);
		}
		return res;
	};

	evaluate = function (obj, local_tags) {
		var _local_tags = local_tags;
		// special case, check "newest" tags
		if (local_tags === 0) {
			_local_tags = tags[tags.length - 1][0];
		}
		//console.log("Query: %j, tags:", obj, util.inspect(_local_tags));
		if (_.isArray(obj)) {
			switch (obj[0]) {
				case '->':
					return (function () {
						var now = (new Date()).valueOf(),
							t = obj[1][0] * 1000,
							res = false;
						// when working with older data,
						// set now to newest time available 
						if (!real_time && tags.length > 0) {
							now = tags[tags.length - 1][1];
						}
						// assert(t <= now);
						for (var i = tags.length - 1; (!res) && (i >= 0) && 
								(tags[i][1] >= now - t); i--) {
									res = evaluate(obj[1][1], tags[i][0]);
						}
						return res;
					})();
				case '&&':
					return (evaluate(obj[1][0], _local_tags) &&
							evaluate(obj[1][1], _local_tags));
				case '||':
					return (evaluate(obj[1][0], _local_tags) ||
							evaluate(obj[1][1], _local_tags));
				case '!':
					return !(evaluate(obj[1][0], _local_tags));
				case 'url':
					//console.log("URL decl: %j=%j", obj[1][0], obj[1][1]); 
					url_map[obj[1][0]] = obj[1][1];
					if (_.isArray(obj[1][2]) && obj[1][2][0] !== 'url') {
						//URL declerations done
						//sandbox.updateContext(url_map);
					}
					return evaluate(obj[1][2], _local_tags);
				case 'iqexpr':
					//console.log("IQEXPR: %j", obj[1]);
					return sandbox.execute(obj[1], _local_tags);
				/*
				case 'tag':
					if (_.isUndefined(url_map[obj[1][0]])) {
						//console.log("tag %j", obj[1]);
						return check_tag_at(obj[1][0], _local_tags);
					} else {
						//console.log("variable %j", obj[1]);
						return check_variable_at(obj[1], _local_tags);
					}
				//case 'variable': break;
				*/
			default:
					console.log("Error evaluating!");
					console.log("Token: ");
					console.log(obj);
					assert(false);
			}
		} else {
			console.log("Error evaluating!");
			console.log("Token: ");
			console.log(obj);
			assert(false);
		}
	};

	exports.setRealTime = function (v) { real_time = v; };

	exports.evaluate = function (query, new_tags) {
		if (typeof new_tags !== "undefined") {
			set_tags(new_tags);
		}
		return evaluate(jison.parse(query), 0);
	};

})();
