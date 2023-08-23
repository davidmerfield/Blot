
# command to sync folders 
rsync -azvv --exclude "/node_modules" --exclude "/logs" --exclude "/tmp" -e "ssh -i projects.pem" ec2-user@54.191.179.131:/var/www/blot/ /var/www/blot



Node server


service:

[Unit]
Description=blot node server
After=network.target nginx.service

[Service]
{{#env}}
Environment={{key}}={{value}}
{{/env}}
Environment=NODE_ENV=production
User=blot
Group=blot
ExecStart={{node.bin}} {{node.main}}
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=node-sample

[Install]
WantedBy=multi-user.target