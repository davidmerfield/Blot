Config
------

Blot and the software it depends (Redis, NGINX) on are run and kept alive using a series of upstart scripts which can be viewed in the 'upstart' subdirectory. Additionally, we use Monit to ensure that the two web servers (Blot and NGINX) are responding to requests appropriately. 


Set up
------

Blot depends on a file like ./environment.sh located at "/etc/blot/environment.sh". You must copy the template in this directory there and fill it out. The [upstart job](./upstart/blot.conf) for Blot depends on this.

Then make sure you make all the contents of scripts/production executable:

```shell
chmod +x scripts/production/start_blot.sh
```

Production machine configuration (Linux)
----------------------------------------

I made these changes to the AWS instance when I created it. I believe they were in the redis guide for getting good performance out of ec2 instances. But I'm not 100% sure...

sysctl vm.overcommit_memory=1
sudo bash -c "echo never > /sys/kernel/mm/transparent_hugepage/enabled"
dd if=/dev/zero of=/swapfile1 bs=1024 count=4194304


Local machine configuration (MacOS)
-----------------------------------

Set up symlink if you install Blot elsewhere. Also link the caching directory:

ln -s ~/projects/blot /var/www/blot
ln -s ~/projects/blot/www /cache

I then followed this guide for getting *.development working (it's hosted on Blot!):

http://asciithoughts.com/posts/2014/02/23/setting-up-a-wildcard-dns-domain-on-mac-os-x/

I also followed this guide to get a local self-signed SSL certificate for blot.development:

https://certsimple.com/blog/localhost-ssl-fix

Then ensure dhparams exists and create symlinks to cert.pem and key.pem 

ln -s source target


Pitfalls
--------

- Don't use git to deploy code. One time I ran "git reset --hard origin/master". Don't do this. It removed a load of files. Thankfully not dump.rdb, or config.json. But it did remove all my ssl certs.
- Forgot to create flags.json
- Forgot to move dhparams to config/secrets


To do
-----

Automate setting up application environment using /etc/profile.d:

sudo echo "export BLOT_CACHE=true" > /etc/profile.d/blot.sh
sudo chmod +x /etc/profile.d/blot.sh

I verified that the variable was set by logging out and in, then running this:

echo "$BLOT_CACHE"