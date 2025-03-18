module.exports = `[global]    
    # Performance & storage settings
    memory mode = save
    history = 3600
    update every = 1
    page cache size = 32
    dbengine disk space = 50
    dbengine multihost disk space = 50

[web]
    # Web server settings
    bind to = 0.0.0.0:19999
    enable authentication = no
    proxy = stats.blot.im
    trust proxy = *

[ml]
    enabled = no

[health]
    enable notifications = yes
    run at least every seconds = 10
    postpone alarms = no
    enable cloud notifications = no
    enable email notifications = no

[plugins]
    diskspace = yes
    cgroups = yes
    proc = yes
    tc = no
    idlejitter = no
    enable running new plugins = no
    checks = no
    cloud = no`;
