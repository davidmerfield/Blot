const config = require("config");
const redis = require("redis");
const async = require("async");

const each = require("../each/template");
const get = require("../get/template");

const { create, setMultipleViews, setMetadata } = require("models/template");

const viewModel = require("models/template/viewModel");
const metadataModel = require("models/template/metadataModel");
const deserialize = require("models/template/util/deserialize");
const { del } = require("request");

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

        const views = [];

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
                view = deserialize(view, viewModel);
                views.push(view);
                next();
              });
            },
            err => {
              if (err) return callback(err);
              const metadata = deserialize(data, metadataModel);

              const newName = metadata.name + " (restored)";

              delete metadata.id;
              delete metadata.name;
              delete metadata.cloneFrom;
              delete metadata.localEditing;
              delete metadata.slug;

              console.log("adding template", newName, metadata);

              // console.log("would set views", views);

              callback();

              // create(blog.id, newName, metadata, (err, newTemplate) => {
              //   if (err) return callback(err);

              //   if (!newTemplate || !newTemplate.id) {
              //     return callback(new Error("no new template created"));
              //   }

              //   console.log("created template", newTemplate.id);

              //   setMultipleViews(newTemplate.id, views, err => {
              //     if (err) return callback(err);

              //     console.log("restored all views for", newTemplate.id);
              //     callback();
              //   });
              // });
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
