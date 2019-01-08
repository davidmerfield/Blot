# Setting up Blot on your own machine

This is a short guide to installing Blot on your machine. I develop Blot on OSX and deploy Blot on one of Amazon's Linux distributions. Please note that Blot is not container-ized and this process is *involved*. My grand vision is to eventually remove redis and nginx, and make the setup of a development environment as simple as ```git clone``` and ```npm install```.

## Prerequisites

- [nvm](https://github.com/creationix/nvm) - Read the [installation guide](https://github.com/creationix/nvm/blob/master/README.md)
  - [node](https://nodejs.org/en/) (use version ```8.12.0``` per [package.json](/package.json), installed using nvm)
  - [npm](https://www.npmjs.com) (use version ```6.4.1```, installed using nvm)
- [redis](https://redis.io/) - Read the [installation guide](http://jasdeep.ca/2012/05/installing-redis-on-mac-os-x/)
- [pandoc](https://pandoc.org) - Read the [installation guide](https://pandoc.org/installing.html)
- [git](https://git-scm.com) - Read the [installation guide](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [nginx](https://nginx.org/) - Read the [installation guide](https://coderwall.com/p/dgwwuq/installing-nginx-in-mac-os-x-maverick-with-homebrew)

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

## Creating an account 

Since you haven't loaded in Stripe credentials, you'll want to create a new demo user and blog manually:

```
node scripts/user/create example@example.com
```

Once you have set up an account, create a blog manually:

```
node scripts/blog/create example@example.com example
```

Use the 'local client' when you set up your blog, since you haven't set up Dropbox credentials either.

## Useful scripts

Generate a one-time log-in link for a given username:

```
node scripts/access.js <username>
```

Save and load state of server:

```
node scripts/folder/save.js <label>
node scripts/folder/load.js <label>
```