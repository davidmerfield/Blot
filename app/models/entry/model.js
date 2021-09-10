module.exports = {
  id: "string",
  guid: "string", // used to identify an entry across different paths / urls, needed to make disqus comments work, for instance.
  url: "string",
  permalink: "string",
  title: "string",
  titleTag: "string", // The HTML tag containing the title text
  body: "string", // html excluding the HTML tag for its title
  summary: "string", // plain text summary of article
  teaser: "string", // stuff before <!-- more -->, used before read more linkss..
  teaserBody: "string", // teaser excluding titleTag
  more: "boolean", // whether teaser differs from HTML
  html: "string",
  slug: "string",
  name: "string",
  path: "string",
  pathDisplay: "string", // path with case-preserved, for clients in which everything is lowercased
  size: "number",
  tags: "array",
  dependencies: "array",
  menu: "boolean",
  page: "boolean",
  deleted: "boolean",
  draft: "boolean",
  scheduled: "boolean",
  thumbnail: "object",
  dateStamp: "number", // UTC timestamp for resolved date
  created: "number", // UTC timestamp for when the entry was added to Blot
  updated: "number", // UTC timestamp for file mtime
  metadata: "object",
};
