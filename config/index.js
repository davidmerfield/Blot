var fs = require('fs');
var environment_variable_dictionary = {
  
  'stripe.live.key': 'BLOT_STRIPE_KEY',
  'stripe.test.key': 'BLOT_STRIPE_KEY',

  'stripe.live.secret': 'BLOT_STRIPE_SECRET',
  'stripe.test.secret': 'BLOT_STRIPE_SECRET',

  'dropbox.app.test.key': 'BLOT_DROPBOX_APP_KEY',
  'dropbox.app.live.key': 'BLOT_DROPBOX_APP_KEY',

  'dropbox.app.test.secret': 'BLOT_DROPBOX_APP_SECRET',
  'dropbox.app.live.secret': 'BLOT_DROPBOX_APP_SECRET',

  'dropbox.full.test.key': 'BLOT_DROPBOX_FULL_KEY',
  'dropbox.full.live.key': 'BLOT_DROPBOX_FULL_KEY',

  'dropbox.full.test.secret': 'BLOT_DROPBOX_FULL_SECRET',
  'dropbox.full.live.secret': 'BLOT_DROPBOX_FULL_SECRET',
    
  'session.secret': 'BLOT_SESSION_SECRET',
  'youtube.secret': 'BLOT_YOUTUBE_SECRET',
  'backup.secret': 'BLOT_BACKUP_SECRET',

  'aws.key': 'BLOT_AWS_KEY',
  'aws.secret': 'BLOT_AWS_SECRET',

  'mailgun.key': 'BLOT_MAILGUN_KEY',

  'twitter.key': 'BLOT_TWITTER_CONSUMER_KEY',
  'twitter.secret': 'BLOT_TWITTER_CONSUMER_SECRET',
  'twitter.token.key': 'BLOT_TWITTER_ACCESS_TOKEN_KEY',
  'twitter.token.secret': 'BLOT_TWITTER_ACCESS_TOKEN_SECRET'
};

var logged = {};

for (var i in environment_variable_dictionary) {
  if (logged[environment_variable_dictionary[i]] === undefined)
   console.log('export ' + environment_variable_dictionary[i] + '=');
  logged[environment_variable_dictionary[i]] = true;
}

function load (name) {
  var real_value = fs.readFileSync(__dirname + '/secrets/' + name, 'utf-8').trim();
  var new_value = process.env[environment_variable_dictionary[name]];
  if (new_value !== real_value) console.log("Warning, ", name, environment_variable_dictionary[name], 'is not equal');
  return real_value;
}

console.log('BLOT_PRODUCTION', process.env.BLOT_PRODUCTION);
console.log('BLOT_CACHE', process.env.BLOT_CACHE);

var flags = require('./flags');

var production = flags.production === true;
var maintenance = flags.maintenance === true;
var dropbox_test_app = flags.dropbox_test_app === true;
var cache = flags.cache === true;
var debug = flags.debug === true;

var environment, host, protocol, stripe_key, stripe_secret;
var pandoc_path, blog_static_files_dir, blog_folder_dir, cache_directory;

if (production) {

  environment = 'production';
  host = 'blot.im';
  protocol = "https://";
  stripe_key = load('stripe.live.key');
  stripe_secret = load('stripe.live.secret');
  pandoc_path = '/home/ec2-user/.local/bin/pandoc';
  cache_directory = '/cache';
  blog_static_files_dir = '/var/www/blot/data/static';
  blog_folder_dir = '/var/www/blot/data/blogs';

} else {

  environment = 'development';
  host = "blot.development";
  protocol = "http://";
  stripe_key = load('stripe.test.key');
  stripe_secret = load('stripe.test.secret');
  pandoc_path = '/usr/local/bin/pandoc';
  cache_directory = '/var/www/blot/data/cache';
  blog_static_files_dir = '/var/www/blot/data/static';
  blog_folder_dir = '/var/www/blot/data/blogs';

}

var dropbox = {app:{}, full: {}};

// We can only use the Dropbox test app in development
if (dropbox_test_app && production === false) {

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

  "flags": flags,

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
