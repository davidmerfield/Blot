module.exports = {
  environment: process.env.BLOT_ENVIRONMENT,
  host: process.env.BLOT_HOST,
  protocol: process.env.BLOT_PROTOCOL + "://",

  maintenance: process.env.BLOT_MAINTENANCE === "true",
  cache: process.env.BLOT_CACHE === "true",
  debug: process.env.BLOT_DEBUG === "true",

  blog_static_files_dir: process.env.BLOT_DIRECTORY + "/static",
  blog_folder_dir: process.env.BLOT_DIRECTORY + "/blogs",
  cache_directory: process.env.BLOT_CACHE_DIRECTORY,

  ip: process.env.BLOT_IP || "127.0.0.1",

  port: 8080,

  redis: { port: 6379 },

  admin: {
    uid: process.env.BLOT_ADMIN_UID,
    email: process.env.BLOT_ADMIN_EMAIL
  },

  dropbox: {
    app: {
      key: process.env.BLOT_DROPBOX_APP_KEY,
      secret: process.env.BLOT_DROPBOX_APP_SECRET
    },
    full: {
      key: process.env.BLOT_DROPBOX_FULL_KEY,
      secret: process.env.BLOT_DROPBOX_FULL_SECRET
    }
  },

  stripe: {
    key: process.env.BLOT_STRIPE_KEY,
    secret: process.env.BLOT_STRIPE_SECRET,
    plan: "monthly_3"
  },

  pandoc_path: process.env.BLOT_PANDOC_PATH,

  cdn: {
    bucket: "blot-blogs",
    host: "blotcdn.com",
    origin:
      process.env.BLOT_ENVIRONMENT === "production"
        ? process.env.BLOT_PROTOCOL + "://blotcdn.com"
        : process.env.BLOT_PROTOCOL + "://" + process.env.BLOT_HOST + "/cdn"
  },

  session: {
    secret: process.env.BLOT_SESSION_SECRET
  },

  youtube: {
    secret: process.env.BLOT_YOUTUBE_SECRET
  },

  aws: {
    key: process.env.BLOT_AWS_KEY,
    secret: process.env.BLOT_AWS_SECRET
  },

  mailgun: {
    key: process.env.BLOT_MAILGUN_KEY,
    domain: "blot.im",
    from: "David Merfield <david@blot.im>"
  },

  s3: {
    buckets: {
      dump: "blot-dump",
      blogs: "blot-blogs",
      backups: "blot-backups"
    }
  },

  backup: {
    bucket: "blot-backups",
    password: process.env.BLOT_BACKUP_SECRET
  },

  twitter: {
    consumer_key: process.env.BLOT_TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.BLOT_TWITTER_CONSUMER_SECRET,
    access_token: process.env.BLOT_TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.BLOT_TWITTER_ACCESS_TOKEN_SECRET
  }
};
