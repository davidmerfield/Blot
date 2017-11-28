var server = require('./lib/host');
module.exports = function(options) {
	if(!options || !options.repos) {
		throw new Error("Options must be object with at least .repos property");
	} else {
		logging = (options.logging) ? options.logging : false;
		repoLocation = (options.repoLocation) ? options.repoLocation : '/tmp/repos';
		port = (options.port) ? options.port : 7000;
		certs = (options.certs) ? options.certs : null;
		http_api = (options.httpApi) ? options.httpApi : false;
		return new server(options.repos, logging, repoLocation, port, certs, http_api);
	}
}