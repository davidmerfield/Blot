var _ = require("lodash");
var async = require("async");
var helper = require("helper");
var ensure = helper.ensure;
var dictionary = {
  absoluteURLs: require("./absoluteURLs"),
  active: require("./active"),
  allEntries: require("./allEntries"),
  allTags: require("./allTags"),
  all_entries: require("./all_entries"),
  all_tags: require("./all_tags"),
  appCSS: require("./appCSS"),
  appJS: require("./appJS"),
  archives: require("./archives"),
  asset: require("./asset"),
  avatar_url: require("./avatar_url"),
  css_url: require("./css_url"),
  encodeJSON: require("./encodeJSON"),
  encodeURIComponent: require("./encodeURIComponent"),
  encodeXML: require("./encodeXML"),
  feed_url: require("./feed_url"),
  isActive: require("./isActive"),
  latestEntry: require("./latestEntry"),
  page: require("./page"),
  plugin_css: require("./plugin_css"),
  plugin_js: require("./plugin_js"),
  popular_tags: require("./popular_tags"),
  public: require("./public"),
  recentEntries: require("./recentEntries"),
  recent_entries: require("./recent_entries"),
  script_url: require("./script_url"),
  search_query: require("./search_query"),
  search_results: require("./search_results"),
  "sort:date": require("./sort:date"),
  "sort:path": require("./sort:path"),
  tagged: require("./tagged"),
  updated: require("./updated")
};

module.exports = function(req, retrieve, callback) {
  ensure(req, "object")
    .and(retrieve, "object")
    .and(callback, "function");

  var locals = {};

  async.each(
    _.keys(retrieve),
    function(localName, nextLocal) {
      if (dictionary[localName] === undefined) {
        // console.log(req.blog.handle, req.blog.id, ": No retrieve method to look up", localName);
        return nextLocal();
      }

      dictionary[localName](req, function(err, value) {
        if (err) console.log(err);

        if (value !== undefined) locals[localName] = value;

        return nextLocal();
      });
    },
    function() {
      callback(null, locals);
    }
  );
};
