module.exports = {
  id: 'string',
  token: 'string',
  email: 'string',

  // either a unix datestamp for last successful request to dropbox api
  // or 0, in which case the last successful request was invalid
  valid: 'number',

  cursor: 'string',
  folder: 'string', // path to Blot's folder inside user's Dropbox
  full: 'boolean' // whether Blot has full folder access
};