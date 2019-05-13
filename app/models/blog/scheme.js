// Type for each LINK
var LINK = { id: "string", metadata: "object", label: "string", url: "string" };

var PERMALINK = { format: "string", custom: "string", isCustom: "boolean" };

// KEY, TYPE, WRITE?, PUBLIC?
var DECLARATION = {
  id: ["string", false, false],
  owner: ["string", false, false],
  handle: ["string", true, true],
  client: ["string", true, false],
  title: ["string", true, true],
  avatar: ["string", true, true],
  template: ["string", true, false],
  domain: ["string", true, true],
  timeZone: ["string", true, true],
  plugins: ["object", true, true],
  permalink: [PERMALINK, true, true],
  menu: [[LINK], true, true],

  // these need to be removed, what the hell was I thinking?
  cssURL: ["string", false, true],
  scriptURL: ["string", false, true],
  dateDisplay: ["string", true, true],
  hideDates: ["boolean", true, true],
  cacheID: ["number", false, true],
  roundAvatar: ["boolean", true, true],
  dateFormat: ["string", true, true],

  // Flags
  forceSSL:     ['boolean', true,   false],
  isDisabled:   ['boolean', true,   false],
  new_dashboard: ['boolean', true,  false],
  new_markdown_renderer: ['boolean', true,  false],
  redirectSubdomain: ['boolean', true,   false]
};

var MODEL = { TYPE: {}, PUBLIC: [], WRITEABLE: [] };

for (var i in DECLARATION) MODEL.TYPE[i] = DECLARATION[i][0];

for (var i in DECLARATION) if (DECLARATION[i][1]) MODEL.WRITEABLE.push(i);

for (var i in DECLARATION) if (DECLARATION[i][2]) MODEL.PUBLIC.push(i);

module.exports = MODEL;
