const { resolve } = require("path");

const environment =
  process.env.NODE_ENV === "production" ? "production" : "development";

const BLOT_DIRECTORY = process.env.BLOT_DIRECTORY || resolve(__dirname + "/../");
const BLOT_DATA_DIRECTORY = process.env.BLOT_DATA_DIRECTORY || BLOT_DIRECTORY + "/data";
const BLOT_HOST = process.env.BLOT_HOST || "localhost";
const BLOT_PORT = process.env.BLOT_PORT || "8080";
const BLOT_PROTOCOL = process.env.BLOT_PROTOCOL || "https";

const BLOT_CDN = BLOT_PROTOCOL + "://cdn." + BLOT_HOST;

// The private IP addresses of the proxies which point to this server
// we need to know this to flush the cache on each proxy when a blog is updated
const reverse_proxies = process.env.BLOT_REVERSE_PROXY_URLS ? process.env.BLOT_REVERSE_PROXY_URLS.split(",") : environment === "production" ? ["http://127.0.0.1:80"] : [];

module.exports = {
  // codebase expects either 'production' or 'development'
  environment,
  host: BLOT_HOST,
  reverse_proxies,
  protocol: BLOT_PROTOCOL + "://",

  webhooks: {
    server_host: "webhooks." + BLOT_HOST,
    // replace with "webhooks.blot.development" to test
    relay_host: environment === "development" && "webhooks.blot.im",
    development_host: "localhost",
    secret: process.env.BLOT_WEBHOOKS_SECRET
  },

  maintenance: process.env.BLOT_MAINTENANCE === "true",
  cache: process.env.BLOT_CACHE === "true",
  debug: process.env.BLOT_DEBUG === "true",

  // These directories are used by the application
  blot_directory: BLOT_DIRECTORY,
  data_directory: BLOT_DATA_DIRECTORY,
  views_directory: BLOT_DIRECTORY + "/app/views-built",
  tmp_directory: process.env.BLOT_TMP_DIRECTORY || BLOT_DATA_DIRECTORY + "/tmp",
  log_directory: process.env.BLOT_LOG_DIRECTORY || BLOT_DATA_DIRECTORY + "/logs",
  blog_static_files_dir: BLOT_DATA_DIRECTORY + "/static",
  blog_folder_dir: BLOT_DATA_DIRECTORY + "/blogs",

  ip: process.env.BLOT_IP || "127.0.0.1",

  port: BLOT_PORT,
  clients_port: 8888,

  redis: { port: 6379, host: process.env.BLOT_REDIS_HOST || "127.0.0.1" },

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
    // Ensure that each monthly plan has a corresponding
    // annual plan, and vice versa, and that these IDs
    // correspond to plans on Stripe in both live and
    // test modes when you change Blot's price.
    plan: "monthly_5",

    plan_map: {
      yearly_30: "monthly_3",
      monthly_3: "yearly_30",

      yearly_20: "monthly_2",
      monthly_2: "yearly_20",

      yearly_44: "monthly_4",
      monthly_4: "yearly_44",

      yearly_55: "monthly_5",
      monthly_5: "yearly_55"
    }
  },

  pandoc: {
    bin: process.env.BLOT_PANDOC_PATH || "pandoc",
    maxmemory: "500M", // 500mb
    timeout: 10000 // 10s
  },

  paypal: {
    client_id: process.env.BLOT_PAYPAL_CLIENT_ID,
    secret: process.env.BLOT_PAYPAL_SECRET,

    plan: process.env.BLOT_PAYPAL_MONTHLY_5,

    plans: {
      monthly_4: process.env.BLOT_PAYPAL_MONTHLY_4,
      yearly_44: process.env.BLOT_PAYPAL_YEARLY_44,
      monthly_5: process.env.BLOT_PAYPAL_MONTHLY_5,
      yearly_55: process.env.BLOT_PAYPAL_YEARLY_55
    },

    api_base: `https://api.${
      environment === "development" ? "sandbox." : ""
    }paypal.com`
  },

  cdn: {
    origin: BLOT_CDN
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
    from: "Blot <contact@blot.im>"
  },

  backup: {
    bucket: "blot-daily-backups",
    password: process.env.BLOT_BACKUP_SECRET
  },

  google: {
    drive: {
      key: process.env.BLOT_GOOGLEDRIVE_ID,
      secret: process.env.BLOT_GOOGLEDRIVE_SECRET
    }
  },

  twitter: {
    consumer_key: process.env.BLOT_TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.BLOT_TWITTER_CONSUMER_SECRET,
    access_token: process.env.BLOT_TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.BLOT_TWITTER_ACCESS_TOKEN_SECRET
  }
};
