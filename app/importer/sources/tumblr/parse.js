var fs = require('fs-extra');
var string = require('string');
var API_KEY = fs.readFileSync(__dirname + '/secrets/api.key', 'utf-8');
var URL_TEMPLATE = "http://api.tumblr.com/v2/blog/{{url}}/{{resource}}?api_key={{API_KEY}}";
var request = require('request');
var helper = require('../../helper');
var for_each = helper.for_each;
var parse = require('url').parse;

var 

if (not.function(callback)) throw not.function(callback);

if (not.object(blog)) return callback(not.object(blog));

function main (blog, output_directory, callback) {

  var blog = {};

  source_url = tidy_source_url(source_url);

  get_info(source_url, function(err, info){

    if (err) return callback(err);

    get_posts(source_url, info.total_posts, function(err, posts){

      if (err) return callback(err);

      blog.title = info.title;
      blog.posts = posts;
      blog.host = parse(info.url).host;

      return callback(null, blog);
    });
  });
}

if (require.main === module) {

  var source_file = process.argv[2];
  var output_directory = process.argv[3];

  if (!source_file) throw new Error('Please pass source file JSON as first argument');
  if (!output_directory) throw new Error('Please pass output directory to write blog to as second argument');

  var blog = fs.readJsonSync(source_file);

  main(blog, output_directory, function(err){

    if (err) throw err;

    process.exit();
  });
}
