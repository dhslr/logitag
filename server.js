(function () {
	"use strict";
	var logitag = require("./logitag.js"),
		port = process.argv[2] || 0;
	logitag.listen(port, function (url) {
		console.log("Logitag listening on " + url);
	});
	logitag.executionEmitter.on("error", function (err) {
		console.log(err);
		throw err;
	});
})();
