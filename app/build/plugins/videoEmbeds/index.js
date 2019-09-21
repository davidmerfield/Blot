var url = require("url");
var eachEl = require("../eachEl");
var punycode = require("punycode");

var Players = {
  "youtube.com": require("./youtube"),
  "m.youtube.com": require("./youtube"),
  "youtu.be": require("./youtube"),
  "www.youtube.com": require("./youtube"),

  "vimeo.com": require("./vimeo"),
  "www.vimeo.com": require("./vimeo")
};

function render($, callback) {
  // be wary of the effects of typeset's
  // auto soft hyphen insertion. this fucks
  // with the text of alink but not its href
  // we'd need to normalize both the href
  // and link text to remove space chars before
  // proceding. also url parse href gets screwy too.
  eachEl(
    $,
    "a",
    function(el, next) {
      var href = $(el).attr("href");
      var hostname;

      // Only replace links where URL
      // matches link text exactly
      if (href !== $(el).text()) return next();

      try {
        hostname = url.parse(href).hostname;
      } catch (e) {
        return next();
      }

      // See if we have a method for
      // retrieving a video from this host
      if (!Players[hostname]) return next();

      // fetchPlayer is a method unique to each
      // video streaming site which takes the URL
      // and returns HTML for player if valid video
      Players[hostname](href, function(err, template) {
        if (err || !template) return next();

        insertPlayer(el, template, href, next);
      });
    },
    callback
  );

  // This function takes the HTML code for a particular
  // video player and replaces the link element with that code
  function insertPlayer(el, template, href, callback) {
    // If the link has siblings and is inside
    // a p tag then replace the p tag with the
    // iframe instead of inserting the iframe
    // inside the p tag, which is illegal.
    if (
      $(el).parent().length &&
      $(el).parent()[0].name === "p" &&
      $(el)
        .parent()
        .text() !== href
    ) {
      $(el)
        .parent()
        .after(template);
      $(el).replaceWith("");

      // If the link has a parent which doesn't
      // have other child nodes, then replace the
      // entire parent with the template
    } else if ($(el).parent().length) {
      $(el)
        .parent()
        .replaceWith(template);

      // if the link is the rootnode (rare but possible)
      // then simply replace the link with the iframe...
    } else {
      $(el).replaceWith(template);
    }

    callback();
  }
}

module.exports = {
  render: render,
  category: "external",
  title: "Videos",
  description: "Embed videos from video URLs"
};
