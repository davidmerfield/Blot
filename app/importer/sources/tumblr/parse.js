var fs = require('fs-extra');
var helper = require('../../helper');
var for_each = helper.for_each;
var download_images = helper.download_images;
var to_markdown = helper.to_markdown;
var determine_path = helper.determine_path;
var insert_metadata = helper.insert_metadata;
var join = require('path').join;

function photo (post) {
  var content = '';


  post.photos.forEach(function(photo){

    content += '<img src="' + photo.original_size.url + '" alt="'+ photo.caption + '">\n\n';
  });


  return content;
}

function text (post) {
  var content = '<img src="">';
  return post.body;
}

function main (blog, output_directory, callback) {

  for_each(blog.posts, function(post, next){

    var created, updated, path_without_extension;
    var dateStamp, tags, draft, page, path, metadata;
    var content, title, html, url;

    if (post.type === 'photo') {
      content = photo(post);
    } else if (post.type === 'text') {
      content = text(post);
    } else {
      console.log(post);
      throw '';
    }

    title = post.title || post.source_title || post.photos[0].caption || post.id.toString();

    if (!title) {
      console.log(post.photos);
      throw '';
    }

    html = post.html;
    url = post.url;
    
    created = updated = dateStamp = post.timestamp * 1000;
    draft = page = false;
    metadata = {};
    tags = post.tags;
    path_without_extension = join(output_directory, determine_path(title, page, draft, dateStamp));

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
        throw e;
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
        metadata: metadata,
        
        // Clean up the contents of the <content>
        // tag. Evernote has quite a lot of cruft.
        // Then convert into Markdown!
        content: content
      };

      post = insert_metadata(post);

      // console.log(content);

      console.log('...', post.path);
      fs.outputFile(post.path, post.content, function(err){
        
        if (err) return callback(err);

        next();
      });
    });
  }, function(){

    callback();
  });
}

if (require.main === module) {

  var source_file = process.argv[2];
  var output_directory = process.argv[3];

  if (!source_file) throw new Error('Please pass source file JSON as first argument');
  if (!output_directory) throw new Error('Please pass output directory to write blog to as second argument');

  var blog = fs.readJsonSync(source_file);

  blog.posts = blog.posts.slice(0, 20);

  blog.posts = blog.posts.map(function(post){
    delete post.reblog;
    delete post.can_reply;
    delete post.date;
    delete post.blog_name;
    delete post.reblog_key;
    delete post.short_url;
    delete post.can_reblog;
    delete post.is_blocks_post_format;
    delete post.recommended_source;
    delete post.recommended_color;
    delete post.note_count;
    delete post.can_send_in_message;
    delete post.can_like;
    delete post.display_avatar;
    delete post.trail;
    return post;
  });


  main(blog, output_directory, function(err){

    if (err) throw err;

    process.exit();
  });
}
