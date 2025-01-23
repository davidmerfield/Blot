#!/bin/sh

set -e

if [ -z "$SSH_KEY" ]; then
  echo "SSH_KEY variable missing, pass the path to the key as an argument to this script"
  exit 1
fi

if [ -z "$PUBLIC_IP" ]; then
  echo "PUBLIC_IP variable missing, pass the public ip address of the openresty instance as an argument to this script"
  exit 1
fi

if [ -z "$NODE_SERVER_IP" ]; then
  echo "NODE_SERVER_IP variable missing, pass the ip address of the node instance as an argument to this script"
  exit 1
fi

if [ -z "$REDIS_IP" ]; then
  echo "REDIS_IP variable missing, pass the ip address of the redis instance as an argument to this script"
  exit 1
fi


# build the openresty config files
echo "Building openresty config files..."
BUILD_SCRIPT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/build-config.js"
node $BUILD_SCRIPT

# upload all the built in the directory './data/latest'  
DATA_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/data/latest"
echo "Uploading $DATA_DIRECTORY to ~/openresty on $PUBLIC_IP"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "rm -rf /home/ec2-user/openresty"
scp -i $SSH_KEY -r $DATA_DIRECTORY ec2-user@$PUBLIC_IP:/home/ec2-user/openresty

#upload the scripts to the openresty server
SCRIPTS_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts"
echo "Uploading $SCRIPTS_DIRECTORY to ~/scripts on $PUBLIC_IP"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "rm -rf /home/ec2-user/scripts"
scp -i $SSH_KEY -r $SCRIPTS_DIRECTORY ec2-user@$PUBLIC_IP:/home/ec2-user/scripts
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "chmod +x /home/ec2-user/scripts/*"

# run the setup.sh script as root and stream 
echo "Reloading openresty...."
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "sudo openresty -t"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "sudo openresty -s reload"
echo "Reload complete."

echo "Deploy complete. To connect to the openresty server, run:"
echo "ssh -i $SSH_KEY ec2-user@$PUBLIC_IP"
