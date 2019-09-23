var fs = require("fs-extra");
var join = require("path").join;
var moment = require("moment");
var helper = require("../../helper");

var extract_tags = require("./extract_tags");
var extract_author = require("./extract_author");

var forEach = helper.for_each;
var download_images = helper.download_images;
var resolve_url = helper.resolve_url;
var determine_path = helper.determine_path;
var insert_metadata = helper.insert_metadata;
var to_markdown = helper.to_markdown;

module.exports = function(blog, output_directory, callback) {
  forEach(
    blog.posts,
    function(post, next) {
      var created, updated, metadata, path;
      var title, dateStamp, tags, draft, page, html;

      title = post.title;

      // we need to extract tags seperately
      tags = extract_tags(post, blog);

      metadata = {};

      // It seems like Evernote offers author metadata,
      // so store it just in case it's useful.
      if (extract_author(post, blog))
        metadata.author = extract_author(post, blog);

      draft = post.status === "draft" || post.visibility !== "public";
      page = !!post.page;
      created = moment(post.created_at).valueOf();
      updated = moment(post.updated_at || post.created_at).valueOf();
      dateStamp = moment(
        post.published_at || post.created_at || post.updated_at
      ).valueOf();

      html = post.html;

      if (post.feature_image) {
        metadata.thumbnail = require("url").resolve(
          "http://www.kingigilbert.com/",
          post.feature_image
        );
      }

      html = resolve_url("http://www.kingigilbert.com/", html);
      path = join(
        output_directory,
        determine_path(title, page, draft, dateStamp)
      );

      // Add the new post to the list of posts!
      post = {
        draft: draft,
        page: page,

        // We don't know any of these properties
        // as far as I can tell.
        name: "",
        permalink: "",
        summary: "",
        path: path,

        title: title,

        dateStamp: dateStamp,
        created: created,
        updated: updated,
        tags: tags,
        metadata: metadata,
        html: html
      };

      download_images(post, function(err, post) {
        if (err) return callback(err);

        // Clean up the contents of the <content>;
        // tag. Evernote has quite a lot of cruft.
        // Then convert into Markdown!
        post.content = to_markdown(post.html);

        post = insert_metadata(post);

        fs.outputFile(post.path, post.content, function(err) {
          if (err) return callback(err);

          next();
        });
      });
      // When all the notes have been processed,
      // send them back with the rest of the blog!
    },
    callback.bind(this, null, blog)
  );
};
