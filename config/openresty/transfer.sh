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

# upload all the built in the directory './data'  
echo "Uploading openresty directory to remote server..."
DATA_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/data"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "rm -rf ~/openresty"
scp -i $SSH_KEY -r $DATA_DIRECTORY ec2-user@$PUBLIC_IP:~/openresty

# empty the directory './scripts' on the remote server
echo "Uploading scripts directory to remote server..."
SCRIPTS_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "rm -rf ~/scripts"
scp -i $SSH_KEY -r $SCRIPTS_DIRECTORY ec2-user@$PUBLIC_IP:~/scripts
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "chmod +x ~/scripts/*"

# run the setup.sh script as root and stream 
echo "Running setup script on remote server..."
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "sudo REDIS_IP=$REDIS_IP ~/scripts/setup.sh"

echo "Transfer complete. To connect to the openresty server, run:"
echo "ssh -i $SSH_KEY ec2-user@$PUBLIC_IP"
