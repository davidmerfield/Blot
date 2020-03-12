const cheerio = require("cheerio");
const makeSlug = require("helper").makeSlug;
const fs = require("fs-extra");

module.exports = function onThisPage(req, res, next) {
	const render = res.render;
	const send = res.send;

	res.send = function(string) {
		const html = string instanceof Buffer ? string.toString() : string;
		const $ = cheerio.load(html, { decodeEntities: false });
		$("h1,h2,h3").each((i, el) => {
			const text = $(el).text();
			const id = $(el).attr("id") || makeSlug(text);
			$(el).attr("id", id || makeSlug(text));
			const innerHTML = $(el).html();
			$(el).html(`<a href="#${id}">${innerHTML}</a>`);
		});

		send.call(this, $.html());
	};

	res.render = function(view, locals, partials) {
		const html = loadView(req.app.get("views"), view);
		const $ = cheerio.load(html, { decodeEntities: false });
		const headers = [];

		$("h1,h2,h3").each(function(i, el) {
			const text = $(el).text();
			const id = $(el).attr("id") || makeSlug(text);
			headers.push({ text: text, id: id });
		});

		res.locals.headers = headers;

		render.call(this, view, locals, partials);
	};

	next();
};

function loadView(directory, identifier) {
	const candidates = [
		identifier,
		identifier + ".html",
		identifier + "/index.html"
	];

	let html;

	while (candidates.length && !html) {
		let candidate = candidates.pop();
		try {
			html = fs.readFileSync(directory + "/" + candidate, "utf8");
		} catch (e) {}
	}

	return html;
}
