const helper = require("helper");
const screenshot = helper.screenshot;
const hash = helper.hash;
const async = require("async");
const config = require("config");
const VIEW_DIRECTORY = helper.rootDir + "/app/brochure/views/templates";

async.eachOfSeries(
	{
		diary: {
			handle: "bjorn",
			pages: ["/"],
		},
		essay: {
			handle: "interviews",
			pages: ["/"],
		},
		magazine: {
			handle: "interviews",
			pages: ["/"],
		},
		picture: {
			handle: "ferox",
			pages: ["/"],
		},
		scrapbook: {
			handle: "ferox",
			pages: ["/"],
		},
	},
	function({ handle, pages }, template, next) {
		const baseURL = `https://preview-of-${template}-on-${handle}.${config.host}`;
		async.eachSeries(
			pages,
			function(page, next) {
				const url = baseURL + pages;
				const path = `${VIEW_DIRECTORY}/${template}/${handle}-${pages.indexOf(
					page
				)}.png`;
				console.log(url);
				console.log(path);
				screenshot(url, path, next);
			},
			next
		);
	},
	function(err) {
		if (err) throw err;
		console.log("Done!");
		process.exit();
	}
);
