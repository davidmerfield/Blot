var fs = require('fs');
var environment_variable_dictionary = require('./variable_dictionary');

function load (name) {
  var real_value = fs.readFileSync(__dirname + '/secrets/' + name, 'utf-8').trim();
  var new_value = process.env[environment_variable_dictionary[name]];
  if (new_value !== real_value) console.log("Warning, ", name, environment_variable_dictionary[name], 'is not equal');
  return real_value;
}

function get_flag (key) {
  var _flags = require('./flags');
  var real_value = _flags[key];
  // environment variables are strings!
  var new_value = process.env[environment_variable_dictionary[key]] === "true";
  if (new_value !== real_value) {
    console.log("Warning", key, environment_variable_dictionary[key], 'is not equal', real_value, new_value, new_value === real_value, typeof new_value, typeof real_value);
  }
  return real_value;
}

var production = get_flag('production');
var maintenance = get_flag('maintenance');
var cache = get_flag('cache');
var debug = get_flag('debug');

var environment, host, protocol, stripe_key, stripe_secret;
var pandoc_path, blog_static_files_dir, blog_folder_dir, cache_directory;

if (production) {

  stripe_key = load('stripe.live.key');
  stripe_secret = load('stripe.live.secret');

  console.log('IN PRODUCTION');

  environment = 'production';
  host = 'blot.im';
  protocol = "https://";
  pandoc_path = '/home/ec2-user/.local/bin/pandoc';
  cache_directory = '/cache';
  blog_static_files_dir = '/var/www/blot/static';
  blog_folder_dir = '/var/www/blot/blogs';

} else {

  stripe_key = load('stripe.test.key');
  stripe_secret = load('stripe.test.secret');

  console.log('IN DEVELOPMENT');

  environment = 'development';
  host = "blot.development";
  protocol = "http://";
  pandoc_path = '/usr/local/bin/pandoc';
  cache_directory = '/var/www/blot/cache';
  blog_static_files_dir = '/var/www/blot/static';
  blog_folder_dir = '/var/www/blot/blogs';

}

var dropbox = {app:{}, full: {}};

// We can only use the Dropbox test app in development
if (production === false) {

  dropbox.app.key = load('dropbox.app.test.key');
  dropbox.app.secret = load('dropbox.app.test.secret');

  dropbox.full.key = load('dropbox.full.test.key');
  dropbox.full.secret = load('dropbox.full.test.secret');

} else {

  dropbox.app.key = load('dropbox.app.live.key');
  dropbox.app.secret = load('dropbox.app.live.secret');

  dropbox.full.key = load('dropbox.full.live.key');
  dropbox.full.secret = load('dropbox.full.live.secret');

}


module.exports = {

  "environment": environment,
  "host": host,
  "protocol": protocol,

  "maintenance": maintenance,
  "cache": cache,
  "debug": debug,

  "blog_static_files_dir": blog_static_files_dir,
  "blog_folder_dir": blog_folder_dir,
  "cache_directory": cache_directory,
  
  "ip": "54.191.179.131",

  "port": 8080,

  "redis": {"port": 6379},

  "admin": {
    "uid": "user_FZRFM1D34R5",
    "email": "david@blot.im"
  },

  "dropbox": dropbox,

  "stripe": {
    "key": stripe_key,
    "secret": stripe_secret,
    "plan": "yearly_20"
  },

  "pandoc_path": pandoc_path,

  "cdn": {
    "bucket": "blot-blogs",
    "host": "blotcdn.com"
  },

  "session": {
    "secret": load('session.secret')
  },

  "youtube": {
    "secret": load('youtube.secret')
  },

  "aws": {
    "key": load('aws.key'),
    "secret": load('aws.secret'),
  },

  "mailgun": {
    "key": load('mailgun.key'),
    "domain": "blot.im",
    "from": "David Merfield <david@blot.im>"
  },

  "s3": {
    "buckets": {
      "dump": "blot-dump",
      "blogs": "blot-blogs",
      "backups": "blot-backups"
    }
  },

  "backup": {
    "bucket": "blot-backups",
    "password": load('backup.secret')
  },

  "twitter": {
    "consumer_key": load('twitter.key'),
    "consumer_secret": load('twitter.secret'),
    "access_token": load('twitter.token.key'),
    "access_token_secret": load('twitter.token.secret')
  }

};

var _ = require('lodash');

function difference(object, base) {
  function changes(object, base) {
    return _.transform(object, function(result, value, key) {
      if (!_.isEqual(value, base[key])) {
        result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
      }
    });
  }
  return changes(object, base);
}

var diff = difference(module.exports, require('./index-new'));

for (var i in diff) {
  console.log('WARNING', module.exports[i], require('./index-new')[i], 'ARE DIFFERENT');
}

require('assert').deepEqual(module.exports, require('./index-new'));
