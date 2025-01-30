var moment = require("moment");
var exec = require("child_process").exec;
var rootDir = require("helper/rootDir");
const { views_directory } = require("config");

const fs = require("fs-extra");
const { join } = require("path");
const OUTPUT_PATH = join(views_directory, "git-commits.json");

// Ignores merge commits since they're not useful to readers
// Ignores commits mentioning 'commit' since they're not useful to readers
// Ignores commits to yml test file since there are so many of them
// Ignores commits to todo file since there are so many of them
// Ignores commits with links since they're ugly
const bannedWords = ["merge", "typo", "commit", ".yml", "todo", "://", 'dockerfile'];
const bannedWordsRegEx = new RegExp(bannedWords.join("|"), "i");

// Adjust the tense of verbs in commit message
const commitMessageMap = {
  "Adds": "Added",
  "Cleans": "Cleaned",
  "Changes": "Changed",
  "Fixes": "Fixed",
  "Finishes": "Finished",
  "Improves": "Improved",
  "Modifies": "Modified",
  "Removes": "Removed",
  "Tweaks": "Tweaked",
  "Updates to": "Updated",
  "Updates": "Updated"
};

const commitMessageMapRegEx = new RegExp(
  Object.keys(commitMessageMap)
    .sort((a, b) => b.length - a.length) // Sort to match longer keys first
    .map(key => `\\b${key}\\b`) // Add word boundaries
    .join("|"),
  "g"
);

const load = async () => {
  try {
    return await fs.readJSON(OUTPUT_PATH);
  } catch (e) {
    return { recent_commits: [], days: [] };
  }
}

const middleware = async (req, res, next) => {

  try {
    const { recent_commits, days } = await load();
    res.locals.recent_commits = recent_commits;
    res.locals.days = days;
    return next();
  } catch (e) {
    console.log("News page: error fetching git commits");
    console.log(e);
    res.locals.recent_commits = [];
    res.locals.days = [];
    return next();
  }
};

const build = () => {
  return new Promise((resolve, reject) => {
    exec("git log -300", { cwd: rootDir }, function (err, output) {
      if (err) {
        return reject(err);
      }

      output = output.split("\n\n");

      var commits = [];
      var messageMap = {};

      output.forEach(function (item, i) {
        if (i % 2 === 0) {
          var message = output[i + 1] ? output[i + 1].trim() : "";
          if (!message) return;

          message = message[0].toUpperCase() + message.slice(1);

          if (bannedWordsRegEx.test(message)) return;

          message = message.replace(commitMessageMapRegEx, function (matched) {
            return commitMessageMap[matched];
          });

          // Before: Add removal of old backups (#393)
          // After:  Add removal of old backups
          if (message.indexOf("(#") > -1)
            message = message.slice(0, message.indexOf("(#"));

          if (message.indexOf("*") > -1)
            message = message.slice(0, message.indexOf("*"));

          // Prevent duplicate messages appearing on news page
          if (messageMap[message]) return;
          else messageMap[message] = true;

          let author, hash;
          let authorStart = item.indexOf("Author:");
          let hashStart = item.indexOf("commit ");
          if (authorStart > -1 && hashStart > -1) {
            author = item
              .slice(authorStart + "Author:".length, item.indexOf("<"))
              .trim();
            hash = item
              .slice(hashStart + "commit ".length, item.indexOf("Author"))
              .trim();
          } else {
            author = "Unknown";
            hash = "Unknown";
          }

          commits.push({
            author,
            hash,
            date: new Date(
              item.slice(item.indexOf("Date:") + "Date:".length).trim()
            ),
            message: message.trim()
          });
        }
      });

      const dateFormat = "MMM D, YYYY";
      const today = moment().format(dateFormat);
      const yesterday = moment().subtract(1, "days").format(dateFormat);
      let days = [];

      commits.forEach(commit => {
        commit.time = moment(commit.date).format(dateFormat);

        if (commit.time === today) commit.time = "Today";
        else if (commit.time === yesterday) commit.time = "Yesterday";
        else if (
          moment(commit.date).valueOf() > moment().subtract(6, "days").valueOf()
        )
          commit.time = moment(commit.date).fromNow();
        else commit.time = commit.time;

        let currentday = days[days.length - 1];

        if (currentday && currentday[0] && currentday[0].time === commit.time) {
          currentday.push(commit);
        } else {
          days.push([commit]);
        }
      });

      days = days.map(commits => {
        return { day: commits[0].time, commits };
      });

      const recent_commits = commits.slice(0, 5).map(commit => {
        return { ...commit, fromNow: moment(commit.date).fromNow() };
      });
      
      fs.outputJSON(OUTPUT_PATH, {recent_commits, days}, function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  });
};

module.exports = { middleware, build };