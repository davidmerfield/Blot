Installing an upstart service 
------------------

cp $SERVICE.conf /etc/init/$SERVICE.conf
initctl reload-configuration

then verify with:

initctl list | grep -e '$SERVICE'


Uninstalling upstart service
--------------------

stop $service
rm /etc/init/$service.conf
initctl reload-configuration

then verify with:

initctl list | grep -e '$SERVICE'


Loading configuration
---------------------

I do not want to use something like [dotenv](https://github.com/motdotla/dotenv) because it seems like a mixing of concerns. I have tried using 

My current strategy is to use a configuration script in init.d/blot.conf

# Upstart

We're going to use upstart to ensure that all the services Blot needs run when the instance launches and stay alive afterwards. This makes it easier to boot or reboot an instance and recover from application crashes.

There are a few tools available to run processes at startup. Upstart seemed the most straightforward so that is what I'm using for now.

## Disabling init.d scripts

Since nginx, redis and monit come with init.d scripts, we'll need to make sure they're disabled first. Disable them like this:

```
> chkconfig redis-server off
> chkconfig nginx off
> chkconfig monit off
```

You can view registered init.d scripts to verify like this:

```
> chkconfig

redis           0:off   1:off   2:off    3:off    4:off    5:off    6:off
nginx           0:off   1:off   2:off    3:off    4:off    5:off    6:off
monit           0:off   1:off   2:off    3:off    4:off    5:off    6:off
...
```


## Blot

```
> sudo stop blot && sudo start blot
```

Monit will follow along with new process id so you shouldn't need to restart monit too.

## Redis

```
> sudo stop redis && sudo start redis
```

Blot might go down in this process but upstart should keep it up.

Look into this command:

sudo bash -c "echo always > enabled"

## NGINX

```
> sudo stop nginx && sudo start nginx
```

Nginx sometimes seems to play up with this error:
[emerg] host not found in upstream "localhost"

I suspect some dns isn't available. I changed localhost to 127.0.0.1 and will report if I see the error again. Monit is now also checking nginx...

# Logging

remove these then create them as ec2-user with 'touch'

/var/www/blot/logs/sys.log
/var/www/blot/logs/monit.log
/var/www/blot/logs/app.log

monit seems a little picky with its logfile and seems to wipe it clean sometimes, so I put it in a seperate one.

to rotate logs, just copy them then,

'> sys.log'
'> monit.log'
'> app.log'

this will not interrupt logging

## Resources

For getting the start syntax right:
https://lincolnloop.com/blog/joy-upstart/

For debugging upstart, this was useful:
http://askubuntu.com/questions/30796/upstart-script-doesnt-start

This explains why I can't use upstart's setuid feature on AWS Amazon linux:
http://askubuntu.com/questions/141908/why-does-upstart-need-setgid-when-i-have-setuid-and-the-user-is-a-member-of

This explains why upstart hanging bug with bad expect
https://bugs.launchpad.net/upstart/+bug/406397
https://github.com/ion1/workaround-upstart-snafu

For nginx, this was useful
https://www.nginx.com/resources/wiki/start/topics/examples/ubuntuupstart/

THese explains how to run redis. Key info is to expect fork / daemon if daemonize yes is in redis settings.
https://gist.github.com/brow/1315952
https://gist.github.com/bdotdub/714533