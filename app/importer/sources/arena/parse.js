var fs = require('fs-extra');
var join = require('path').join;
var helper = require('../../helper');

var determine_path = helper.determine_path;
var download_images = helper.download_images;
var write = helper.write;
var insert_metadata = helper.insert_metadata;
var to_markdown = helper.to_markdown;
var for_each = helper.for_each;

function main (output_directory, posts, callback) {

  var done = 0;

  for_each(posts, function(post, next){

    // We'll only use image posts for now, would be nice to remove this in future...
    if (!post.image) return next();

    var created, updated, path_without_extension;
    var dateStamp, draft, page, metadata, summary;
    var content, title, html, url;
    
    content = '';

    if (post.image) content += '<img src="' + post.image.original.url + '">\n\n';

    content += (post.content_html || '') + (post.description_html || '');

    title = post.title || post.generated_title || 'Untitled';
    html = post.html;
    url = post.url;
    created = updated = dateStamp = (new Date(post.created_at)).valueOf();
    draft = page = false;
    path_without_extension = join(output_directory, determine_path(title, page, draft, dateStamp));

    post = {

      draft: false,
      page: false,

      // We don't know any of these properties
      // as far as I can tell.
      name: '',
      permalink: '',
      summary: summary,
      path: path_without_extension,
      html: content,
      title: title,
      
      dateStamp: dateStamp,
      created: created,
      updated: updated,
      tags: [],
      metadata: metadata,
      
      // Clean up the contents of the <content>
      // tag. Evernote has quite a lot of cruft.
      // Then convert into Markdown!
      content: content
    };

    download_images(post, function(err, post){

      if (err) throw err;
    
      post.content = to_markdown(post.html);
      // post = insert_metadata(post);

      console.log(++done + '/' + posts.length, '...', post.path);
      
      write(post, function(err){
        
        if (err) return callback(err);

        next();
      });
    });          
  }, function(){
    callback(null);
  });
}


if (require.main === module) {

  var input_file = process.argv[2];
  var output_directory = process.argv[3];

  if (!input_file) throw new Error('Please pass filename to read links to as first argument');
  if (!output_directory) throw new Error('Please pass output directory as second argument');

  var posts = fs.readJsonSync(input_file);

  console.log('!!!!! generating trimmed version of site');
  posts = posts.slice(0, 400);

  fs.emptyDir(output_directory, function(err){

    if (err) throw err;

    main(output_directory, posts, function(err){

      if (err) throw err;

      console.log('Complete!');
    });
  });
}

module.exports = main;