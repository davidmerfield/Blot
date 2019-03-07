Config
------

This directory contains the scripts and configuration code to run NGINX, Redis and Monit, which combine with the application code in ../app to produce a useful blogging platform.

Upstart
-------

Blot and the software it depends on (Redis + NGINX) are started by three corresponding upstart scripts, which are invoked when the server boots or reboots. These scripts can also be controlled like so:

$ sudo stop blot
$ sudo start blot
$ sudo stop redis
$ sudo start redis

You can browse these scripts in the upstart subdirectory of this folder. Upstart monitors the processes started and attempts to respawn them if they die unexpectedly.

Additionally, upstart starts Monit to ensure that the two web servers (Blot and NGINX) are responding to requests appropriately. 

Monit
-----

