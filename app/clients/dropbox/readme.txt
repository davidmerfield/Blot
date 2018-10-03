Dropbox client
--------------

This client synchronizes a folder in a Dropbox folder with a folder on Blot's server. It does this using Dropbox's webhook api and subsequent calls to filesListFolder, which accepts a cursor indicating the state of the folder at the last fetch. 

Dependencies
------------

    "dropbox": "^2.5.7",
    "dropbox-stream"
    "isomorphic-fetch"
    
Move this into this module when I start using git submodules or npm submodules properly.


To do
-----
* Adding an additional blog to existing app folder under constant webhooks failed. New blog had correct folder but old blog still used root. I guess we need to acquire a lock on ALL blogs interacting with that dropbox account.
* Extend sync lock during long syncs
* Write test to simulate process dying and restarting mid-pull. Does the client recover? 
* Write tests for a series of random dropbox client operations (pull, add, push, move, reset, delete) that can be seeded and reliably re-run in the case of failure.
* Look into getAccessTokenFromCode on DBSDK repo to avoid the mess in get_account.js https://github.com/dropbox/dropbox-sdk-js/issues/64
* Gracefuly retry wrapper around Dropbox
* Can we write to a folder_id instead of a path? It would be nice to be able to move the blog's folder even when writing the initial files to it, for example...
* This should be simple once we copy the exisiting state of the blog folder across. But right now it doesn't really do much. It resets the local server folder. Then resyncs.
* Update to latest version of Dropbox client.
* Make the folder in Dropbox rename automatically when the
user changes the username for one of their multiple blogs?

Complications
-------------

This client is fairly complicated. The complications mostly self imposed and partly due to the design Dropbox. Some of these complications are caused by the distinction between full and partial Dropbox access for Blot.

* Partial permission (known as an App folder)
  -------------------------------------------

  This method has obvious benefits and subtle limitations. The limitations are as follows: 
    1. Dropbox prevents users from sharing app folders as of May 2018.
    2. Dropbox also does not let you choose where the folder is located (it must be in /Apps).

* Allowing users to use the entire app folder for their first blog
  ----------------------------------------------------------------

  Given that we will allow folks to use Dropbox's app folder feature, we need to work out how to let users manage one or multiple blogs from a single app folder. The obvious solution, used by a lot of Blot's competitors, is to create a subfolder for the blog. But when the user has one blog, I don't like the idea of the Blot directory containing a single subdirectory. So for their first blog, the folder looks like. Then when the user creates a second blog in the app folder, restructure the folder like so:

Features
--------

- This client needs to properly acquire and release a lock on the blog's folder when modifying the client. 
- This client aqcuires then release the sync lock when it disconnects...
- App folder permissions
  - Can recover from the user deleting then restoring a folder inside the app folder
- Full folder permissions
  - Can recover from user moving blog folder
  - Can recover from user removing then restoring blog folder

Issues
------

What about the problem of downloading large files from Dropbox? Or slow writes?


Notes
-----

5/22/18 - I recently started to simplify some of the code for this client. For example, I have removed the option to switch to a different Dropbox account: this should now be done by disconnecting and reconnecting. I have also removed the interstitial page to disconnect from Dropbox. Perhaps I should work out how to include an undo button?
