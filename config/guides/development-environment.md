# Setting up Blot on your own machine

This is a short guide to installing Blot on your machine. I develop Blot on OSX and deploy Blot on one of Amazon's Linux distributions. Please note that Blot is not container-ized and this process is *involved*. My grand vision is to eventually remove redis and nginx, and make the setup of a development environment as simple as ```git clone``` and ```npm install```.

## Prerequisites

- [nvm](https://github.com/creationix/nvm) - Read the [installation guide](https://github.com/creationix/nvm/blob/master/README.md)
  - [node](https://nodejs.org/en/) (use version ```8.12.0``` per [package.json](/package.json), installed using nvm)
  - [npm](https://www.npmjs.com) (use version ```6.4.1```, installed using nvm)
- [redis](https://redis.io/) - Read the [installation guide](http://jasdeep.ca/2012/05/installing-redis-on-mac-os-x/)
- [git](https://git-scm.com) - Read the [installation guide](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

## Installing Blot

Get the code by cloning the git repository (700mb, sorry!):

```sh
git clone https://github.com/davidmerfield/Blot
```

Install the depencies once you're into the repo's root directory:

```sh
cd Blot
npm install
```

Export [environment variables](/config/environment.sh) needed by Blot:

```sh
export BLOT_HOST=blot.development
export BLOT_CACHE_DIRECTORY=~/Projects/Blot/data/cache
export BLOT_SESSION_SECRET=abc
export BLOT_MAILGUN_KEY=blah
```

In future, I would like to make the ```BLOT_CACHE_DIRECTORY``` and ```BLOT_MAILGUN_KEY``` environment variables non-essential.

Blot also depends on the existence of a few directories. This is because they are hard-coded into the configuration files for Redis and NGINX. In future, I would like to generate these configuration files and directories automatically based on the ```BLOT_DIRECTORY``` environment variable. For now, you will have to create them manually. 

Symlink the repo directory to `/var/www` (may need to create `/var/www` with `sudo mkdir -p /var/www`):

```sh
ln -s ~/Projects/Blot /var/www/blot
```

Make directories used by Blot:

```sh
# run in the repo root (e.g. ~/Projects/Blot)
mkdir logs db
```

## Starting Redis

Start a redis server using the [redis configuation file](/config/redis.conf).

```sh
redis-server config/redis.conf
```

Follow the [guide to generating the SSL certs](ssl-certificate-in-development.txt) needed by nginx in the development environment. Start nginx:

```sh
# `sudo` required due to needing to bind to port 80
sudo nginx -c /var/www/blot/config/nginx/dev_server.conf
```

Follow the [guide to getting wildcard subdomains](wildcard-subdomain-in-development.txt) working for the development environment host.

## Running the Blot server

Start the node.js application like this:

```sh
node app
```

You can then browse the public site:

```
https://blot.development
```

## Creating an account 

Since you haven't loaded in Stripe credentials, you'll want to create a new demo user and blog manually:

```sh
node scripts/user/create example@example.com
```

Once you have set up an account, create a blog manually:

```sh
node scripts/blog/create example@example.com example
```

Use the 'local client' when you set up your blog, since you haven't set up Dropbox credentials either.

## Useful scripts

Generate a one-time log-in link for a given username:

```sh
node scripts/access.js <username>
```

Save and load state of server:

```sh
node scripts/folder/save.js <label>
node scripts/folder/load.js <label>
```

## The full 

- [nginx](https://nginx.org/) - Read the [installation guide](https://coderwall.com/p/dgwwuq/installing-nginx-in-mac-os-x-maverick-with-homebrew)
- [pandoc](https://pandoc.org) - Read the [installation guide](https://pandoc.org/installing.html)
