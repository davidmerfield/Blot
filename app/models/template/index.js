/*

Methods used and locations:


create
  /Users/David/Projects/blot/app/dashboard/routes/settings/save/newTheme.js

getMetadata:
  /Users/David/Projects/blot/app/blog/index.js
  /Users/David/Projects/blot/app/dashboard/routes/editor/loadTemplate.js
  /Users/David/Projects/blot/app/dashboard/routes/settings/load/template.js
  /Users/David/Projects/blot/app/dashboard/routes/settings/save/theme.js

getFullView
  /Users/David/Projects/blot/app/blog/render/middleware.js

makeID
  /Users/David/Projects/blot/app/blog/vhosts.js

siteOwner
  /Users/David/Projects/blot/app/blog/vhosts.js

isOwner 
  /Users/David/Projects/blot/app/dashboard/routes/editor/loadTemplate.js

getViewByURL
  /Users/David/Projects/blot/app/blog/view.js

getAllViews
  /Users/David/Projects/blot/app/dashboard/routes/editor/loadSidebar.js
  /Users/David/Projects/blot/app/dashboard/routes/account/export.js

getTemplateList 
  /Users/David/Projects/blot/app/dashboard/routes/account/export.js
  /Users/David/Projects/blot/app/dashboard/routes/settings/load/theme.js

update
  /Users/David/Projects/blot/app/dashboard/routes/editor/local-editing.js
  /Users/David/Projects/blot/app/dashboard/routes/editor/settings.js

drop && model.metadata
  /Users/David/Projects/blot/app/dashboard/routes/editor/settings.js

setView && model.view && dropView && getView
  /Users/David/Projects/blot/app/dashboard/routes/editor/view.js

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
