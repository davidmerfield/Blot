/*

Methods used and locations:


create
  /Users/David/Projects/blot/app/dashboard/routes/settings/save/newTheme.js

getMetadata:
  /Users/David/Projects/blot/app/blog/index.js
  /Users/David/Projects/blot/app/dashboard/routes/editor/loadTemplate.js
  /Users/David/Projects/blot/app/dashboard/routes/settings/load/template.js
  /Users/David/Projects/blot/app/dashboard/routes/settings/save/theme.js

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
  drop: require("./drop"),
  getMetadata: require("./getMetadata"),

  getView: require("./getView"),
  getViewByURL: require("./getViewByURL"),
  setView: require("./setView"),
  dropView: require("./dropView"),

  getPartials: require("./getPartials"),
  getAllViews: require("./getAllViews"),
  getTemplateList: require("./getTemplateList"),

  writeToFolder: require("./writeToFolder"),
  updateFromFolder: require("./updateFromFolder"),

  slug: require("./slug"),
  isOwner: require("./isOwner"),
  model: require("./model")
};
