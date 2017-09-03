module.exports = {
  id: 'string',
  token: 'string',
  email: 'string',

  // either a unix datestamp for last successful request to dropbox api
  // or 0, in which case the last successful request was invalid
  // HTTP error code from the dropbox api
  valid: 'number',
  error: 'number',

  cursor: 'string',
  folder_id: 'string', // path to Blot's folder inside user's Dropbox
  full: 'boolean' // whether Blot has full folder access
};