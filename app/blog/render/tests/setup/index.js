var Express = require("express");
var Template = require("template");
var http = require("http");

module.exports = function() {
  global.test.blog();

  afterEach(function(done) {
    if (this.listening) this.server.close(done);
    else done();
  });

  beforeEach(function() {
    this.fake = global.test.fake;
  });

  beforeEach(function(done) {
    var ctx = this;
    // it would be nice if one day template ids could be upper case and have spaces
    var templateID = this.fake.random.word().toLowerCase().split(' ').join('');
    Template.create(this.blog.id, templateID, {}, function(err) {
      if (err) return done(err);
      Template.getMetadata(ctx.blog.id + ":" + templateID, function(
        err,
        template
      ) {
        if (err) return done(err);
        ctx.template = template;
        done();
      });
    });
  });

  beforeEach(function() {
    var ctx = this;
    ctx.setView = function(updates, callback) {
      Template.setView(ctx.template.id, updates, callback);
    };
  });

  beforeEach(function() {
    var ctx = this;
    ctx.server = Express();

    ctx.server.use(function(req, res, next) {
      req.blog = ctx.blog;
      req.template = ctx.template;
      next();
    });

    // The rendering middleware we want to test!
    ctx.server.use(require("../../index"));

    ctx.listen = function attempt(callback) {
      var port = 10000 + Math.round(Math.random() * 10000);
      ctx.listening = true;
      ctx.server = ctx.server.listen(port, function(err) {
        if (err && err.code === "EADDRINUSE") return attempt(callback);
        if (err && err.code === "EACCESS") return attempt(callback);
        if (err) return callback(err);
        callback();
      });
      ctx.port = port;
    };

  });

  beforeEach(function() {
    var ctx = this;
    this.get = function(path, callback) {
      var url = "http://localhost:" + ctx.port;
      var contents = "";
      http
        .get(url + path, function(resp) {
          resp.setEncoding("utf8");
          resp.on("data", function(chunk) {
            contents += chunk;
          });
          resp.on("end", function() {
            callback(null, contents, resp);
          });
        })
        .on("error", callback);
    };
  });
};
