var fs = require("fs-extra");
var helper = require("helper");
var ensure = helper.ensure;
var LocalPath = helper.localPath;
var extname = require("path").extname;
var exec = require("child_process").exec;
var cheerio = require("cheerio");
var Metadata = require("../../metadata");
var extend = helper.extend;
var join = require("path").join;
var config = require("config");
var pandoc_path = config.pandoc_path;

function is(path) {
  return [".odt"].indexOf(extname(path).toLowerCase()) > -1;
}

function TempDir() {
  return helper.tempDir() + helper.makeUid(20);
}

function read(blog, path, options, callback) {
  ensure(blog, "object")
    .and(path, "string")
    .and(options, "object")
    .and(callback, "function");

  var localPath = LocalPath(blog.id, path);

  var outDir = TempDir();
  var outPath = outDir + "/out.html";

  var blogDir = join(config.blog_static_files_dir, blog.id);
  var assetDir = join(blogDir, "_assets");

  fs.ensureDir(outDir, function(err) {
    if (err) return callback(err);

    fs.stat(localPath, function(err, stat) {
      if (err) return callback(err);

      var args = [
        '"' + localPath + '"',
        "-o",
        '"' + outPath + '"',
        "--extract-media=" + assetDir,
        "-f",
        "odt+backtick_code_blocks",
        "-t",
        "html5",
        "-s"
      ].join(" ");

      exec(pandoc_path + " " + args, function(err, stdout, stderr) {
        if (err) {
          return callback(
            new Error(
              "Pandoc exited with code " + err + " and message " + stderr
            )
          );
        }

        fs.readFile(outPath, "utf-8", function(err, html) {
          var $ = cheerio.load(html, { decodeEntities: false });

          // all p that contain possible metadata are checked until one is encountered that does not
          // p that are entirely bold are turned into h tags
          // first p that is entirely bold is h1, next are all h2

          var metadata = {};

          $("p").each(function(i) {
            if ($(this).children().length) return false;

            if (i === 0 && $(this).prev().length) {
              return false;
            }

            var text = $(this).text();

            if (text.indexOf(":") === -1) return false;

            var key = text.slice(0, text.indexOf(":"));

            // Key has space
            if (/\s/.test(key.trim())) return false;

            var parsed = Metadata(text);

            if (parsed.html === text) return false;

            extend(metadata).and(parsed.metadata);

            $(this).remove();
          });

          var titleTag = $("header h1");

          $("header").replaceWith(titleTag);

          // find titles
          // this is possibly? span id="h.ulrsxjddh07w" class="anchor">
          $("p").each(function() {
            var text = $(this).text();
            var strong = $(this).find("strong");
            var strongText = strong.text();
            var children = $(this).children();
            var hasH1 = $("body h1").length;

            if (
              children.length === 1 &&
              text &&
              strongText &&
              text === strongText
            ) {
              var title = $("<h1>");

              if (hasH1) title = $("<h2>");

              title.html(strong.html());

              $(this).replaceWith(title);
            }
          });

          $("a").each(function() {
            var text = $(this).text();
            var em = $(this).find("em");
            var emText = em.text();
            var children = $(this).children();

            if (children.length === 1 && text && emText && text === emText)
              $(this).html(em.html());
          });

          $("li").each(function() {
            var text = $(this).text();
            var blockquote = $(this).find("blockquote");
            var blockquoteText = blockquote.text();
            var children = $(this).children();

            if (
              children.length === 1 &&
              text &&
              blockquoteText &&
              text === blockquoteText
            )
              $(this).html(blockquote.html());
          });

          // fix image links etc...

          $("img").each(function() {
            var src = $(this).attr("src");

            if (src.indexOf(blogDir) === 0)
              $(this).attr("src", src.slice(blogDir.length));
          });

          html = $("body")
            .html()
            .trim();

          var metadataString = "<!--";

          for (var i in metadata)
            metadataString += "\n" + i + ": " + metadata[i];

          if (metadataString !== "<!--") {
            metadataString += "\n-->\n";
            html = metadataString + html;
          }

          return callback(null, html, stat);
        });
      });
    });
  });
}

module.exports = { read: read, is: is };
