#! 

# use rsync to synchronize the the contents of ./data with config_directory

rsync -av --delete ./data/ config_directory