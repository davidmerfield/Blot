Blot and the software it depends (Redis, NGINX) on are run and kept alive using a series of [upstart](https://en.wikipedia.org/wiki/Upstart) scripts which can be viewed in [/upstart](./upstart). Additionally, we use [Monit](https://en.wikipedia.org/wiki/Monit) to ensure that the two web servers (Blot and NGINX) are responding to requests appropriately. 

We use NGINX as a reverse proxy. It sits in front of the Blot server and handles static file delivery and SSL. Perhaps in future we can remove it but until now it seems worthwhile, especially given the automated certificate system Blot uses called [lua-resty-auto-ssl](https://github.com/GUI/lua-resty-auto-ssl).

# Fuck ups

I did this:

git fetch origin
git reset --hard origin/master

Don't do this.

it removed a load of files from my remote BRANCH

thankfully not dump.rdb, or config.json

but it did remove all my ssl certs

and a few dirs


# Set up

Blot depends on a file like ./environment.sh located here:

```
/etc/blot/environment.sh
```

You must copy the template in this directory there and fill it out. The [upstart job](./upstart/blot.conf) for Blot depends on this.

Then make sure you make all the contents of scripts/production executable:

```shell
chmod +x scripts/production/start_blot.sh
```


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

I then followed this guide for getting *.development working (it's hosted on Blot!)

http://asciithoughts.com/posts/2014/02/23/setting-up-a-wildcard-dns-domain-on-mac-os-x/

I followed this guide to get a local self-signed SSL certificate for blot.development :https://certsimple.com/blog/localhost-ssl-fix

Then create symlinks to cert.pem and key.pem 

ln -s source target

Ensure dhparams exists...



---

## Research

Seems to be that setting up application environment is best done with a script in /etc/profile.d

I did these:

sudo nano /etc/profile.d/blot.sh

I put this inside:

export BLOT_CACHE=true

Then I made the script executable:

sudo chmod +x /etc/profile.d/blot.sh

I verified that the variable was set by logging out and in, then running this:

echo "$BLOT_CACHE"




## Moving redis guide

-- preparation

0. reset logfiles
1. backup data
2. stop monit to prevent it interfering
3. create dirs ~/config ~/config/secrets ~/db
4. sync ~/config/secrets with remote and verify they exist
5. update git files
6. copy new upstart configuration files
7. reload new upstart configuration
8. bgsave redis

-- brief downtime

1. stop and start nginx with new config

-- downtime

2. stop blot
3. stop redis
4. move ~/dump.rdb to ~/db/dump.rdb

cp /var/www/blot/dump.rdb /var/www/blot/db/dump.rdb

5. start redis
6. start blot

--- commands


mkdir /var/www/blot/config
mkdir /var/www/blot/config/secrets
mkdir /var/www/blot/db

rememeber dhparams!!!!


git pull origin master

sudo cp /var/www/blot/scripts/upstart/nginx.conf /etc/init/nginx.conf
sudo cp /var/www/blot/scripts/upstart/redis.conf /etc/init/redis.conf
sudo cp /var/www/blot/scripts/upstart/blot.conf /etc/init/blot.conf
sudo cp /var/www/blot/scripts/upstart/monit.conf /etc/init/monit.conf

sudo initctl reload-configuration
initctl list | grep -e 'blot\|nginx\|redis\|monit'
redis-cli bgsave

sudo stop nginx && sudo start nginx
sudo stop blot
sudo stop redis
cp /var/www/blot/dump.rdb /var/www/blot/db/dump.rdb
sudo start redis
sudo start blot


------- my fuck ups

forgot to create flags.json
forgot to move dhparams to config/secrets

# Strategies for zero downtime deployment

There's a daemon which runs all the time, kept alive with upstart

Monit will call a script to 'reboot'

  server will listen for kill event

    server will send appropriate responses to dropbox webhooks

    then call server.close

    then it will try to start new server

    then the second process calls close

    then it starts again with new code

Reboot will try to close an existing process if it can then
