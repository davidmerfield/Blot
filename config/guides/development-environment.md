# Setting up Blot on your own machine

Prerequisites:

- [nvm](https://github.com/creationix/nvm)  (https://github.com/creationix/nvm/blob/master/README.md)
  - [node](https://nodejs.org/en/) (version 8.12.0, installed using nvm)
  - [npm](https://www.npmjs.com) (version 6.4.1, installed using nvm)
- [redis](https://redis.io/) *Read the [installation guide on MacOs](http://jasdeep.ca/2012/05/installing-redis-on-mac-os-x/)*

## Getting the codebase

Clone the repo (700mb, sorry!)

```
git clone https://github.com/davidmerfield/Blot
```

Move into the repo's root directory and then run npm install:

```
cd Blot
npm install
```

Fill out and then source the environment variables in environment.dev.sh

```
export BLOT_HOST=localhost
export BLOT_CACHE_DIRECTORY=~/Projects/testblot/Blot/data/cache
export BLOT_SESSION_SECRET=abc
```

Download and install redis. Start a redis server using the redis.conf file in /config

Run the node.js application like this:

node app

## Creating a test account

Create a new demo user:

node scripts/user/create example@example.com