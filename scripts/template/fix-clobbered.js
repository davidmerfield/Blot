const config = require("config");
const redis = require("redis");
const async = require("async");

const each = require("../each/template");
const get = require("../get/template");
const { metadata } = require("../../app/models/template/key");

const backupHost = process.env.BACKUP_REDIS_HOST;

const url = `redis://${backupHost}:${config.redis.port}`;
const backupClient = redis.createClient({ url });

if (!backupHost) {
  throw new Error("BACKUP_REDIS_HOST env variable not set");
}

const main = (blog, template, callback) => {
  if (template.localEditing !== true) {
    console.log(template.id, "is not edited locally");
    return callback();
  }
  // found locally-edited template
  backupClient.hgetall("template:" + template.id + ":info", (err, data) => {
    if (err) return callback(err);

    if (!data) {
      console.log(template.id, "is not present in backup");
      return callback();
    }

    if (data.localEditing !== "false") {
      console.log(template.id, "was previouly edited locally as well");
      return callback();
    }

    console.log("need to restore", template.id);

    const allViewsKey = "template:" + template.id + ":all_views";

    backupClient.hget(
      "blog:" + blog.id + ":info",
      "template",
      (err, oldTemplateID) => {
        if (err) return callback(err);

        if (oldTemplateID === template.id) {
          console.log(template.id, "was the active template");
        } else {
          console.log(template.id, "was not the active template");
        }

        // get all the view names
        backupClient.smembers(allViewsKey, function (err, viewNames) {
          if (err) return callback(err);
          async.eachSeries(
            viewNames,
            function (viewName, next) {
              const viewKey = "template:" + template.id + ":view:" + viewName;
              backupClient.hgetall(viewKey, (err, view) => {
                if (err || !view)
                  return next(err || new Error("no view: " + viewName));
                console.log(template.id, "found view to restore", viewName);
                next();
              });
            },
            err => {
              if (err) return callback(err);
              console.log(template.id, "metadata to restore:", data);
              callback();
            }
          );
        });
      }
    );
  });
};

if (require.main === module) {
  // handle a specific template
  if (process.argv[2]) {
    get(process.argv[2], function (err, user, blog, template) {
      if (err) throw err;
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
