var readability = require("node-readability");
var EventEmitter = require("events");
var MyEmitter = new EventEmitter();

module.exports = function(article_url, callback) {
  var has_responded = false;
  var content;
  var html;
  var title;
  var label = "done" + article_url;

  MyEmitter.on(label, function() {
    callback(null, title, content, html);
  });

  // This seems to swallow errors for whole process?
  // WTF!

  readability(article_url, function(err, article) {
    if (has_responded) return;

    has_responded = true;

    if (err) return callback(err);

    content = article.content.slice();
    html = article.cache.body.slice();
    title = article.title.slice();

    MyEmitter.emit(label);
    article.close();
  });
};
