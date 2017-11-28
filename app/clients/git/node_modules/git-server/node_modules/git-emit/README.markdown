git-emit
========

Expose git hooks through an EventEmitter.

This module is super handy when used in conjunction with
[pushover](https://github.com/substack/pushover).

example
=======

reject.js
---------

``` js
// randomly reject 50% of commits
var em = require('git-emit')(__dirname + '/repo.git');

em.on('update', function (update) {
    if (Math.random() > 0.5) update.reject()
    else update.accept()
});
```

Now we can create a new bare repo and run reject.js to listen for commits:

```
$ git init --bare repo.git
Initialized empty Git repository in /home/substack/projects/node-git-emit/example/repo.git/
$ node reject.js
```

The first time, our commit is rejected:

```
$ git push ~/projects/node-git-emit/example/repo.git master
Counting objects: 43, done.
Delta compression using up to 2 threads.
Compressing objects: 100% (36/36), done.
Writing objects: 100% (43/43), 6.15 KiB, done.
Total 43 (delta 18), reused 0 (delta 0)
Unpacking objects: 100% (43/43), done.
remote: error: hook declined to update refs/heads/master
To example/repo.git
 ! [remote rejected] master -> master (hook declined)
error: failed to push some refs to 'example/repo.git'
```
but the second time, the commit goes through!

```
$ git push ~/projects/node-git-emit/example/repo.git master
Counting objects: 43, done.
Delta compression using up to 2 threads.
Compressing objects: 100% (36/36), done.
Writing objects: 100% (43/43), 6.15 KiB, done.
Total 43 (delta 18), reused 0 (delta 0)
Unpacking objects: 100% (43/43), done.
To example/repo.git
 * [new branch]      master -> master
```

It works as expected hooray!

methods
=======

var gitEmit = require('git-emit')

var emitter = gitEmit(repoDir, cb)
----------------------------------

Install hooks into `repoDir`. `repoDir` should be either a .git directory from
an existing or new project or just a bare git directory created with
`git init --bare`.

`repoDir` should not have any existing hooks unless they were created with
git-emit.

Optionally pass in `cb(err, emitter)` to be notified when the hooks have been
installed into `repoDir` or an error has occured.

emitter.close()
---------------

Shut down the dnode listener used internally by git-emit.

events
======

You can listen for events corresponding to github hooks.

All events receive an update object.

Passive events fire and cannot influence the acceptance any actions.

Abortable events *MUST* respond to the update object with either
an `update.accept()` or an `update.reject()`.

passive events
--------------

* post-applypatch
* post-commit
* post-checkout
* post-merge
* post-receive
* post-update
* post-rewrite

abortable events
----------------

* applypatch-msg
* pre-applypatch
* pre-commit
* prepare-commit-msg
* commit-msg
* pre-rebase
* pre-receive
* update
* pre-auto-gc

update object
=============

All events are passed an update object as the first argument.

Abortable updates *MUST* call `update.accept()` or `update.reject()`.

Since there may be multiple listeners for any update, all listeners must
`accept()` an update for it to be ultimately accepted.

update.accept()
---------------

Accept an update.

update.reject()
---------------

Reject an update.

update.arguments
----------------

The raw arguments provided to the git hook on the command line.

update.lines
------------

An array of lines from `process.stdin`.

This attribute is only defined for `pre-recieve`, `post-receieve`, and
`post-rewrite` hooks.

update.canAbort
---------------

Whether the update is abortable.

install
=======

With [npm](http://npmjs.org) do:

    npm install git-emit

license
=======

MIT/X11
