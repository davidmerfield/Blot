const cheerio = require("cheerio");
const makeSlug = require("helper/makeSlug");
const fs = require("fs-extra");

let SEND_CACHE = {};
let RENDER_CACHE = {};

module.exports = function onThisPage(req, res, next) {
  const render = res.render;
  const send = res.send;

  res.send = function (string) {
    req.trace("starting onThisPage send");
    string = string instanceof Buffer ? string.toString() : string;
    if (SEND_CACHE[string]) return send.call(this, SEND_CACHE[string]);

    let html = string;
    const $ = cheerio.load(html, { decodeEntities: false });
    $("h2:not(h1 + h2),h3").each((i, el) => {
      const text = $(el).text();
      const id = $(el).attr("id") || makeSlug(text);
      $(el).attr("id", id || makeSlug(text));
      const innerHTML = $(el).html();
      $(el).html(`<a href="#${id}">${innerHTML}</a>`);
    });

    html = $.html();
    req.trace("finished onThisPage send");
    send.call(this, html);
    SEND_CACHE[string] = html;
  };

  res.render = function (view, locals, partials) {
    req.trace("starting onThisPage render");
    const html = loadView(req.app.get("views"), view);

    if (!html) return next();

    // Allows us to specify our own headers dynamically
    if (res.locals.headers === undefined) {
      const $ = cheerio.load(html, { decodeEntities: false });
      const headers = [];

      $("h2,h3").each(function (i, el) {
        const text = $(el).text();
        const id = $(el).attr("id") || makeSlug(text);
        headers.push({ text: text, id: id });
      });

      res.locals.headers = headers;
    }

    req.trace("finished onThisPage render");
    render.call(this, view, locals, partials);
  };

  next();
};

function loadView(directory, identifier) {
  const candidates = [
    identifier,
    identifier + ".html",
    identifier + "/index.html",
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
