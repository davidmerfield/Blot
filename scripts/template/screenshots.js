const helper = require("helper");
const screenshot = helper.screenshot;
const async = require("async");
const config = require("config");
const VIEW_DIRECTORY = helper.rootDir + "/app/brochure/views/templates";

async.eachOfSeries(
	{
		diary: {
			handle: "bjorn",
			pages: ["/", "/search?q=fishing"],
		},
		essay: {
			handle: "interviews",
			pages: ["/", "/ingrid-newkirk"],
		},
		magazine: {
			handle: "interviews",
			pages: ["/", "/archives"],
		},
		picture: {
			handle: "bjorn",
			pages: ["/", "/archives"],
		},
		scrapbook: {
			handle: "ferox",
			pages: ["/", "/iems-l13-3"],
		},
	},
	function({ handle, pages }, template, next) {
		const baseURL = `https://preview-of-${template}-on-${handle}.${config.host}`;
		async.eachSeries(
			pages,
			function(page, next) {
				const url = baseURL + page;
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
