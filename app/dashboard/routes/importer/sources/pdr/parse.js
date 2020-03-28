var fs = require("fs-extra");
var join = require("path").join;
var cheerio = require("cheerio");
var helper = require("../../helper");

var insert_video_embeds = helper.insert_video_embeds;
var determine_path = helper.determine_path;
var download_images = helper.download_images;
var insert_metadata = helper.insert_metadata;
var to_markdown = helper.to_markdown;
var for_each = helper.for_each;

var extract_author = require("./extract_author");
var extract_tags = require("./extract_tags");
var extract_summary = require("./extract_summary");
var find_thumbnail = require("./find_thumbnail");
var insert_disclaimer = require("./insert_disclaimer");
var tidy_figures = require("./tidy_figures");
var fix_azon = require("./fix_azon");
var fix_empty_public_domain_works = require("./fix_empty_public_domain_works");
var fix_broken_images = require("./fix_broken_images");
var tidy_footnotes = require("./tidy_footnotes");
var relative_links = require("./relative_links");

function main(output_directory, blog, callback) {
  var done = 0;

  for_each(
    blog.posts,
    function(post, next) {
      // console.log(post.title, post.url);

      var created, updated, path_without_extension, author;
      var dateStamp, tags, draft, page, metadata, summary;
      var $, content, title, html, url;

      content = post.content;
      title = post.title;
      html = post.html;
      url = post.url;

      var date_string = url
        .split("/")
        .slice(3, 6)
        .join("/");

      created = updated = dateStamp = new Date(date_string).valueOf();
      draft = page = false;
      metadata = {};
      tags = extract_tags(html);
      path_without_extension = join(
        output_directory,
        determine_path(title, page, draft, dateStamp)
      );

      content = insert_video_embeds(content);

      $ = cheerio.load(content, { decodeEntities: false });

      // author = extract_author($);
      // metadata.author = author || 'Adam Green';

      tidy_figures($);
      tidy_footnotes($);
      fix_azon($);
      fix_empty_public_domain_works($);
      fix_broken_images($);
      relative_links($, url);

      summary = extract_summary($);
      content = $.html();

      post = {
        draft: false,
        page: false,

        // We don't know any of these properties
        // as far as I can tell.
        name: "",
        permalink: "",
        summary: summary,
        path: path_without_extension,
        html: content,
        title: title,

        dateStamp: dateStamp,
        created: created,
        updated: updated,
        tags: tags,
        metadata: metadata,

        // Clean up the contents of the <content>
        // tag. Evernote has quite a lot of cruft.
        // Then convert into Markdown!
        content: content
      };

      download_images(post, function(err, post) {
        if (err) throw err;

        $ = cheerio.load(post.html, { decodeEntities: false });

        if (find_thumbnail($)) metadata.thumbnail = find_thumbnail($);

        post.content = to_markdown(post.html);
        post.content = insert_disclaimer(post.content);

        post = insert_metadata(post);

        console.log(++done + "/" + blog.posts.length, "...", post.path);
        fs.outputFile(post.path, post.content, function(err) {
          if (err) return callback(err);

          next();
        });
      });
    },
    function() {
      callback(null, blog);
    }
  );
}

if (require.main === module) {
  var input_file = process.argv[2];
  var output_directory = process.argv[3];
  var filter = process.argv[4];

  if (!input_file)
    throw new Error("Please pass filename to read links to as first argument");
  if (!output_directory)
    throw new Error("Please pass output directory as second argument");

  var blog = fs.readJsonSync(input_file);

  // console.log('!!!!! generating trimmed version of site');
  // blog.posts = blog.posts.slice(0, 100);

  if (filter)
    blog.posts = blog.posts.filter(function(post) {
      return (
        post.url
          .trim()
          .toLowerCase()
          .indexOf(filter) > -1
      );
    });

  fs.emptyDir(output_directory, function(err) {
    if (err) throw err;

    main(output_directory, blog, function(err) {
      if (err) throw err;

      console.log("Complete!");
    });
  });
}

module.exports = main;
