var moment = require("moment");
var join = require("path").join;
var helper = require("../../helper");

var _ = require("lodash");
var to_markdown = helper.to_markdown;
var insert_metadata = helper.insert_metadata;
var download_pdfs = require("./download_pdfs");
var Extract = helper.extract;
var download_images = helper.download_images;
var insert_video_embeds = helper.insert_video_embeds;
var determine_path = helper.determine_path;
var fix_missing_p_tags = require("./fix_missing_p_tags");
var fix_markdown_bs = require("./fix_markdown_bs");
var write = helper.write;

module.exports = function(el, next) {
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
  title = extract("title").trim();
  var slug;

  if (!title.trim()) {
    slug = require("path").parse(
      require("path").basename(extract("wp:post_name") || extract("link"))
    ).name;
  }

  content = extract("content:encoded");
  content = insert_video_embeds(content);
  content = remove_caption(content);

  metadata = {};

  path_without_extension = join(
    output_directory,
    determine_path(title, page, draft, dateStamp, slug)
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

  var timeout = setTimeout(function() {
    console.log("TIMEOUT?", post);
    then(null, post);
  }, 60 * 1000);

  function then(err, post) {
    download_images(post, function(err, post) {
      if (err) console.log(err);

      download_pdfs(post, function(err, post) {
        if (err) console.log(err);

        post.html = fix_missing_p_tags(post.html);
        post.html = fix_markdown_bs(post.html);

        if (post.html.indexOf("\\_") > -1) {
          console.warn("CONTAINS MARKDOWN? PRE MARKDOWN:", post.html);
        }

        post.content = to_markdown(post.html);

        insert_metadata(post);

        clearTimeout(timeout);

        write(post, next);
      });
    });
  }
};
