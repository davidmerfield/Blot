var Transformer = require("helper").transformer;

server
  .route("/rebuild-thumbnails")
  .get(function(req, res) {
    res.render("dashboard/rebuild-thumbnails");
  })
  .post(function(req, res) {
    var imageCache = new Transformer(req.blog.id, "image-cache");
    var thumbnails = new Transformer(req.blog.id, "thumbnails");

    console.log("Flushing image cache for", req.blog.handle);

    imageCache.flush(function() {
      console.log("Flushed imageCache for", req.blog.handle);
      console.log("Flushing thumbnails for", req.blog.handle);

      thumbnails.flush(function() {
        console.log("Flushed thumbnails for", req.blog.handle);
        rebuild(req.blog.id);
        res.redirect(req.url);
      });
    });
  });
