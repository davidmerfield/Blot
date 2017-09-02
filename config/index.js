var fs = require('fs');

function load (name) {
  return fs.readFileSync(__dirname + '/secrets/' + name, 'utf-8');
}

var flags = require('./flags');

var production = flags.production === true;
var maintenance = flags.maintenance === true;
var dropbox_test_app = flags.dropbox_test_app === true;
var cache = flags.cache === true;
var debug = flags.debug === true;

var environment, host, protocol, stripe_key, stripe_secret, pandoc_path;
var dropbox_app_key, dropbox_app_secret, dropbox_full_key, dropbox_full_secret;

if (production) {

  environment = 'production';
  host = 'blot.im';
  protocol = "https://";
  stripe_key = load('stripe.live.key');
  stripe_secret = load('stripe.live.secret');
  pandoc_path = '/home/ec2-user/.local/bin/pandoc';

} else {

  environment = 'development';
  host = "blot.development";
  protocol = "http://";
  stripe_key = load('stripe.test.key');
  stripe_secret = load('stripe.test.secret');
  pandoc_path = '/Users/David/.cabal/bin/pandoc';

}

// We can only use the Dropbox test app in development
if (dropbox_test_app && production === false) {

  dropbox_app_key = load('dropbox.app.test.key');
  dropbox_app_secret = load('dropbox.app.test.secret');

  dropbox_full_key = load('dropbox.full.test.key');
  dropbox_full_secret = load('dropbox.full.test.secret');

} else {

  dropbox_app_key = load('dropbox.app.live.key');
  dropbox_app_secret = load('dropbox.app.live.secret');

  dropbox_full_key = load('dropbox.full.live.key');
  dropbox_full_secret = load('dropbox.full.live.secret');

}


module.exports = {

  "flags": flags,

  "environment": environment,
  "host": host,
  "protocol": protocol,

  "maintenance": maintenance,
  "cache": cache,
  "debug": debug,

  "ip": "54.191.179.131",

  "port": 8080,

  "redis": {"port": 6379},

  "admin": {
    "uid": "2302164",
    "email": "dmerfield@gmail.com"
  },

  "dropbox": {
    "full": {
      "key": dropbox_full_key,
      "secret": dropbox_full_secret
    },
    "app": {
      "key": dropbox_app_key,
      "secret": dropbox_app_secret
    }
  },

  "stripe": {
    "key": stripe_key,
    "secret": stripe_secret
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