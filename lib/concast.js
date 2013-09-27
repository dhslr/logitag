(function () {
	"use strict";
	var config = require("../config/default.js"),
		_ = require("lodash"),
		restify = require("restify"),
		grammar = require("./grammar.js"),
		url = require("url"),
		util = require("util"),
		EventEmitter = require("events").EventEmitter,
		Concast;


	Concast = function () {
		var self = this,
		interval_fn,
		interval,
		update_sources,
		update_tags,
		parse,
		window_size = config.window_size,
		appool_client,
		appool_url = config.appool_url,
		last_tags = [],
		last_apps = {},
		started = false,
		sources = [];
		
		EventEmitter.call(this);
		
		this.start = function () {
			interval = setInterval(interval_fn, window_size);
			started = true;
			if (!_.isUndefined(appool_url)) {
				appool_client = restify.createJsonClient({
					url: appool_url.href
				});
			}
		};

		this.stop = function () {
			clearInterval(interval);
			started = false;
			if (!_.isUndefined(appool_client)) {
				appool_client.close();
			}
		};

		this.setAppoolUrl = function (new_url) {
			appool_url = url.parse(new_url);
			self.stop();
		};

		parse = function (sub_tree) {
			if (_.isArray(sub_tree) && sub_tree.length > 1 && sub_tree[0] === "url") {
				return [{name: sub_tree[1][0], url: url.parse(sub_tree[1][1])}].concat(parse(sub_tree[1][2]));
			} else {
				return [];
			}
		};

		update_sources = function (apps) {
			var equal = false,
				tmp = {};

			//console.log(apps);
			// only update when there were changes 
			equal = _.every(apps, function (app, idx) {
				return _.isEqual(app, last_apps[idx]);
			});

			if (!equal) {
				last_apps = apps;
				_.forEach(apps, function (app) {
					var tree = grammar.parse(app.rule),
						src = parse(tree);
					_.forEach(src, function (source) {
						tmp[source.name] = source.url;
					});
				});	

				sources = tmp;
				_.forEach(sources, function (source) {
					source.jsonClient = restify.createJsonClient({
						url: source.href
					});
				});
			}
		};

		update_tags = function () {
			if (!_.isUndefined(appool_client)) {
				appool_client.get("/apps", function (err, req, res, obj) {
					if (_.isArray(obj)) {
						update_sources(obj);
					}
					_.forEach(sources, function (src, name) {
						src.jsonClient.get(src.path, function (err, req, res, obj) {
							if(err) {
								console.log("cannot reach context source %j", err);
							} else {
								var tag = {};
								tag[name] = obj;
								last_tags.push(tag);
							}
						});
					});
				});
			} 
		};

		interval_fn = function () {
			if (last_tags.length > 0) {
				//TODO: no source necessary?
				self.emit("newTags", last_tags);
				last_tags = [];
			}
			update_tags();
		};
	};
	util.inherits(Concast, EventEmitter);

	module.exports = new Concast();
})();
