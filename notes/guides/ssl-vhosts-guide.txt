- Goal is to create a system for 10,000 sites, each of which is accessible on a blot subdomain and on their own custom domain.
- Letsencrypt seems to be the way to go.
- Test that redis-nginx-luaresty-letsencrypt combo on my personal sites.
- Document the process


----------


https://codeascraft.com/2017/01/31/how-etsy-manages-https-and-ssl-certificates-for-custom-domains-on-pattern/
https://community.letsencrypt.org/t/dynamic-ssl-using-nginx/18372/4
https://github.com/openresty/lua-nginx-module#ssl_certificate_by_lua_block
https://github.com/Vestorly/nginx-dynamic-ssl


- I had to make sure that openssl was more recent than before building openresty
https://www.digitalocean.com/community/questions/how-to-get-already-installed-nginx-to-use-openssl-1-0-2-for-alpn

- This will probably resolve the ssl cert renewal bug I've encountered. Possibly caused by permissions error for /var/www/blot/logs/renewal.log


My plan at the moment is to make use of openresty, which seems to be a lua+nginx mixture.

Ideally, I'd do everything in node js + express.

But this lua virtual host system seems cool. It will generate and process requests to whitelisted domains automatically for you.

https://github.com/GUI/lua-resty-auto-ssl

So I installed openresty. Nothing too complicated there:
http://openresty.org/en/installation.html

I needed to first upgrade openssl following these instructions:
https://www.digitalocean.com/community/questions/how-to-get-already-installed-nginx-to-use-openssl-1-0-2-for-alpn

Then configure openresty with build it with openssl

I needed to install pcre:
yum install pcre-devel

./configure --with-openssl=/usr/local/openssl-1.0.2h/
make
sudo make install

Perhaps instead I should use?
https://github.com/Daplie/greenlock-express

What are the performance implications?

I needed to install luarocks like this:
http://openresty.org/en/using-luarocks.html

Verify that port 443 is open on the ec2 instance (it should be)

Create the key used to start nginx
openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
-subj '/CN=sni-support-required-for-valid-ssl' \
-keyout /var/www/blot/config/nginx/auto-ssl-fallback.key \
-out /var/www/blot/config/nginx/auto-ssl-fallback.crt

I will need to create a new user 'www-data' for nginx and chown /tmp/shell.sock
https://github.com/GUI/lua-resty-auto-ssl/issues/80

Does the current setup work with the vhost forwarding schrick?

I will need to shut down whatever process keeps nginx alive when I switch from nginx to openresty.

I will need to test the redis lookup for whether or not to attempt to issue a certificate.

I will need to work out how to redirect http traffic to https

Then it should all work.

This is not a viable solution for blot.im subdomains given the LE rate limit of 20 certs per top level domain per week. I can ask for a rate limit increase here but the best strategy might be to increase the
https://docs.google.com/forms/d/e/1FAIpQLSetFLqcyPrnnrom2Kw802ZjukDVex67dOM2g4O8jEbfWFs3dA/viewform

It seems like there might be a bug with this library and upstart:
https://github.com/GUI/lua-resty-auto-ssl/issues/54
I might also need to remove expect fork.

I should look into caching the results of allow_domain
https://github.com/GUI/lua-resty-auto-ssl/issues/94

Don't worry too much about the lua shared dictionary size:

> If you exceed the available memory with too many domains, things will continue to work, but the certificate data will have to be fetched  from the slower storage, rather than the in-memory cache. So for optimal performance, you really want to ensure you have enough memory allocated to this setting to handle the number of domains you expect.
per: https://github.com/GUI/lua-resty-auto-ssl/issues/10#issuecomment-236388743


Keep an eye on this renewal / locking bug:
https://github.com/18F/api.data.gov/issues/325

I just changed the path to the nginx daemon script in the upstart configuration to openresty's path

then i reloaded the upstart configuration and monit configuration (not sure why monit was neccessary)

then I sudo stop nginx && sudo start nginx

I encountered an issue restarting the script:

nginx: [error] invalid PID number "" in "/usr/local/openresty/nginx/logs/nginx.pid"

openresty was not using the PID file specified in nginx.conf

I could restart the entire service jsut fine, and it would reload the configuration ok, but not send the signal:

sudo /usr/local/openresty/bin/openresty -s reload

I fixed this issue by creating a symbolic link between the pid file that openresty seems to be incorrectly checking and the correct PID file:

sudo ln -s /var/run/nginx.pid /usr/local/openresty/nginx/logs/nginx.pid

