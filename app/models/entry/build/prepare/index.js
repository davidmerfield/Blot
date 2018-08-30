var debug = require('debug')('blot:models:entry:build:prepare');
var _ = require("lodash");
var helper = require("../../../../helper");
var falsy = helper.falsy;
var time = helper.time;
var cheerio = require("cheerio");

var decode = require("he").decode;

var normalize = helper.urlNormalizer;
var pathNormalizer = helper.pathNormalizer;
var type = helper.type;

var makeSlug = helper.makeSlug;
var ensure = helper.ensure;
var Model = require("../../model");

var isHidden = require("./isHidden");
var Summary = require("./summary");
var Teaser = require("./teaser");
var Title = require("./title");
var Tags = require("./tags");

var overwrite = [
  "summary",
  "title",
  "titleTag",
  "body",
  "summary",
  "teaser",
  "teaserBody"
];

function canOverwrite(key) {
  return overwrite.indexOf(key) > -1;
}

// id: 'number', // this is handled by save
// created: 'number', // this is handled by save
// url: 'string', // this is handled by set
// scheduled: scheduled, // this is handled by set

function Prepare(entry) {
  
  ensure(entry, "object")
    .and(entry.path, "string")
    .and(entry.size, "number")
    .and(entry.html, "string")
    .and(entry.updated, "number")
    .and(entry.draft, "boolean")
    .and(entry.metadata, "object");

  // The best areas of for speed improvements lie
  // in the next four blocks!

  debug(entry.path, "Generating cheerio");
  var $ = cheerio.load(entry.html, {
    decodeEntities: false,
    withDomLvl1: false // this may cause issues?
  });
  debug(entry.path, "Generated  cheerio");

  // store titleTag, teaser, remainder;

  // var body = teaser + remainder;
  // var html = titleTag + body;

  debug(entry.path, "Generating title");
  var parsedTitle = Title($, entry.name);
  entry.title = parsedTitle.title;
  entry.titleTag = parsedTitle.tag;
  entry.body = parsedTitle.body;
  debug(entry.path, "Generated  title");

  debug(entry.path, "Generating summary");
  entry.summary = Summary($, entry.title);
  debug(entry.path, "Generated  summary");

  debug(entry.path, "Generating teasers");
  entry.teaser = Teaser(entry.html) || entry.html;
  entry.teaserBody = Teaser(entry.body) || entry.body;
  entry.more = entry.teaser !== entry.html;
  debug(entry.path, "Generated  teasers");

  debug(entry.path, "Generating makeSlug");
  entry.slug = makeSlug(entry.metadata.title || entry.title);
  debug(entry.path, "Generated  makeSlug");

  debug(entry.path, "Generating tags");
  var tags = [];

  if (entry.metadata.tags) tags = entry.metadata.tags.split(",");

  tags = Tags(entry.path, tags);
  tags = _(tags)
    .map(function(tag) {
      return tag.trim();
    })
    .compact(tags)
    .uniq()
    .value();

  entry.tags = tags;
  debug(entry.path, "Generated  tags");

  debug(entry.path, "Generating booleans");

  entry.deleted = false;

  // An entry is a draft if it has draft: yes in its metadata, or if it is inside
  // a folder called drafts.
  if (truthy(entry.metadata.draft)) entry.draft = true;

  // An entry becomes a page if it:
  // begins with an underscore
  // or is inside a folder called 'pages'
  // or has 'Page: yes' in its metadata
  // or has 'Menu: X' in its metadata, page is implied
  entry.page =
    isHidden(entry.path) ||
    isPage(entry.path) ||
    truthy(entry.metadata.page) ||
    entry.metadata.menu !== undefined;

  // An entry is only added to the menu:
  // if it is a page
  // and it does not start with an underscore
  // and it does not have defined, falsy (e.g. 'no') menu metadata
  entry.menu =
    entry.page &&
    !isHidden(entry.path) &&
    (entry.metadata.menu === undefined || truthy(entry.metadata.menu));

  debug(entry.path, "Generated  booleans");

  debug(entry.path, "Generating permalink");
  // Add the permalink automatically if the metadata
  // declared a page with no permalink set. We can't
  // do this earlier, since we don't know the slug then
  entry.permalink =
    entry.metadata.permalink || entry.metadata.slug || entry.metadata.url || "";
  entry.permalink = normalize(entry.permalink);

  debug(entry.path, "Generated  permalink");

  debug(entry.path, "Generating meta-overwrite");

  for (var key in entry.metadata)
    if (canOverwrite(key) && type(entry.metadata[key], Model[key]))
      entry[key] = entry.metadata[key];

  debug(entry.path, "Generated  meta-overwrite");

  debug(entry.path, "Generating decoding");
  entry.title = decode(entry.title);
  entry.summary = decode(entry.summary);
  for (var tag in entry.tags) entry.tags[tag] = decode(entry.tags[tag]);
  debug(entry.path, "Generated  decoding");

  return entry;
}

function truthy(str) {
  return !falsy(str);
}

function isPage(path) {
  return (
    pathNormalizer(path).indexOf("/page/") > -1 ||
    pathNormalizer(path).indexOf("/pages/") > -1
  );
}

module.exports = Prepare;
