const config = require("config");
const redis = require("redis");

const each = require("../each/template");
const get = require("../get/template");

const url = `redis://${process.env.BACKUP_REDIS_HOST}:${config.redis.port}`;
const backupClient = redis.createClient({ url });

const main = (blog, template, callback) => {
  if (template.localEditing !== true) return callback();
  // found locally-edited template
  backupClient.hgetall("template:" + template.id + ":info", (err, data) => {
    if (err) return callback(err);
    console.log("data", data);
    callback();
  });
};

if (require.main === module) {
  // handle a specific template
  if (process.argv[2]) {
    get(process.argv[2], function (err, user, blog, template) {
      main(blog, template, function (err) {
        if (err) throw err;
        process.exit();
      });
    });
  } else {
    each(
      (user, blog, template, next) => main(blog, template, next),
      err => {
        if (err) throw err;
        process.exit();
      }
    );
  }
}
