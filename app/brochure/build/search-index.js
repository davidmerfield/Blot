const cheerio = require("cheerio");
const elasticlunr = require("elasticlunr");
const fs = require("fs-extra");

let index;

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
    const id = path;
    const title = $("h1").text();
    const doc = { id, title, body };
    console.log("adding", doc);
    index.addDoc(doc);
  },
  write: (path) => {
    fs.outputJSONSync(path, index.toJSON());
  },
};
