var fs = require('fs');

function load (name) {
  return fs.readFileSync(__dirname + '/secrets/' + name, 'utf-8').trim();
}

var flags = require('./flags');

var production = flags.production === true;
var maintenance = flags.maintenance === true;
var dropbox_test_app = flags.dropbox_test_app === true;
var cache = flags.cache === true;
var debug = flags.debug === true;

var environment, host, protocol, stripe_key, stripe_secret, pandoc_path;

if (production) {

  environment = 'production';
  host = 'blot.im';
  protocol = "https://";
  stripe_key = load('stripe.live.key');
  stripe_secret = load('stripe.live.secret');
  pandoc_path = '/home/ec2-user/.local/bin/pandoc';
  cache_directory = '/cache';

} else {

  environment = 'development';
  host = "blot.development";
  protocol = "http://";
  stripe_key = load('stripe.test.key');
  stripe_secret = load('stripe.test.secret');
  pandoc_path = '/usr/local/bin/pandoc';
  cache_directory = '/var/www/blot/www';

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

  "cache_directory": cache_directory,
  "ip": "54.191.179.131",

  "port": 8080,

  "redis": {"port": 6379},

  "admin": {
    "uid": "2302164",
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
