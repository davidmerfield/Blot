const colors = require("colors/safe");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const parseCSS = require("css");
const crawl = require("./crawl");

const shouldSkip = (selector) => {
	let shouldSkip = false;

	["@font-face", "@import", "working", "placeholder", "details"].forEach(
		(skippable) => {
			if (selector.indexOf(skippable) > -1) shouldSkip = true;
		}
	);

	return shouldSkip;
};

const normalizeSelector = (selector) => {
	[":focus-within", ":focus", ":before", ":after", ":hover", ":active"].forEach(
		(remove) => (selector = selector.split(remove).join(""))
	);

	selector = selector;

	return selector;
};

const CSS_DIR = require("path").resolve(
	"/",
	__dirname + "/../../app/brochure/views/css"
);

const CSS_FILES = [
	"blot.css",
	"breadcrumbs.css",
	"header.css",
	"inputs.css",
	"sidebar.css",
];

const CSS = CSS_FILES.map((filename) =>
	fs.readFileSync(CSS_DIR + "/" + filename, "utf-8")
);

const PARSED_CSS = CSS.map((css) => parseCSS.parse(css));

console.log('Crawling HTML on site...');

crawl(function (err, HTML) {
	const $ = cheerio.load(HTML);

	PARSED_CSS.forEach(function (obj, i) {
		obj.stylesheet.rules.forEach(function sortRules(rule) {
			// Recurse into the rules inside @media {} query blocks
			if (rule.type === "media") return rule.rules.forEach(sortRules);

			if (rule.type !== "rule") return;

			rule.selectors = rule.selectors.filter(function (selector) {
				if (shouldSkip(selector)) return;

				if ($(normalizeSelector(selector)).length > 0) return;

				console.log();
				console.log(
					colors.red(selector),
					colors.dim("normalized=" + normalizeSelector(selector))
				);
				console.log(
					colors.dim(
						CSS_DIR + "/" + CSS_FILES[i] + ":" + rule.position.start.line
					)
				);
			});
		});
	});
});
