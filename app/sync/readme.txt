Sync
----

The purpose of this module is to ensure that only one process makes changes to a blog's folder at a single time.


// This function lets you acquire a lock on a blog's folder
// This prevents buggy behaviour when making changes.

sync(blogID, function(err, folder, done){
    
  // if err, you could not acquire lock on folder

  folder.path = /var/blogs/blogID

  folder.update(path, function(){
  
  });
  
  // call done to release lock on folder
  done(err, callback);
});

It takes advantage of Blot's database and an implementation of
the redlock algorithm by Mike Marcacci https://redis.io/topics/distlock

To do
-----

* Expose extend option for long syncs...
* Think about removing the onerous done(err, callback) argument requirements –> can we pass in a callback?
* Test error handling more thoroughly
* What happens to the lock if an exception is thrown mid sync?



// handle renames without a load of tedious calls to Dropbox

// need to resolve path to 'blog folder' as soon as possible
// and handle changes to 'blog folder' if users has multiple blogs inside dropbox

-> use information in local state? this seems smart...
-> why not handle all rename logic locally?

// focus on using Dropbox to keep a folder in sync

what happens if a file moves while it is downloading?

expose three commands

set (add / update)
move (also guessed from drops & sets)
drop


# Strategy to sync a folder to remote server

Syncs appear as create or drops

Given an array of changes.
  
filter changes and make them relative to a blog's folder
-> move add them to individual blogs queue
-> filter renames
-> sort changes and put drops before creates & renames?

push timestamped list of changes to redis queue per blog

Save new folder state instantly.

call queue.process (blogID)

pop change from front of queue set, to active set, if fails, return it to front of queue.

-> on server restart, return all active to queue, then call queues

for drops, do the drop

for creates, make a dropbox client and get the file to save it

Immediately process drops. 

Once all is done, run a validation of the folder? Probably not. Maybe do this once an hour, or once a day? Would need to wait for queue to empty for this to work.

# Validate

build local tree of folder, in memory? fine.
build remote tree of folder -> client.delta('')

compare trees, drop any ghost local entries 

14. sync

the problem

blot does not handle sync notifications from dropbox well.

- for some reason, sync locked up for allpole. this is catastrophic, much worse than multiple entries?
- for some reason, ben log has multiple drafts.

let's say you add a big directory of files to blot's folder.

Blot will recieve a webhook, get the list of changed files and start downloading them to process them.

This could take a long a while – if during the downloading the user changes one of the files, then the dropbox will notify again. Since the previous sync is not complete, dropbox will send the entire list of changes again, as well as the change.

## the current strategy is to block multiple concurrent syncs for a user, and re-sync after each successful sync until no changes are detected.

## ideal strategy?

- on webhook, fetch changes
  then handle 'instant changes' instantly (drop, rename, ignore, unignore)
  store changes which require a download to a queue
  then immediately save the folderstate
  then move down the queue
  - downloading and setting as needed?
  - this queue would persist, so if the server restarted it could finish OK.
  all modules should be either 'set' or 'drop' to keep things simple?

- process the changes in the queue, if a file needs to be downloaded, then download
  - this is where a failure might happen,

  if dealing with a particular change i


the goal is to set entry idempotent to permit multiple syncs
assuming no entry called 'foo.txt', running:

Entry.create(1, {path: 'foo.txt', html: 'A', updated: 1}, callback);
Entry.create(1, {path: 'foo.txt', html: 'B', updated: 2}, callback);
 and only have one entry ID generated, with the content of the
 most recent updated stored.

 set    - store entry JSON against path
        - if existing updated and updated > new updated, abort
        - if no JSON exists, gen new ID
        - if no created exists, gen new created
        - store path against entry ID

 rename - redis.rename path
        - update to store new path against ID


ensure the mtime setting works in unix as well as it does on OSX