(function () {
	"use strict";
	var concast = require("../lib/concast.js"),
		appool = require("appool");

	module.exports =  {
		test_timeframe : function (test) {
			appool.listen(0, function (url) {
				concast.setAppoolUrl(url);
				console.log("Appool started on: %j", url);
				//needed because of async npm callbacks 
				setTimeout(function () {
					concast.getTimeframe(function (time) {
						test.equals(time, 17);
						appool.getServer().close();
						test.done();
					});
				}, 1000);
			});
		}
	};

})();
