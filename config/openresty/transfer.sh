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

if [ -z "$NODE_PRIVATE_IP" ]; then
  echo "NODE_PRIVATE_IP variable missing, pass the private ip address of the node instance as an argument to this script"
  exit 1
fi

if [ -z "$REDIS_PRIVATE_IP" ]; then
  echo "REDIS_PRIVATE_IP variable missing, pass the private ip address of the redis instance as an argument to this script"
  exit 1
fi

if [ -z "$OPENRESTY_SSL_KEY" ]; then
  echo "OPENRESTY_SSL_KEY variable missing, pass the path to letsencrypt-domain.key as an argument to this script"
  exit 1
fi

if [ -z "$OPENRESTY_SSL_PEM" ]; then
  echo "OPENRESTY_SSL_PEM variable missing, pass the path to letsencrypt-domain.pem an argument to this script"
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

# fetch the letsencrypt certificates from the other server
echo "Uploading SSL keys to node server..."
scp -i $SSH_KEY $OPENRESTY_SSL_PEM ec2-user@$PUBLIC_IP:~/letsencrypt-domain.pem
scp -i $SSH_KEY $OPENRESTY_SSL_KEY ec2-user@$PUBLIC_IP:~/letsencrypt-domain.key

# run the setup.sh script as root and stream 
echo "Running setup script on remote server..."
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "sudo PRIVATE_IP=$PRIVATE_IP ~/scripts/setup.sh"

echo "Transfer complete. To connect to the openresty server, run:"
echo "ssh -i $SSH_KEY ec2-user@$PUBLIC_IP"
