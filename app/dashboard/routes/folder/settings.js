module.exports = function (server) {

  server.get('folder/settings', function(req, res){

    // Attempt to pause the syncing for this user
    // by requesting a sync token and holding it until
    // we have migrated the folder. Todo In future, I should
    // add a foolproof way to wait until any existing
    // syncs have finished and prevent any future syncs from
    // happening before the folder migration has finished.
    // This will be useful for the remove blog feature...
    SyncLease.request(uid, function(){

      migrateFolder(user, newBlog, function(err){

        // We release the sync token before
        // handling any folder migration errors
        // to ensure the user's blog continues to sync
        SyncLease.release(uid, function(){

          if (err) return next(err);

          firstPost(uid, newBlog, function(err){

            if (err) return next(err);

            return res.redirect('/');
          });
        });
      });
    });
  });
};


