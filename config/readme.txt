Config
------

This directory contains the scripts and configuration code to run NGINX, Redis and Monit, which combine with the node js server to produce a useful blogging platform. When setting up a new production or development machine, follow the respective guides in the guides directory. There are a number of scripts for updating Blot's configuration on the server, which are stored in scripts/production:

Upstart: reloading the scripts
sudo ./scripts/production/update_upstart.sh

Monit: reloading configuration
sudo ./scripts/production/reload_monit_rc.sh

NGINX: reloading configuration
sudo ./scripts/production/nginx_reload_configuration.sh


Upstart
-------

Used to start Blot, Redis, NGINX and monit when the server boots. You can browse these scripts in the upstart subdirectory of this folder. Upstart monitors the processes after they have started and attempts to respawn them if they exit.  For more about upstart, check the readme in the upstart subdirectory. 


Monit
-----

Used to check that a running server is still responsive.