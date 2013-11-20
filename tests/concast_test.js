(function () {
	"use strict";
	var concast = require("../lib/concast.js"),
		appool = require("appool");

	module.exports =  {
		setUp : function (cb) {
			appool.listen(0, function (url) {
				concast.setAppoolUrl(url);
				cb();
			});
		},
		test_timeframe : function (test) {
			concast.getTimeframe(function (time) {
				console.log("Timeframe: %j", time);
				test.done();
			});
		}
	};

})();
