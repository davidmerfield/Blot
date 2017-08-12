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
var dropbox_secret, dropbox_key;

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

  dropbox_key = load('dropbox.test.key');
  dropbox_secret = load('dropbox.test.secret');

} else {

  dropbox_key = load('dropbox.live.key');
  dropbox_secret = load('dropbox.live.secret');
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
    "key": dropbox_key,
    "secret": dropbox_secret,
    "sandbox": true
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