[![Tests](https://travis-ci.com/davidmerfield/Blot.svg?branch=master)](https://travis-ci.com/davidmerfield/Blot)

I recommend you wait until I write a setup guide before attempting to run Blot on your own server.

The code is contained in /app. Start Blot like this:

  node app

Blot creates a subdirectory 'blogs' in this directory. Inside it will create a folder for each blog.

My distant goal for the project would be for you, the self-hoster, to be able to do something like this:

  npm install blot -g
  blot /path/to/folder

or something like this:

  var blot = require('blot');
  var blog = blot('/path/to/folder');

  blog.listen(8080);

Your blog would be built each time the process started and stored in memory. All you'd need to install would be node.js. This is a long way off but I will get there eventually! At the moment, Blot depends on redis, pandoc and nginx and various non-JavaScript tools for file compression.

Eventually I will sell Blot to self-hosters. It will be priced reasonably, with an option to pay for support. I like how Kirby does it.


## Production setup

I made these changes to the AWS instance when I created it. I believe they were in the redis guide for getting good performance out of ec2 instances. But I'm not 100% sure...

sysctl vm.overcommit_memory=1

sudo bash -c "echo never > /sys/kernel/mm/transparent_hugepage/enabled"

dd if=/dev/zero of=/swapfile1 bs=1024 count=4194304

## Local setup

Set up symlink if you install Blot elsewhere

ln -s ~/projects/blot /var/www/blot

Also link the caching directory:

ln -s ~/projects/blot/www /cache