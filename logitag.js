/**
 * This is the main component of the logitag web service.
 * All the http requests are processed here.
 * @module logitag
 **/
(function ()  {
	"use strict";
	var restify = require("restify"),
		http_server = restify.createServer({name: "logitag"}),
		_clients = {},
		clients = [],
		get_apps,
		url = require("url"),
		_ = require("lodash"),
		config = require("./config/default.js"),
		appool = {},
		assert = require("assert"),
		evaluator = require("./lib/evaluator.js"),
		concast = require("./lib/concast.js"),
		utilities = require("utilities"),
		discovery = utilities.discovery_provider.createDefaultProvider(),
		pkgTransfer = utilities.pkg_transfer,
		kill_it,
		events = require("events"),
		emitter = new events.EventEmitter(),
		open_tag_window,
		close_tag_window,
		timers = {},	
		garbage_collect,
		update_clients;
	

	appool.url = config.appool_url;
	//mixin tags 
	//TOOD: does not get updated
	concast.on("newTags", function (tags) {
		_.forEach(_clients, function (client) {
			_.forEach(client.currentTagWindows, function (cWin) {
				_.extend(cWin.tags_obj, tags);
				cWin.size = cWin.size + tags.length;
			});
		});
	});
	concast.setAppoolUrl(appool.url);

	garbage_collect = function (client) {
		var timeframe,
			buffer = 5,
			n = 0;
		concast.getTimeframe(function (time) {
			timeframe = time*1000;
			if (Number.isFinite(timeframe) && timeframe > 0) {
				console.log("GBC!");
				// calculate frames to keep
				n = buffer + Math.ceil(timeframe / config.window_size);
				if (client.tags.length > n) {
					//keep only the n last elements
					client.tags = client.tags.slice((-1)*n);
				}
				global.gc();
			} 
		});
	};
	
	/**
	 * Override the standard window size.
	 * @param {Number} wz The new window "size" in ms.
	 * @method setWindowSize
	 **/
	exports.setWindowSize = function(wz) {
		config.window_size = wz;
	};

	/**
	 * Override the standard epsilon value.
	 * @param {Number} e The new epsilon in ms.
	 * @method setEpsilon
	 **/
	exports.setEpsilon = function (e) {
		config.window_epsilon = e;
	};

	get_apps = function (url, cb) {
		var json_client = restify.createJsonClient({
			url: url
		});	
		json_client.get("/apps", function (err, req, res, obj) {
			if (err) {
				console.log(err);
				throw err;
			} else {
				assert.ok(_.isArray(obj));
				if (typeof cb === "function") {
					cb(obj);
				}
			}
		});	
	};

	exports.executionEmitter = emitter;

	/**
	 * An array of clients logitag handles.
	 * @property clients
	 **/
	exports.clients = clients;

	exports.grammar = require("./lib/grammar.js");

	var ExecutionHandler = function () {
		var run,
			get_send,
			has_app,
			is_running,
			self = this;

		this.activate = function (app, client) {
			self.app = app;
			self.client = client;
			console.log("Activating app %j", app);
			is_running(function (res) {
				if (!res) {
					console.log("Not running");
					self.execute(self.app, self.client);
				}  else {
					console.log("Already running");
				}
			});
		};

		this.execute = function (app, client) {
			self.app = app;
			self.client = client;
			assert.ok(self.app);
			assert.ok(self.client);
			assert.ok(self.client.url);
			has_app(function (res) {
				if (res) {
					console.log("Client has app");
					run();
				} else {
					console.log("Client does not have app");
					if(config.deploy) {
						get_send();
					}
				}
			});
		};

		is_running = function (cb) {
			var running_apps,
				json_client = restify.createJsonClient({
					url: self.client.url
			});
			// check for running apps
			json_client.get("/running", function (err, req, res, obj) {
				var running = false;
				if (err) {
					emitter.emit("error",
						{error: err, client: self.client.url, app: self.app});
				} else {
					assert.ok(_.isArray(obj));
					running_apps = obj;
					for (var i = 0; !running && i < running_apps.length; i++) {
						//TODO: version cannot be checked
						running = (self.app.name === running_apps[i].name);
					}
				}
				json_client.close();
				cb(running);
			});
		};

		has_app = function (cb) {
			var client_apps,
				json_client = restify.createJsonClient({
					url: self.client.url
			});
			// check for existing apps on client
			json_client.get("/apps", function (err, req, res, obj) {
				var has_app = false;
				if (err) {
					emitter.emit("error", 
						{error: err, client: self.client.url, app: self.app});
				} else {
					assert.ok(_.isArray(obj));
					client_apps = obj;
					for (var i = 0, l = client_apps.length; !has_app && i < l; i ++) {
						var v = client_apps[i];
						if (v.name === self.app.name && 
							self.app.version === v.version) {
								has_app = true;
						}
					}
				}
				json_client.close();
				cb(has_app);
			});
		};

		get_send = function () {
			var _url = appool.url;
			pkgTransfer.download(_url, self.app.name, function (err, pkg_path) {
				if (err) {
					emitter.emit("error", 
						{error: err, client: self.client.url, app: self.app});
				} else {
					console.log("Downloaded app %j to %j", self.app.name, pkg_path);
					pkgTransfer.upload(self.client.url, pkg_path, function (err, data) {
						if (err) {
							console.log(err);
							emitter.emit("error", 
								{error: err, client: self.client.url, app: self.app});
						} else {
							console.log("Uploaded app %j", self.app);
							console.log(data);
							run();
						}
					});
				}
			});
		};

		run = function () {
			var json_client = restify.createJsonClient({
					url: self.client.url
			});
			json_client.post("/apps/" + self.app.name + "/run", {}, function (err, req, res, obj) {
				if (err) {
					json_client.close();
					emitter.emit("error", 
						{error: err, client: self.client.url, app: self.app});
				} else {
					json_client.close();
					console.log("Process created");
					console.log(obj);
					/*
					req.on("result", function (err, res) {
						if (err) {
							http_client.close();
							emitter.emit("error", 
								{error: err, client: self.client.url, app: self.app});
							//self.removeAllListeners();
						} else {
							res.on("data", function (chunk) {
								emitter.emit("data", 
									{data: chunk, client: self.client.url, app: self.app});
							});
							res.on("end", function () {
								http_client.close();
								emitter.emit("end",
									{client: self.client.url, app: self.app});
								//self.removeAllListeners();
							});
						}
					});
					*/
				}
			});
		};
	};


	http_server.use(restify.bodyParser());

	update_clients = function () {
		clients = [];
		for (var url in _clients) {
			if (_clients.hasOwnProperty(url)) {
				clients.push({
					tags: _clients[url].tags,
					url: url
				});
			}
		}
	};

	//TODO: move into executionHandler?
	kill_it = function (app, client) {
		var json_client = restify.createJsonClient({
				url: client.url
		});
		json_client.get("/running", function (err, req, res, obj) {
			var running_apps = obj;
			if (!err) {
				if (_.isArray(running_apps)) {
					for (var i = 0; i < running_apps.length; i++) {
						if (app.name === running_apps[i].name) {
							console.log("Killing %j", app.name);
							json_client.del("/running/" + running_apps[i].pid);
						}
					}
				}
			}
		});
	};

	close_tag_window = function (url) {
		var client = _clients[url];
		return function () {
			var tagWindow,
				tags = [],
				evaluateH,
				oldTags;
			//console.log("Closing tag window for %j", client.url);
			if (typeof client !== "undefined") {
				// remove oldest tag window
				if (client.currentTagWindows.length === 2) {
					// about to close first window, check second first
					if (client.currentTagWindows[1].size === 0) {
						// no new information, kill newly opened window
						timers[client].forEach(function (timer) {
							clearTimeout(timer);
						});
						timers[client] = [];
						//client.currentTagWindows.pop();
					}
				}
				tagWindow = client.currentTagWindows.shift();
				//console.log("Window: %j", tagWindow);
				if (typeof tagWindow !== "undefined") {
					for(var tag in tagWindow.tags_obj) {
						if (tagWindow.tags_obj.hasOwnProperty(tag)) {
							tags.push(tagWindow.tags_obj[tag]);
						}
					}
					if (client.tags.length > 0) {
						oldTags = client.tags[client.tags.length - 1];
						//assert(oldTags.length === 2);
						if (oldTags[0].length === 0) {
							// update time on old entry 
							oldTags[1] = (new Date()).valueOf();
							if (tags.length > 0) {
								// fill with new tag information
								oldTags[0] = tags;
							}
						} else {
							client.tags.push([tags, (new Date()).valueOf()]);
						}
					} else {
						client.tags.push([tags, (new Date()).valueOf()]);
					}
					//TODO: externalize threshold?
					if (++client.new_tags_count > 30) {
						client.new_tags_count = 0;
						garbage_collect(client);
					}
				}
				evaluateH = function (apps) {
					for (var i = 0, l = apps.length; i < l; i++) {
						var app = apps[i];
						if (evaluator.evaluate(app.rule, client.tags)) {
							// evaluated to true
							//TODO: move arguments to constructor
							client.executionHandler.activate(app, client, function () {
								exe.close();
							});
						} else {
							// evaluated to false
							//console.log("Killing app %j", app);
							//console.log(tags);
							kill_it(app, client);
						}	
					}
				};
				//TODO: more frequent updates necessary?
				// new tag set -> evaluate
				if (!config.deploy) {
					// check only apps installed on client
					if(_.isEmpty(client.installed_apps)) {
						get_apps(client.url, function (apps) {
							client.installed_apps = apps;
							evaluateH(client.installed_apps);
						});
					} else {
						evaluateH(client.installed_apps);
					}
				} else {
					if(_.isEmpty(appool.apps)) {
						get_apps(appool.url, function (apps) {
							appool.apps = apps;
							evaluateH(appool.apps);
						});
					} else {
						evaluateH(appool.apps);
					}
				}
				console.log("Last tag win: %j", client.tags[client.tags.length - 1]);
			}
		};
	};

	open_tag_window = function (url, tags) {
		var client = _clients[url];
		return function () {
			var size = 0,
				tags_obj = {};
			//console.log("Open TW: Client %j", client);
			if (typeof client !== "undefined") {
				if (_.isArray(tags)) {
					size = tags.length;
					tags.forEach(function (tag) {
						if (typeof tag === "object") {
							tags_obj[tag.name] = tag;
						} else {
							tags_obj[tag] = tag;
						}
					});
				}
				client.currentTagWindows.push({size: size, tags_obj: tags_obj});
				timers[client] = [];
				timers[client].push(
					setTimeout(open_tag_window(url), config.window_size)
				);
				setTimeout(close_tag_window(url), 
						config.window_epsilon + config.window_size);
			}
		};
	};

	http_server.post("/tags/upload", function (req, res, next) {
		var client,
			_url;
		//console.log(req.params);
		if (!req.is("json")) {
			res.send(new restify.InvalidContentError("expected json content type"));
		} else if (typeof req.params === "undefined") {
			res.send(new restify.InvalidContentError("could not parse json"));
		} else if (typeof req.params.port === "undefined") {
			res.send(new restify.MissingParameterError("port missing"));
		} else if (typeof req.params.tags === "undefined") {
			res.send(new restify.MissingParameterError("tags missing"));
		} else if (!_.isArray(req.params.tags)) {
			res.send(new restify.InvalidArgumentError("tags must be an array"));
		} else {
			//TODO: just assumes http
			_url = url.parse("http://" + req.connection.remoteAddress + ":" + req.params.port).href;
			//console.log("New Tags: %j", req.params.tags);
			//console.log("Url: %j", _url);
			//console.log("Requ from: %j", _clients[_url]);
			if (typeof _clients[_url] === "undefined") {
				_clients[_url] = {up: true, url: _url, tags: []};
				_clients[_url].currentTagWindows = [];
				_clients[_url].new_tags_count = 1;
				_clients[_url].executionHandler = new ExecutionHandler();
				setTimeout(open_tag_window(_url, req.params.tags), 0);
				update_clients();
			} else {
				client = _clients[_url];
				if (client.currentTagWindows.length === 0) {
					setTimeout(open_tag_window(_url, req.params.tags), 0);
				} else {
					_clients[_url].currentTagWindows.forEach(function (win) {
						req.params.tags.forEach(function (tag) {
							if (typeof tag === "object") {
								win.tags_obj[tag.name] = tag;
							} else {
								win.tags_obj[tag] = tag;
							}
							win.size = win.size + 1;
						});
					});	 
				}
			}
			//console.log("Client: %j", _clients[_url]);
			// no content response
			res.send(204);
		}
		return next();
	});
	http_server.get("/clients", function (req, res, next) {
		update_clients();
		res.send(clients);
		return next();
	});
	exports.listen = function (port, cb) {
		discovery.createAdvertisement(Number(port), "logitag");
		discovery.startAdvertising();
		http_server.listen(port, function () {
			if (typeof cb === "function") {
				cb(http_server.url);
			}
		});
	};
	discovery.createBrowser();
	discovery.on("up", function (service) {
		//console.log(service);
		var _url;
		if (typeof service.url !== "undefined" && 
				typeof service.name !== "undefined") {
			_url = url.parse(service.url).href;
			if (service.name === "berry") {
				console.log("Berry up %j", _url);
				if (typeof _clients[_url] === "undefined") {
					//_clients[_url] = {tags: [], url: _url, currentTagWindows: []};
					//update_clients();
					emitter.emit("clientsUpdate");
				}
				//_clients[_url].up = true;
				//setTimeout(open_tag_window(_url), 0);
			} else if (service.name === "appool") {
				console.log("Appool found %j", _url);
				appool.url = _url;
				concast.setAppoolUrl(appool.url);
				get_apps(_url, function (apps) {
					appool.apps = apps;
				});
			}
		}
	});
	discovery.on("down", function (service) {
		var _url;
		if (typeof service.url !== "undefined" &&
				typeof service.name !== "undefined") {
			if (service.name === "berry") {
				_url = url.parse(service.url).href;
				console.log("Berry down %j", _url);
				if (typeof _clients[_url] !== "undefined") {
					_clients[_url].up = false;
					clients = clients.filter(function (url) {
						return (url !== _url);
					});
					update_clients();
					emitter.emit("clientsUpdate");
					
				}
			} else if (service.name === "appool") {
				//appool_url = undefined;
				//TODO: what now?
			}
		}
	});
	discovery.startBrowsing();
})();
