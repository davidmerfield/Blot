const Blog = require("models/blog");
const moment = require("moment");
const Path = require("path");
const { promisify } = require("util");

const getStatuses = promisify(Blog.getStatuses);
const verbs = {
  Downloading: "downloaded",
  Syncing: "synced",
  Transferring: "transferred",
  Removing: "removed",
};
const PROGRESS_PREFIX = /^\(\d+\/\d+\)\s+/;
const STATUS_HISTORY_PAGE_SIZE = 2000;
const MAX_RECENT_GROUPS = 20;
const MAX_VISIBLE_FILES_PER_GROUP = 8;

module.exports = async function (req, res, next) {
  if (!req.blog.client) {
    res.locals.recentActivity = [];
    return next();
  }

  try {
    const { statuses } = await getStatuses(req.blog.id, {
      pageSize: STATUS_HISTORY_PAGE_SIZE,
    });
    const groups = new Map();

    statuses.forEach(function (status, index) {
      const message = String(status.message || "").replace(PROGRESS_PREFIX, "");
      const verb = Object.keys(verbs).find(function (candidate) {
        return message.startsWith(candidate + " /");
      });

      // The status log also contains rebuild and health-check messages. Keep
      // only file operations so this reads like a file history.
      if (!verb) return;

      const path = message.slice(verb.length + 1).trim();
      if (!path) return;

      const date = status.datestamp || Date.now();
      const key = status.syncID || "status-" + date + "-" + index;
      let group = groups.get(key);

      if (!group) {
        group = {
          time: moment(date).fromNow(),
          datetime: moment(date).toISOString(),
          files: [],
          totalFiles: 0,
        };
        groups.set(key, group);
      }

      group.totalFiles++;
      group.files.push({
        verb: verbs[verb],
        path: Path.posix.normalize(path),
        urlPath: path
          .replace(/^\/+/, "")
          .split("/")
          .map(encodeURIComponent)
          .join("/"),
      });
    });

    res.locals.recentActivity = Array.from(groups.values()).slice(
      0,
      MAX_RECENT_GROUPS
    );
    res.locals.recentActivity.forEach(function (group) {
      group.files.forEach(function (file, index) {
        file.isCollapsed = index >= MAX_VISIBLE_FILES_PER_GROUP;
      });
      group.moreFiles = Math.max(
        0,
        group.files.length - MAX_VISIBLE_FILES_PER_GROUP
      );
    });
    next();
  } catch (err) {
    console.log(err);
    res.locals.recentActivity = [];
    next();
  }
};
