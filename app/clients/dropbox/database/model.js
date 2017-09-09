module.exports = {

  // We use the account ID to work out which
  // sites need to be synced when we recieve
  // a webhook from Dropbox.
  account_id: 'string',

  // We store the user's Dropbox account
  // email address to help them identify
  // which dropbox account they have connected.
  email: 'string',

  // This token is used to authenticate
  // requests to Dropbox's API
  access_token: 'string',

  // If Blot encounters certains errors when
  // calling Dropbox's API we store the value.
  // Some errors which require user attention
  // include missing folders or revoked access.
  // This is an HTTP status code, e.g. 409
  // and is reset to zero after a successful sync
  error_code: 'number',

  // Date stamp for the last successful
  // sync of this site.
  last_sync: 'number',

  // True if Blot has full access to the user's
  // Dropbox folder, false if we only have
  // access to a folder in their Apps folder.
  // This is used to determine to which oauth
  // authentication route we send the user.
  full_access: 'boolean',

  // This is the folder we show to the
  // user on the clients configuration
  // page. This isn't dependable since
  // the user can rename their site's
  // folder. We update it with each sync
  folder: 'string',

  // This is a dropbox-generated ID for
  // the user's site folder. If the user
  // has given us app folder permission,
  // and they only have one site, then it will
  // be blank (effectively root). If the
  // user has given us full folder permission
  // and uses their entire Dropbox for blot,
  // it will also be blank.
  folder_id: 'string',

  // This is a dropbox-generated cursor
  // which we pass to the dropbox api
  // to retrieve a list of changes to their
  // site's folder. It will be an empty string
  // before the user syncs their folder for
  // the first time. It will be reset if the
  // user removes their folder.
  cursor: 'string'
};