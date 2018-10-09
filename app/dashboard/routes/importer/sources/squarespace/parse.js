var moment = require("moment");
var join = require("path").join;
var helper = require("../../helper");

var _ = require("lodash");
var to_markdown = helper.to_markdown;
var each_el = helper.each_el;
var insert_metadata = helper.insert_metadata;
var Extract = helper.extract;
var download_images = helper.download_images;
var insert_video_embeds = helper.insert_video_embeds;
var determine_path = helper.determine_path;
var fix_missing_p_tags = require("./fix_missing_p_tags");
var fix_markdown_bs = require("./fix_markdown_bs");
var write = helper.write;

module.exports = function($, output_directory, callback) {
  var blog = {
    title: $("title")
      .first()
      .text(),
    host: $("link")
      .first()
      .text(),
    posts: []
  };

  each_el(
    $,
    "item",
    function(el, next) {
      var content, status, post_type, page, draft, dateStamp, tags, title;
      var path_without_extension, post, created, updated, metadata;

      var extract = new Extract($, el);

      post_type = extract("wp:post_type")
        .trim()
        .toLowerCase();

      // Ignore these
      if (["nav_menu_item", "attachment", "feedback"].indexOf(post_type) > -1)
        return next();

      status = extract("wp:status")
        .trim()
        .toLowerCase();

      page = post_type === "page";
      draft = status === "draft" || status === "private";

      if (status === "pending") return next();

      dateStamp = created = updated = moment(extract("pubDate")).valueOf();
      tags = _.uniq(extract("category", true));
      title = extract("title");

      if (!title) {
        // console.log($.html(el));
        // throw '';
      }

      content = extract("content:encoded");
      content = insert_video_embeds(content);
      content = remove_caption(content);

      metadata = {};

      path_without_extension = join(
        output_directory,
        determine_path(title, page, draft, dateStamp)
      );

      post = {
        draft: draft,
        page: page,

        // We don't know any of these properties
        // as far as I can tell.
        name: "",
        permalink: "",
        summary: "",
        path: path_without_extension,

        title: title,

        dateStamp: dateStamp,
        created: created,
        updated: updated,
        tags: tags,
        metadata: metadata,

        // Clean up the contents of the <content>
        // tag. Evernote has quite a lot of cruft.
        // Then convert into Markdown!
        html: content
      };

      download_images(post, function(err, post) {
        if (err) console.log(err);

        post.html = fix_missing_p_tags(post.html);
        post.html = fix_markdown_bs(post.html);

        post.content = to_markdown(post.html);

        insert_metadata(post);

        write(post, next);
      });
    },
    callback.bind(this, null, blog)
  );
};

function remove_caption(content) {
  while (content.indexOf("[caption") > -1) {
    var opening_index = content.indexOf("[caption");
    var remainder = content.slice(opening_index);
    var closing_index = remainder.indexOf("]");

    content =
      content.slice(0, opening_index) +
      content.slice(opening_index + closing_index + 1);
    content = content.split("[/caption]").join("");
  }

  return content;
}
