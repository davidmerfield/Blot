const{csrfSync} = require("csrf-sync");

const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req) =>  {
    return req.body["_csrf"];
  }, 
});

module.exports = csrfSynchronisedProtection;