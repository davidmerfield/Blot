var cheerio = require("cheerio");
var helper = require("helper");
var UID = helper.makeUid;

module.exports = function(html) {
  var $ = cheerio.load(html, { decodeEntities: false });

  var changes = false;
  var postfix = UID(3);

  // The purpose of this is to prefix all the links
  // and IDs which start with #fn... so that
  // multiple entries with footnotes work nicely
  // on the same page.
  $(".footnotes ol li").each(function() {
    changes = true;

    var noteID = $(this).attr("id");

    // Sometimes people make their own footnotes...
    // the colon fucks with cheerio so I just ignore
    // note identifiers if they have them. Pandoc
    // never makes note identifiers with colons.
    if (!noteID || noteID.indexOf(":") > -1 || noteID.slice(0, 2) !== "fn") {
      return;
    }

    var id = noteID.slice("fn".length);
    var refID = "fnref" + id;

    var newNoteID = "footnote-" + id + postfix;
    var newRefID = "ref-" + id + postfix;

    $(this).attr("id", newNoteID);

    $('a[href="#' + noteID + '"]')
      .removeClass("footnoteRef")
      .addClass("footnote-ref")
      .attr("href", "#" + newNoteID);

    $('a[href="#' + refID + '"]')
      .attr("href", "#" + newRefID)
      .addClass("footnote-back");

    $("#" + refID).attr("id", newRefID);
  });

  return changes ? $.html() : html;
};
