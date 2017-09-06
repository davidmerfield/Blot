Clients are responsible for managing the source folder for a given site on Blot.

They may expose endpoints for authentication, periodic updates (like a sync webhook from Dropbox or a git hook).

They must expose certain methods that Blot can interact with in the abstract:

Abstract clients are used for:
- writing the welcome file for new blogs
- writing preview files for drafts
- removing preview files for deleted / published drafts
- reading and writing local template files

Client.create(blogID, function(err, client){

  client.write(blogID, '/foo.txt', 'bar', function(err){

  });
})