const cheerio = require("cheerio");
const elasticlunr = require("elasticlunr");
const fs = require("fs-extra");

let index;

const metadata = {};

module.exports = {
  init: () => {
    index = elasticlunr(function () {
      this.addField("title");
      this.addField("body");
      this.setRef("id");
      this.saveDocument(false);
    });
  },
  add: (path, html) => {
    const $ = cheerio.load(html, { decodeEntities: false });
    const body = $.text();
    const id = path.endsWith("/index.html")
      ? path.slice(0, path.indexOf("/index.html"))
      : path.slice(0, path.indexOf(".html"));
    const title = $("h1").text();
    const doc = { id, title, body };
    metadata[id] = { title };
    index.addDoc(doc);
  },
  write: (path) => {
    const result = {metadata, ...index.toJSON()};
    fs.outputJSONSync(path, result);
  },
};
