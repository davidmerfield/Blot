# Setting up Blot on your own machine

This is a short guide to installing Blot on your machine. I develop Blot on OSX and deploy Blot on one of Amazon's Linux distributions. Please note that Blot is not container-ized and this process is *involved*.

## Prerequisites

- [git](https://git-scm.com)
- [nvm](https://github.com/creationix/nvm) - Read the [installation guide](https://github.com/creationix/nvm/blob/master/README.md)
  - [node](https://nodejs.org/en/) (use version ```8.12.0```, installed using nvm)
  - [npm](https://www.npmjs.com) (use version ```6.4.1```, installed using nvm)
- [redis](https://redis.io/) - Read the [installation guide](http://jasdeep.ca/2012/05/installing-redis-on-mac-os-x/)

## Installing Blot

Get the code by cloning the git repository (700mb, sorry!):

```
git clone https://github.com/davidmerfield/Blot
```

Install the depencies once you're into the repo's root directory:

```
cd Blot
npm install
```

Export [environment variables](/config/environment.sh) needed by Blot:

```
export BLOT_HOST=localhost
export BLOT_CACHE_DIRECTORY=~/Projects/testblot/Blot/data/cache
export BLOT_SESSION_SECRET=abc
```

Start a redis server using the [redis configuation file](/config/redis.conf).

```
redis-server config/redis.conf
```

## Running the Blot server

Start the node.js application like this:

```
node app
```

You can then browse the public site:

```
http://localhost:8080
```

## Creating a test account

Since you haven't loaded in Stripe credentials, you'll want to create a new demo user manually:

```
node scripts/user/create example@example.com
```

Use the 'local client' when you set up your blog, since you haven't set up Dropbox credentials either.