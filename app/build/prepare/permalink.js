var mustache = require("mustache");
var DEFAULT = "{{slug}}";
var moment = require("moment");
require("moment-timezone");

// this needs to be pulled directly from the moment library
// i copied them from the docs.
var MOMENT_TOKENS = [
  "M",
  "Mo",
  "MM",
  "MMM",
  "MMMM",
  "Q",
  "Qo",
  "D",
  "Do",
  "DD",
  "DDD",
  "DDDo",
  "DDDD",
  "d",
  "do",
  "dd",
  "ddd",
  "dddd",
  "e",
  "E",
  "w",
  "wo",
  "ww",
  "W",
  "Wo",
  "WW",
  "YY",
  "YYYY",
  "Y",
  "gg",
  "gggg",
  "GG",
  "GGGG",
  "A",
  "a",
  "H",
  "HH",
  "h",
  "hh",
  "k",
  "kk",
  "m",
  "mm",
  "s",
  "ss",
  "S",
  "SS",
  "SSS",
  "SSSS",
  "SSSSS",
  "SSSSSS",
  "SSSSSSS",
  "SSSSSSSS",
  "SSSSSSSSS",
  "z",
  "zz",
  "Z",
  "ZZ",
  "X",
  "x",
];
var normalize = require("helper/urlNormalizer");
var makeSlug = require("helper/makeSlug");
var allow = [
  "slug",
  "name",
  "size",
  "path",
  "more",
  "menu",
  "page",
  "dateStamp",
  "created",
  "updated",
  "metadata",
];

// modified from here: https://gist.github.com/mathewbyrne/1280286
function removeDiacritics(str) {
  str = str || "";
  str = decodeURIComponent(str); // lol we shouldnt do this
  str = str.toLowerCase();

  var from = "àáâäæãåāçćčèéêëēėęîïíīįìłñńôöòóœøōõßśšûüùúūÿžźż";
  var to = "aaaaaaaaccceeeeeeeiiiiiilnnoooooooosssuuuuuyzzz";

  for (var i = 0, l = from.length; i < l; i++)
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));

  str = encodeURIComponent(str);

  return str;
}

var _ = require("lodash");
var urlNormalizer = require("helper/urlNormalizer");
var UID = require("helper/makeUid");
var makeSlug = require("helper/makeSlug");
var withoutExtension = require("helper/withoutExtension");

//'/style.css', '/script.js', '/feed.rss', '/robots.txt', '/sitemap.xml'
// are not possible because . is replaced with. ideally check for
// all template views here...
var banned = ["/archives", "/archive", "/search", "/tagged", "/public", ""];

var MIN_SUMMARY_SLUG_WORDS = 3;
var MAX_SUMMARY_SLUG_WORDS = 10;

var PERMALINK_PERMUTATIONS = 5;

// The random permalinks are
// this long. I figure 3 gives
// us (26 * 2 + 10)^3 (= 238,328)
// possible permalinks which is more
// than enough for one blog, espcially
// since the circumstances under
// which Blot needs to generate
// a random url are rare enough.
// It also avoids the issue of rude
// 4 letter words being generated.
var UID_LENGTH = 3;

// We generate this number
// of random permalinks in
// case all else fails.
var UID_PERMUTATIONS = 500;

// console.log(Candidates({
//   permalink: '',
//   slug: '',
//   summary: '',
//   url: '',
//   name: 'a.jpg',
//   path: '/a.jpg'
// }));

function Candidates(blog, entry) {
  var candidates = [];

  // Don't use the permalink format for pages
  // or posts with user specified permalinks.
  if (
    !entry.metadata.permalink &&
    !entry.metadata.slug &&
    !entry.metadata.link &&
    !entry.metadata.url &&
    !entry.page
  ) {
    entry.permalink = Permalink(blog.timeZone, blog.permalink.format, entry);
  }

  // The user has specified a permalink in the
  // entry's metadata. We should use this if we can.
  if (entry.permalink) {
    candidates.push(entry.permalink);

    // If the permalink is unavailable, try appending a number
    // e.g. if 'apple', try 'apple-2', 'apple-3' ... 'apple-99'
    for (var i = 2; i < PERMALINK_PERMUTATIONS; i++)
      candidates.push(entry.permalink + "-" + i);
  }

  // This is generated from the entry's title
  if (entry.slug) {
    candidates.push(entry.slug);
  }

  if (entry.name) candidates.push(makeSlug(withoutExtension(entry.name)));

  if (entry.path)
    candidates.push(
      makeSlug(withoutExtension(entry.path.split("/").join("-")))
    );

  if (entry.summary) {
    var words = entry.summary.split(" ");

    for (
      var y = MIN_SUMMARY_SLUG_WORDS;
      y < words.length && y < MAX_SUMMARY_SLUG_WORDS;
      y++
    ) {
      candidates.push(makeSlug(words.slice(0, y).join("-")));
    }
  }

  // If we make it path the permalink chosen by the
  // user, it's possible that we fell through to the
  // randomly generated (UID()...) permalinks below.
  // If so, we should insert the entry's previous URL
  // if it exists to ensure that the entry retains
  // a randomly generated URL consistently.
  if (entry.url) candidates.push(entry.url);

  for (var j = 0; j < UID_PERMUTATIONS; j++) candidates.push(UID(UID_LENGTH));

  // Trim, lowercase, strip trailing /, add leading /
  // ensure valid url pathname. Always returns a string
  // can be empty if invalid or just '/'
  candidates = candidates.map(urlNormalizer);

  // We store the decoded version. Not sure if this is a good idea
  // or not but it works for now. Pandoc *en*codes by default.
  // Perhaps I could store both?
  candidates = candidates.map(function (url) {
    try {
      url = decodeURI(url);
    } catch (e) {
      console.log("Error: Could not decodeURIComponent for:", url, e.message);
    }

    return url;
  });

  candidates = candidates.filter(function (candidate) {
    if (!candidate) return false;

    // WE DONT EVER ADD ENTRY.PATH so images are always accessible
    // It's possible that entry.name when normalized === entry.path
    if (entry.path && candidate === entry.path) return false;

    if (banned.indexOf(candidate) > -1) return false;

    return true;
  });

  candidates = _.uniq(candidates);

  return candidates;
}

function Permalink(timeZone, format, entry) {
  // Add the permalink automatically if the metadata
  // declared a page with no permalink set. We can't
  // do this earlier, since we don't know the slug then
  var permalink = "";
  var view = {};

  format = format || DEFAULT;

  try {
    // this is so inefficient
    MOMENT_TOKENS.forEach(function (token) {
      view[token] = moment
        .utc(entry.dateStamp || entry.updated)
        .tz(timeZone)
        .format(token);
    });

    for (var i in entry) if (allow.indexOf(i) > -1) view[i] = entry[i];

    view.stem = makeSlug(entry.path.slice(0, entry.path.lastIndexOf(".")));

    // this needs a better name but make sure to update any
    // existing custom formats for folks...
    view["name-without-extension"] = view.name.slice(
      0,
      view.name.lastIndexOf(".")
    );

    // this needs a better name but make sure to update any
    // existing custom formats for folks...
    view["slug-without-diacritics"] = removeDiacritics(view.slug);

    // we don't want mustache to escape anything...
    format = format.split("{{").join("{{{");
    format = format.split("}}").join("}}}");

    permalink = mustache.render(format || DEFAULT, view);
  } catch (e) {
    permalink = "";
  }

  return normalize(permalink);
}

module.exports = (blog, entry) => {
  return Candidates(blog, entry);
};
