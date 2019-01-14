var config = require("config");
var Express = require("express");
var brochure = new Express();
var hbs = require("hbs");

// Configure the template engine for the brochure site
hbs.registerPartials(__dirname + "/views/partials");
brochure.set("views", __dirname + "/views");
brochure.set("view engine", "html");
brochure.engine("html", hbs.__express);

// Only in development mode
if (config.environment === "development") {
  brochure.disable("view cache");
}

// This is the layout that HBS uses by default to render a
// page. Look into the source, but basically {{{body}}} in
// partials/layout is replaced with the view passed to
// res.render(). You can modify this in the route if needed.
brochure.locals.layout = "partials/layout";

// Default page title and <meta> description
brochure.locals.title = "Blot – A blogging platform with no interface.";
brochure.locals.description =
  "Turns a folder into a blog automatically. Use your favorite text-editor to write. Text and Markdown files, Word Documents, images, bookmarks and HTML in your folder become blog posts.";

// Now we actually load the routes for the brochure website.
brochure.use(require("./routes"));

brochure.use(Express.static(__dirname + "/views", { maxAge: 86400000 }));

if (config.environment === "development") {
  brochure.listen(8976);
  console.log("Serving brochure site: http://localhost:8976/");
}

module.exports = brochure;
