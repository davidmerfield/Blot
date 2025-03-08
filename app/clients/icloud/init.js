const monitorMacServerStats = require('./util/monitorMacServerStats');
const resync = require('./util/resyncRecentlySynced');

module.exports = async () => {

  resync();
  
  monitorMacServerStats();
};
