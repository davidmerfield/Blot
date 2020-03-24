const key = require("./key");
const client = require("client");
const Route = require("route-parser");
const debug = require("debug")("template:getViewByRoute");

module.exports = function getViewByRoute(templateID, url, callback) {
	debug(templateID, url);

	client.hgetall(key.routes(templateID), function(err, routes) {
		if (err || !routes) {
			debug("no routes set for template");
			return callback(null);
		}

		debug(routes);

		if (routes[url]) {
			debug("matched exactly", routes[url]);
			return callback(null, routes[url], {});
		}

		for (let route in routes) {
			debug(route);
			const match = new Route(route).match(url);

			debug("match", match);
			if (match) return callback(null, routes[route], match);
		}
		
		debug("failed to find a match");
		return callback(null);
	});
};
