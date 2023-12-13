const config = require("config");
const redis = require("redis");
const async = require("async");
const client = require("models/client");
const basename = require("path").basename;
const makeID = require("models/template/util/makeID");
const each = require("../each/blog");
const get = require("../get/blog");

const { create } = require("models/template");
const setMultipleViews = require("models/template/setMultipleViews");

const localPath = require("helper/localPath");
const fs = require("fs-extra");
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

const main = async (blog, callback) => {
  const templateDirs = [];

  if (fs.existsSync(localPath(blog.id, "/Templates"))) {
    fs.readdirSync(localPath(blog.id, "/Templates")).forEach(file => {
      templateDirs.push(localPath(blog.id, "/Templates/" + file));
    });
  }

  if (fs.existsSync(localPath(blog.id, "/templates"))) {
    fs.readdirSync(localPath(blog.id, "/templates")).forEach(file => {
      templateDirs.push(localPath(blog.id, "/templates/" + file));
    });
  }

  let restore = [];

  backupClient.smembers("template:owned_by:" + blog.id, (err, oldIds) => {
    if (err) return callback(err);
    client.smembers("template:owned_by:" + blog.id, (err, newIds) => {
      if (err) return callback(err);

      const missing = oldIds.filter(id => !newIds.includes(id));

      missing.forEach(id => restore.push(id));

      async.eachSeries(
        templateDirs,
        (dir, next) => {
          if (!fs.statSync(dir).isDirectory()) return next();
          const id = makeID(blog.id, basename(dir));
          console.log("found id", id);
          backupClient.hget(
            "template:" + id + ":info",
            "localEditing",
            (err, backupLocalEditing) => {
              if (err) return next(err);
              if (backupLocalEditing !== "false") return next();

              console.log("need to restore", id);
              restore.push(id);
              next();
            }
          );
        },
        err => {
          if (err) return callback(err);

          // ensure we don't restore the same template twice
          restore = [...new Set(restore)];

          async.eachSeries(
            restore,
            (id, next) => {
              restore(blog, id, next);
            },
            callback
          );
        }
      );
    });
  });
};

const restore = (blog, templateID, callback) => {
  // found locally-edited template
  backupClient.hgetall("template:" + templateID + ":info", (err, data) => {
    if (err) return callback(err);

    if (!data) {
      console.log(templateID, "is not present in backup");
      return callback();
    }

    if (data.localEditing !== "false") {
      console.log(templateID, "was previouly edited locally as well");
      return callback();
    }

    const allViewsKey = "template:" + templateID + ":all_views";

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
              const viewKey = "template:" + templateID + ":view:" + viewName;
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
                  return callback();
                }

                if (err) return callback(err);

                if (!newTemplate || !newTemplate.id) {
                  return callback(new Error("no new template created"));
                }

                console.log("created template", newTemplate.id);

                setMultipleViews(newTemplate.id, views, err => {
                  if (err) return callback(err);

                  console.log("restored all views for", newTemplate.id);

                  if (templateID !== oldTemplateID) {
                    console.log(
                      "old template",
                      oldTemplateID,
                      "does not match",
                      templateID
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
  // handle a specific blog
  if (process.argv[2]) {
    get(process.argv[2], function (err, user, blog) {
      if (err) throw err;
      main(blog, function (err) {
        if (err) throw err;
        process.exit();
      });
    });
  } else {
    each(
      (user, blog, next) => main(blog, next),
      err => {
        if (err) throw err;
        process.exit();
      }
    );
  }
}
