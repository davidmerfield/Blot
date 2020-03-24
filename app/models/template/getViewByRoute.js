var key = require("./key");
var client = require("client");
var Route = require("route-parser");

module.exports = function getViewByRoute(templateID, url, callback) {
	client.hgetall(key.routes(templateID), function(err, routes) {
		for (let route in routes) {
			const match = new Route(route).match(url);
			if (match) return callback(null, routes[route], match);
		}
		return callback(null);
	});
};
