var fs = require("fs-extra");
var string = require("string");
var API_KEY = process.env.BLOT_TUMBLR_KEY;
var URL_TEMPLATE =
  "http://api.tumblr.com/v2/blog/{{url}}/{{resource}}?api_key={{API_KEY}}";
var request = require("request");
var helper = require("../../helper");
var for_each = helper.for_each;
var parse = require("url").parse;

function tidy_source_url(source_url) {
  source_url = source_url.split("http://").join("");
  source_url = source_url.split("https://").join("");
  source_url = source_url.split("/").join("");

  return source_url;
}

function main(source_url, callback) {
  var blog = {};

  source_url = tidy_source_url(source_url);

  get_info(source_url, function(err, info) {
    if (err) return callback(err);

    get_posts(source_url, info.total_posts, function(err, posts) {
      if (err) return callback(err);

      blog.title = info.title;
      blog.posts = posts;
      blog.host = parse(info.url).host;

      return callback(null, blog);
    });
  });
}

function get_posts(source_url, total_posts, callback) {
  var urls = [];
  var posts = [];

  for (var offset = 0; offset < total_posts; offset += 20) {
    urls.push(
      string(URL_TEMPLATE + "&offset={{offset}}&limit={{limit}}").template({
        url: source_url,
        offset: offset,
        limit: 20,
        API_KEY: API_KEY,
        resource: "posts"
      }).s
    );
  }

  for_each(
    urls,
    function(url, next) {
      console.log(posts.length);

      request(url, function(err, res, body) {
        if (err) return callback(err);

        body = JSON.parse(body);
        body = body.response;

        posts = posts.concat(body.posts);

        next();
      });
    },
    function() {
      console.log("Done!");
      callback(null, posts);
    }
  );
}

function get_info(source_url, callback) {
  var url = string(URL_TEMPLATE).template({
    url: source_url,
    API_KEY: API_KEY,
    resource: "info"
  }).s;

  request(url, function(err, res, body) {
    if (err) return callback(err);

    body = JSON.parse(body);
    body = body.response.blog;

    return callback(null, body);
  });
}

if (require.main === module) {
  var source_url = process.argv[2];
  var output_file = process.argv[3];

  if (!source_url) throw new Error("Please pass tumblr URL as first argument");
  if (!output_file)
    throw new Error("Please pass filename to write blog to as second argument");

  main(source_url, function(err, blog) {
    if (err) throw err;

    fs.outputJson(output_file, blog, { spaces: 2 }, function(err) {
      if (err) throw err;

      process.exit();
    });
  });
}

module.exports = main;
