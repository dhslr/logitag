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
		//console.log("context: %j, expr: %j, tags: %j = %j", context, expr, tags, res);
		try {
			res = vm.runInContext(expr, vm.createContext(context));
		} catch (e) {
			//TODO: error handling
			//console.log(e);
			return false;
		}
		if (_.isBoolean(res)) {
			return res;
		} else {
			return false;
		}
	};

})();
