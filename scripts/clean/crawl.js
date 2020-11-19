const async = require("async");
const cheerio = require("cheerio");
const request = require("request");
const colors = require("colors");

request.defaults({
	strictSSL: false, // allow us to use our self-signed cert for testing
	rejectUnauthorized: false,
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs

if (require.main === module) {
	main(function (err, res) {
		if (err) throw err;
		console.log(res);
		console.log("Done!");
		process.exit();
	});
}

function main(callback) {
	let res = "";
	let checked = {};

	checkPage(null, "https://blot.development", function (err) {
		if (err) return callback(err);
		callback(null, "<html><body>" + res + "</body></html");
	});

	// add some items to the queue
	function checkPage(base, url, callback) {
		const pathname = require("url").parse(url).pathname;

		if (checked[pathname]) return callback();

		checked[pathname] = true;

		const URL = require("url");
		const parsedURL = URL.parse(url);
		const extension = require("path").extname(parsedURL.pathname);
		const uri = { url: url };

		if (extension) {
			console.log(colors.yellow("SKIP", parsedURL.pathname));
			return callback();
		}

		console.log(colors.dim(" GET " + parsedURL.pathname));

		request(uri, function (err, response) {
			if (err) return callback(err);

			if (response.statusCode !== 200 && response.statusCode !== 400) {
				return callback(new Error("bad status"));
			}

			if (
				response.headers["content-type"] &&
				response.headers["content-type"].indexOf("text/html") === -1
			) {
				return callback();
			}

			let $;

			try {
				$ = cheerio.load(response.body);
			} catch (e) {
				return callback(e);
			}

			// THIS IS HTML!
			console.log(colors.green(" GOT " + parsedURL.pathname));
			res += $("body").html();

			parseURLs(url, $, callback);
		});
	}

	function parseURLs(base, $, callback) {
		let URLs = [];

		$("[href],[src]").each(function () {
			let url = $(this).attr("href") || $(this).attr("src");

			if (!url) return;

			url = require("url").resolve(base, url);

			if (require("url").parse(url).host !== require("url").parse(base).host)
				return;

			URLs.push(url);
		});

		async.eachSeries(
			URLs,
			function (url, next) {
				checkPage(base, url, next);
			},
			callback
		);
	}
}

module.exports = main;
