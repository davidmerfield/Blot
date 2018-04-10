var join = require('path').join;

var readability = require('node-readability');
var moment = require('moment');
var fs = require('fs-extra');

var helper = require('../../helper');

var each_el = helper.each_el;
var Extract = helper.extract;
var insert_video_embeds = helper.insert_video_embeds;
var determine_path = helper.determine_path;
var download_images = helper.download_images;
var insert_metadata = helper.insert_metadata;
var to_markdown = helper.to_markdown;

module.exports = function ($, output_directory, callback) {

  var blog = {
    title: $('title').first().text(),
    host: $('link').first().text(),
    posts: []
  };

  each_el($, 'item', function(el, next){

    var extract, created, updated, path_without_extension, content;
    var title, dateStamp, tags, draft, page, html, post, path;

    extract = Extract($, el);
    title = extract('title');
    tags = extract('category');
    created = updated = dateStamp = moment(extract('pubDate')).valueOf();
    path_without_extension = join(output_directory, determine_path(title, page, draft, dateStamp));

    readability(extract('link'), function(err, article) { // third arg: meta
        
      if (err) return callback(err);

      content = article.content;

      console.log(content);

      content = insert_video_embeds(content);

      download_images(content, path_without_extension, function(err, content, has_images){

        if (err) throw err;

        if (has_images) {
          path = path_without_extension + '/post.txt';
        } else {
          path = path_without_extension + '.txt';
        }

        try {
          content = to_markdown(content);
        } catch (e) {
          
        }

        // Add the new post to the list of posts!
        post = {

          draft: false,
          page: false,

          // We don't know any of these properties
          // as far as I can tell.
          name: '',
          permalink: '',
          summary: '',
          path: path,

          title: title,
          
          dateStamp: dateStamp,
          created: created,
          updated: updated,
          tags: tags,
          metadata: {},
          
          // Clean up the contents of the <content>
          // tag. Evernote has quite a lot of cruft.
          // Then convert into Markdown!
          content: content
        };

        post = insert_metadata(post);

        fs.outputFile(post.path, post.content, function(err){
          
          if (err) return callback(err);

          next();
        });
      });
    });
  }, function(){

    callback(null, blog);

  });
};