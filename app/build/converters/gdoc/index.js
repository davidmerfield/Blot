const fs = require("fs-extra");
const ensure = require("helper/ensure");
const LocalPath = require("helper/localPath");
const extname = require("path").extname;
const cheerio = require("cheerio");
const hash = require("helper/hash");
const fetch = require("node-fetch");
const { join } = require("path");
const config = require("config");
const sharp = require("sharp");
        
function is(path) {
  return [".gdoc"].indexOf(extname(path).toLowerCase()) > -1;
}

async function read(blog, path, options, callback) {
  ensure(blog, "object")
    .and(path, "string")
    .and(options, "object")
    .and(callback, "function");

  try {
    const localPath = LocalPath(blog.id, path);
    const blogDir = join(config.blog_static_files_dir, blog.id);
    const assetDir = join(blogDir, "_assets", hash(path));

    const stat = await fs.stat(localPath);

    // Don't try and turn HTML exported from a google doc into posts
    // if it's over 5MB in size
    if (stat && stat.size > 5 * 1000 * 1000)
      return callback(new Error("Google Doc export HTML too big"));

    const contents = await fs.readFile(localPath, "utf-8");

    const $ = cheerio.load(contents, { decodeEntities: false });

    // replaces google docs 'titles' with true h1 tags
    $("p.title").each(function (i, elem) {
      $(this).replaceWith("<h1>" + $(this).html() + "</h1>");
    });

    // replaces google docs 'subtitles' with true h2 tags
    $("p.subtitle").each(function (i, elem) {
      $(this).replaceWith("<h2>" + $(this).html() + "</h2>");
    });

    // remove all inline style attributes
    $("[style]").removeAttr("style");
    
    const images = [];

    $("img").each(function (i, elem) {
      images.push(elem);
    });

    for (const elem of images) {

      const src = $(elem).attr("src");

      try {
        const res = await fetch(src);
        const disposition = res.headers.get("content-disposition");
        const buffer = await res.buffer();

        let ext;

        try {

         ext = disposition
          .split(";")
          .find((i) => i.includes("filename"))
          .split("=")
          .pop()
          .replace(/"/g, "")
          .split(".")
          .pop();
        } catch (err) {}

        if (!ext) {
          // use sharp to determine the image type
          const metadata = await sharp(buffer).metadata();
          ext = metadata.format;
        }

        const filename = hash(src) + "." + ext;
        await fs.outputFile(join(assetDir, filename), buffer);
        $(elem).attr("src", "/_assets/" + hash(path) + "/" + filename);

      } catch (err) {
  console.log(err)        
      }
    }

    const html = $("body").html();

    callback(null, html, stat);
  } catch (err) {
    callback(err);
  }
}

module.exports = { read: read, is: is };
