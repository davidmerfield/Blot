var moment = require("moment");
var exec = require("child_process").exec;
var rootDir = require("helper/rootDir");
const { load } = require("text-to-svg");

// Ignores merge commits since they're not useful to readers
// Ignores commits mentioning 'commit' since they're not useful to readers
// Ignores commits to yml test file since there are so many of them
// Ignores commits to todo file since there are so many of them
// Ignores commits with links since they're ugly
const bannedWords = ["merge", "typo", "commit", ".yml", "todo", "://"];
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
  Object.keys(commitMessageMap).join("|"),
  "g"
);

module.exports = (req, res, next) => {
  loadDone(function(err, data) {

    if (err) {
      console.log("News page: error fetching git commits");
      console.log(err);
      res.locals.recent_commits = [];
      res.locals.days = [];
      return next();
    }

    const { recent_commits, days } = data;

    res.locals.recent_commits = recent_commits;
    res.locals.days = days;

    next();
  });
};

function loadDone (callback) {
  console.log('News page: fetching git commits with CWD:', rootDir);
  exec("git log -300", { cwd: rootDir }, function (err, output) {
    if (err) {
      console.log("News page: error fetching git commits");
      return callback(err);
    }

    output = output.split("\n\n");

    var commits = [];
    var messageMap = {};

    output.forEach(function (item, i) {
      if (i % 2 === 0) {
        var message = output[i + 1].trim();

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

        commits.push({
          author: item
            .slice(
              item.indexOf("Author:") + "Author:".length,
              item.indexOf("<")
            )
            .trim(),
          date: new Date(
            item.slice(item.indexOf("Date:") + "Date:".length).trim()
          ),
          hash: item
            .slice(
              item.indexOf("commit ") + "commit ".length,
              item.indexOf("Author")
            )
            .trim(),
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

    callback(null, { recent_commits, days });
  });
};
