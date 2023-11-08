#!/bin/sh

if [ -z "$SSH_KEY" ]; then
  echo "SSH_KEY variable missing, pass the path to the key as an argument to this script"
  exit 1
fi

if [ -z "$PUBLIC_IP" ]; then
  echo "PUBLIC_IP variable missing, pass the public ip address of the redis instance as an argument to this script"
  exit 1
fi

if [ -z "$CURRENT_NODE_SSH_PORT" ]; then
  echo "CURRENT_NODE_SSH_PORT variable missing, pass the port number of the existing node server as an argument to this script"
  exit 1
fi

if [ -z "$CURRENT_NODE_IP" ]; then
  echo "CURRENT_NODE_IP variable missing, pass the ip address of the existing node server as an argument to this script"
  exit 1
fi

# find the parent directory of this script file
# and set the  variable 'SCRIPTS_DIRECTORY' to that directory + './scripts'
SCRIPTS_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts"
REMOTE_SCRIPTS_DIRECTORY="/home/ec2-user/node/scripts"

# empty the directory './scripts' and './setup' on the remote server if it exists
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "mkdir -p $REMOTE_SCRIPTS_DIRECTORY"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "rm -rf $REMOTE_SCRIPTS_DIRECTORY/*"

# upload all the files in the directory './scripts' to '/var/scripts' on the remote server
# using the 'scp' command
echo "Uploading scripts to remote server..."
scp -i $SSH_KEY -r $SCRIPTS_DIRECTORY ec2-user@$PUBLIC_IP:/home/ec2-user/node

# ensure all the scripts are executable
echo "Making scripts executable on remote server..."
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "chmod +x $REMOTE_SCRIPTS_DIRECTORY/*"

echo "Copying the SSH key to the remote server..."
scp -i $SSH_KEY $SSH_KEY ec2-user@$PUBLIC_IP:$REMOTE_SCRIPTS_DIRECTORY/projects.pem 

echo "Running setup script on remote server..."
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "CURRENT_NODE_IP=$CURRENT_NODE_IP CURRENT_NODE_SSH_PORT=$CURRENT_NODE_SSH_PORT sudo $REMOTE_SCRIPTS_DIRECTORY/setup.sh"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "CURRENT_NODE_IP=$CURRENT_NODE_IP CURRENT_NODE_SSH_PORT=$CURRENT_NODE_SSH_PORT $REMOTE_SCRIPTS_DIRECTORY/setup-ec2-user.sh"

echo "Set up complete. To connect to the node server, run:"
echo "ssh -i $SSH_KEY ec2-user@$PUBLIC_IP"

echo "To sync the data directory, run:"
echo "rsync -azv -e \"ssh -p $CURRENT_NODE_SSH_PORT -i $REMOTE_SCRIPTS_DIRECTORY/projects.pem\" ec2-user@$CURRENT_NODE_IP:/var/www/blot/data/ /var/www/blot/data"