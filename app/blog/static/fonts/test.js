const fs = require("fs-extra");
const express = require("express");
const mustache = require("mustache");
const typeset = require("typeset");

let fonts = require("./index").map((font) => {
  // The URL of the CDN which serves the font needs to
  // be replaced with an empty string. We serve fonts
  // manually on this test page, no CDN required
  font.styles = mustache.render(font.styles || "", {
    config: { cdn: { origin: "" } },
  });

  return font;
});

express()
  .use(renderer)
  .use(function (req, res, next) {
    res.locals.fonts = fonts;
    res.locals.documents = readDocuments();
    next();
  })
  .param("font", function (req, res, next, fontParam) {
    res.locals = {
      ...res.locals,
      ...fonts.filter((font) => font.id === fontParam)[0],
    };
    next();
  })
  .param("document", function (req, res, next, documentParam) {
    res.locals = {
      ...res.locals,
      document: res.locals.documents.filter(
        (document) => document.name === documentParam
      )[0],
    };
    next();
  })
  .get("/:font", function (req, res) {
    res.redirect(`/${req.params.font}/${res.locals.documents[0].name}`);
  })
  .get("/:font/:document", function (req, res) {
    res.render("test-font");
  })
  .get("/:font/:document/controls", function (req, res) {
    res.render("test-controls", {
      fonts: fonts,
    });
  })
  .post("/:font/:document/controls", parseBody, function (req, res) {
    writePackage(req.params.font, req.body);
    res.redirect(req.url);
  })
  .get("/", function (req, res) {
    res.render("test-index", {
      fonts: fonts,
    });
  })
  .use("/fonts", express.static(__dirname))
  .listen(8898);

console.log("Listening on http://localhost:8898");

// Used to decode URL-encoded form POST requests
function parseBody(req, res, next) {
  var data = "";
  req.on("data", function (chunk) {
    data += chunk;
  });
  req.on("end", function () {
    req.rawBody = data;
    req.body = require("querystring").decode(data);
    next();
  });
}

// Simple view renderer
function renderer(req, res, next) {
  res.render = function (name, view) {
    res.send(
      mustache.render(
        fs.readFileSync(__dirname + "/" + name + ".html", "utf-8"),
        { ...view, ...res.locals }
      )
    );
  };
  next();
}

function readDocuments() {
  return fs
    .readdirSync(__dirname)
    .filter((i) => i.indexOf("test-document-") === 0)
    .map((i) => {
      return {
        contents: typeset(fs.readFileSync(__dirname + "/" + i, "utf-8")),
        name: i.slice("test-document-".length, -".html".length),
        id: i,
      };
    });
}

function writePackage(fontID, newPackage) {
  let packagePath = __dirname + "/" + fontID + "/package.json";
  let package = fs.readJSONSync(packagePath);

  for (let field in newPackage) {
    if (["font_size", "line_height", "line_width"].indexOf(field) > -1)
      newPackage[field] = parseFloat(newPackage[field]);

    package[field] = newPackage[field];
  }

  fs.outputJSONSync(packagePath, package, {
    spaces: 2,
  });

  fonts = fonts.map((font) => {
    if (font.id !== fontID) return font;
    for (let field in newPackage) font[field] = newPackage[field];
    return font;
  });
}
