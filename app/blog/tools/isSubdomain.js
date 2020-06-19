const config = require("config");

module.exports = function isSubdomain(host) {
	return (
		host.slice(-config.host.length) === config.host &&
		host.slice(0, -config.host.length).length > 1
	);
};
