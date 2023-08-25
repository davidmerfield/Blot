#! 

# use rsync to synchronize the the contents of ./data with config_directory

rsync -av --delete ./data/ config_directory


# edit the openresty service and all the following:
# under [Service]:   'Restart=always'
mkdir -p /etc/systemd/system/openresty.service.d
echo "[Service]" > /etc/systemd/system/openresty.service.d/override.conf
echo "Restart=" >> /etc/systemd/system/openresty.service.d/override.conf
echo "Restart=always" >> /etc/systemd/system/openresty.service.d/override.conf

