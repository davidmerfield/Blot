/*

Methods used and locations:

getMetadata:
  /Users/David/Projects/blot/app/blog/index.js

getFullView
  /Users/David/Projects/blot/app/blog/render/middleware.js

siteOwner & makeID
  /Users/David/Projects/blot/app/blog/vhosts.js

getViewByURL
  /Users/David/Projects/blot/app/blog/view.js

getViews ?? should this be getAllViews?
  /Users/David/Projects/blot/app/dashboard/routes/editor/loadSidebar.js

getTemplateList && getAllViews
  /Users/David/Projects/blot/app/dashboard/routes/account/export.js

isOwner && getMetadata
  /Users/David/Projects/blot/app/dashboard/routes/editor/loadTemplate.js

update
  /Users/David/Projects/blot/app/dashboard/routes/editor/local-editing.js

update && drop && model.metadata
  /Users/David/Projects/blot/app/dashboard/routes/editor/settings.js

setView && model.view && dropView && getView
  /Users/David/Projects/blot/app/dashboard/routes/editor/view.js

getMetadata
  /Users/David/Projects/blot/app/dashboard/routes/settings/load/template.js

getTemplateList
  /Users/David/Projects/blot/app/dashboard/routes/settings/load/theme.js

create
  /Users/David/Projects/blot/app/dashboard/routes/settings/save/newTheme.js

getMetadata
  /Users/David/Projects/blot/app/dashboard/routes/settings/save/theme.js

updateFromFolder
  /Users/David/Projects/blot/app/sync/index.js
  
*/

module.exports = {
  create: require("./create"),
  update: require("./update"),
  getMetadata: require("./getMetadata"),
  setMetadata: require("./setMetadata"),

  getFullView: require("./getFullView"),
  getView: require("./getView"),
  getViewByURL: require("./getViewByURL"),
  setView: require("./setView"),
  dropView: require("./dropView"),
  getPartials: require("./getPartials"),
  getAllViews: require("./getAllViews"),
  getTemplateList: require("./getTemplateList"),

  drop: require("./drop"),

  parse: require("./parse"),
  readFromFolder: require("./readFromFolder"),
  writeToFolder: require("./writeToFolder"),
  updateFromFolder: require("./updateFromFolder"),
  slug: require("./slug"),

  makeID: require("./makeID"),
  isOwner: require("./isOwner"),
  siteOwner: "SITE",

  model: require("./model"),
  viewModel: require("./model").view,
  metadataModel: require("./model").metadata
};
