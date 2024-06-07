var Template = require("models/template");

var ERROR = require("./error");
var loadView = require("./load");
var renderLocals = require("./locals");
var finalRender = require("./main");
var retrieve = require("./retrieve");

var ensure = require("helper/ensure");
var extend = require("helper/extend");
var callOnce = require("helper/callOnce");
var config = require("config");
var CACHE = config.cache;

// The http headers
var CONTENT_TYPE = "Content-Type";
var CACHE_CONTROL = "Cache-Control";

var UglifyJS = require("uglify-js");
var CleanCSS = require("clean-css");
var minimize = new CleanCSS();

var cacheDuration = "public, max-age=31536000";
var JS = "application/javascript";
var STYLE = "text/css";

module.exports = function (req, res, _next) {
  res.renderView = render;

  return _next();

  function render(name, next, callback) {
    // console.log(req.url, 'rendering', viewName);

    ensure(name, "string").and(next, "function");

    if (!req.template) return next();

    var blog = req.blog;
    var blogID = blog.id;
    var templateID = req.template.id;

    // We have a special case for Cloudflare
    // because some of their SSL settings insist on fetching
    // from the origin server (in this case Blot) over HTTP
    // which causes mixed-content warnings.
    var fromCloudflare =
      Object.keys(req.headers || {})
        .map((key) => key.trim().toLowerCase())
        .find((key) => key.startsWith("cf-")) !== undefined;

    if (callback) callback = callOnce(callback);

    Template.getFullView(blogID, templateID, name, function (err, response) {
      if (err) {
        return next(err);
      }

      if (!response) {
        err = new Error(
          `The view '${name}' does not exist under templateID=${templateID}`
        );
        err.code = "NO_VIEW";
        return next(err);
      }

      var viewLocals = response[0];
      var viewPartials = response[1];
      var missingLocals = response[2];
      var viewType = response[3];
      var view = response[4];

      extend(res.locals)
        .and(viewLocals)
        .and(req.template.locals)
        .and(blog.locals);

      extend(res.locals.partials).and(viewPartials);

      retrieve(req, missingLocals, function (err, foundLocals) {
        extend(res.locals).and(foundLocals);

        // LOAD ANY LOCALS OR PARTIALS
        // WHICH ARE REFERENCED IN LOCALS
        loadView(req, res, function (err, req, res) {
          if (err) return next(ERROR.BAD_LOCALS());

          // VIEW IS ALMOST FINISHED
          // ALL PARTRIAL
          renderLocals(req, res, function (err, req, res) {
            if (err) return next(ERROR.BAD_LOCALS());

            var output;

            var locals = res.locals;
            var partials = res.locals.partials;

            // ?debug=true _AND_ ?json=true to get template locals as JSON
            if (req.query && (req.query.debug || req.query.json)) {
              if (callback) return callback(null, res.locals);

              res.set("Cache-Control", "no-cache");
              return res.json(res.locals);
            }

            try {
              output = finalRender(view, locals, partials);
            } catch (e) {
              return next(ERROR.BAD_LOCALS());
            }

            if (callback) {
              return callback(null, output);
            }

            // We need to persist the page shown on the preview inside the
            // template editor. To do this, we send the page viewed to the
            // parent window (i.e. the page which embeds the preview in an
            // iframe). If we can work out how to do this in a cross origin
            // fashion with injecting a script, then remove this.
            if (req.preview && viewType === "text/html") {
              output = output
                .split("</body>")
                .join(
                  "<script>window.onload = function() {window.top.postMessage('iframe:' +  window.location.pathname, '*');};</script></body>"
                );
            }

            // Only cache JavaScript and CSS if the request is not to a preview
            // subdomain and Blot's caching is turned on.
            if (
              CACHE &&
              !req.preview &&
              (viewType === STYLE || viewType === JS)
            ) {
              res.header(CACHE_CONTROL, cacheDuration);
            }

            // Replace protocol of CDN links for requests served over HTTP
            if (
              viewType.indexOf("text/") > -1 &&
              req.protocol === "http" &&
              fromCloudflare === false &&
              output.indexOf(config.cdn.origin) > -1
            )
              output = output
                .split(config.cdn.origin)
                .join(config.cdn.origin.split("https://").join("http://"));

                // if the request is for the index page of a preview site,
                // inject the script to generate a screenshot of the page
                // on demand

                const screenshotScripts = `
                <script src="/html2canvas.min.js"></script>
<script>
function generateScreenshot(scale = 0.4) {
  // Get the current viewport dimensions
  const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

  html2canvas(document.body, {
      width: viewportWidth,
      height: viewportHeight,
      windowWidth: viewportWidth,
      windowHeight: viewportHeight,
      x: 0,
      y: 0,
      logging: false,
      useCORS: false,      
  }).then(fullCanvas => {


    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailContext = thumbnailCanvas.getContext('2d');
    thumbnailCanvas.width = viewportWidth * scale;
    thumbnailCanvas.height = viewportHeight * scale;
    thumbnailContext.drawImage(fullCanvas, 0, 0, viewportWidth * scale, viewportHeight * scale);

      const thumbnailDataUrl = thumbnailCanvas.toDataURL('image/png');

      window.parent.postMessage({ type: 'screenshot', screenshot: thumbnailDataUrl }, '*');
  }).catch(error => {
    window.parent.postMessage({ type: 'screenshot', screenshot: '' }, '*');
  });
}


window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'requestScreenshot') {
      generateScreenshot();
  }
});
</script>`;

    if (req.preview && viewType === "text/html" && req.query.screenshot) {
      
      // replace all URLs with the CDN URL with the local URL
      // so we have no cross-origin issues
      output = output.split(config.cdn.origin + '/' + req.blog.id).join(req.protocol + '://' + req.hostname);
    
      output = output
        .split("</body>")
        .join(screenshotScripts + "</body>");
    }


            // I believe this minification
            // bullshit locks up the server while it's
            // doing it's thing. How can we do this in
            // advance? If it throws an error, the user
            // probably forgot an equals sign or some bs...
            try {
              if (viewType === STYLE && !req.preview)
                output = minimize.minify(output || "").styles;

              if (viewType === JS && !req.preview)
                output = UglifyJS.minify(output, { fromString: true }).code;
            } catch (e) {}

            if (res.headerSent) {
              console.log(
                "headerSent about to trip for",
                req.headers["x-request-id"] && req.headers["x-request-id"],
                req.protocol + "://" + req.hostname + req.originalUrl
              );
            }

            try {
              res.header(CONTENT_TYPE, viewType);
              res.send(output);
            } catch (e) {
              next(e);
            }
          });
        });
      });
    });
  }
};
