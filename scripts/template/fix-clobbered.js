const config = require("config");
const redis = require("redis");
const async = require("async");

const each = require("../each/template");
const get = require("../get/template");

const { create, setMetadata } = require("models/template");
const setMultipleViews = require("models/template/setMultipleViews");

const Blog = require("models/blog");

const viewModel = require("models/template/viewModel");
const metadataModel = require("models/template/metadataModel");
const deserialize = require("models/template/util/deserialize");

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

        const views = {};

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
                views[viewName] = view;
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

              create(blog.id, newName, metadata, (err, newTemplate) => {
                if (err && err.code === "EEXISTS") {
                  console.log("Already restored", newName);
                }

                if (err) return callback(err);

                if (!newTemplate || !newTemplate.id) {
                  return callback(new Error("no new template created"));
                }

                console.log("created template", newTemplate.id);

                setMultipleViews(newTemplate.id, views, err => {
                  if (err) return callback(err);

                  console.log("restored all views for", newTemplate.id);

                  if (template.id !== oldTemplateID) {
                    console.log(
                      "old template",
                      oldTemplateID,
                      "does not match",
                      template.id
                    );
                    return callback();
                  }

                  console.log("setting new template as active");
                  Blog.set(
                    blog.id,
                    { template: newTemplate.id },
                    function (err) {
                      if (err) return callback(err);
                      console.log("set new template as active");
                      callback();
                    }
                  );
                });
              });
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
