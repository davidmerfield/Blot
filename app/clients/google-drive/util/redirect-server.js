


const app = new require("express")();
app.use(function (req, res, next) {
  res.locals.base = "/clients/googledrive";

  // fake blog for testing, eventually this will be the real user's blog
  req.blog = {
    id: "blog_0000000000000",
  };

  res.render = function (view) {
    res.send(
      require("mustache").render(
        require("fs").readFileSync(
          __dirname + "/views/" + view + ".html",
          "utf-8"
        ),
        res.locals
      )
    );
  };

  next();
});
app.use("/clients/googledrive", require("./routes").dashboard);
app.listen(8822);
// end of shim