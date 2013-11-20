(function () {
	"use strict";
	var vm = require("vm"),
		_ = require("lodash");

	exports.execute = function (expr, tags) {
		var context = {},
			res;
		tags.forEach(function (tag) {
			if (_.isObject(tag)) {
				_.extend(context, tag);
			} else if (_.isString(tag)) {
				context[tag] = true;
			}
		});
		res = (function run() {
			var inner_result = false;
			try {
				//console.log("context: %j, expr: %j, tags: %j = %j", context, expr, tags, res);
				inner_result = vm.runInContext(expr, vm.createContext(context));
			} catch (e) {
				if (e.name === "ReferenceError") {
					console.log("RefError");
					var tag = {};
					tag[e.message.split(" ")[0]] = false;
					_.extend(context, tag); 
					inner_result = run();
				} else {
					console.log(e);
					//throw e;
					inner_result = false;
				}
			}
			return inner_result;
		})();
		if (_.isBoolean(res)) {
			return res;
		} else {
			return false;
		}
	};

})();
