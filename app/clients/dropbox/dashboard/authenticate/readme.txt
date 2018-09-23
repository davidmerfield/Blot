Authentication routes
---------------------

If the blog does have an existing Dropbox account

  If the app and account have not changed, then save the new token and email address and sync.

  If the account has changed offer user a choice to migrate files from existing account or reset folder state to empty and sync

If the blog does not have an existing Dropbox acccount connected to it

  - If using an app folder

      if there is already a blog in the account,
        then tell the user that blot will move all the existing files into a sub directory, offer them a choice of name for the existing folder
        and a choice of name for the new folder

      if this is the first blog attached to this account
      then set the root as '/'

  - if using the full folder, then offer them the choice of folder for their blog


4. Authentication to a different client (e.g. from full to app folder)





