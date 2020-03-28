var pretty = require("pretty");
var parse = require("url").parse;
var request = require("request");
var fs = require("fs-extra");
var SOURCES = require("./sources.json");

function fetch_source(host) {
  request("http://" + host, function(err, res, body) {
    if (err || !body) {
      console.log("HOST", host);
      return;
    }

    var $ = require("cheerio").load(body);
    var title = $("head title").text();

    if (title) SOURCES[host] = title;

    fs.outputJsonSync(__dirname + "/sources.json", SOURCES, { spaces: 2 });
  });
}
module.exports = function($) {
  $("figure, figcaption, figure img").each(function(i, el) {
    $(el).removeAttr("class");
  });

  $("figure").each(function(i, el) {
    $(el).replaceWith(pretty($.html(el)));
  });

  $("figure img").each(function(i, el) {
    $(el).removeAttr("width");
    $(el).removeAttr("height");
  });

  $("figcaption a").each(function(i, el) {
    // console.log('BEFORE:', parent.text().split('\n').join(''));

    if (
      $(el)
        .text()
        .toLowerCase()
        .indexOf("source") === -1
    )
      return;

    var host = $(el).attr("href");

    var parsed_host = parse(host);

    if (parsed_host.host) host = parsed_host.host;

    // Don't ask
    if (parsed_host.protocol === "file:") host = "commons.wikimedia.org";

    $(el).removeAttr("rel");
    $(el).removeAttr("target");

    if (el.prev.type === "text") {
      var data = el.prev.data;

      if (data.trim().slice(-1) === "—") {
        data = data.trim().slice(0, -1);
      }

      if (el.next.data.indexOf(".") > -1) data = data.trim() + ".";

      data += " ";

      el.prev.data = data;
    }

    if (el.next.type === "text") {
      $(el.next).remove();
    }

    if (SOURCES[host]) {
      host = SOURCES[host];
    } else {
      fetch_source(host);
    }

    $(el).text(host);

    $(el).replaceWith($("<cite>" + $.html(el) + "</cite>"));

    // console.log('AFTER:', parent.text().split('\n').join(''));
  });
};
