#!/bin/sh

if [ -z "$SSH_KEY" ]; then
  echo "SSH_KEY variable missing, pass the path to the key as an argument to this script"
  exit 1
fi

if [ -z "$PUBLIC_IP" ]; then
  echo "PUBLIC_IP variable missing, pass the public ip address of the redis instance as an argument to this script"
  exit 1
fi

# find the parent directory of this script file
# and set the  variable 'SCRIPTS_DIRECTORY' to that directory + './scripts'
SCRIPTS_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts"

# empty the directory './scripts' and './setup' on the remote server if it exists
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "mkdir -p ~/scripts"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "rm -rf ~/scripts/*"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "mkdir -p ~/setup"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "rm -rf ~/setup/*"

# upload all the files in the directory './scripts' to '/var/scripts' on the remote server
# using the 'scp' command
echo "Uploading scripts to remote server..."
scp -i $SSH_KEY -r $SCRIPTS_DIRECTORY ec2-user@$PUBLIC_IP:~/

# ensure all the scripts are executable
echo "Making scripts executable on remote server..."
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "chmod +x ~/scripts/*"

echo "Running setup script on remote server..."
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "sudo ~/scripts/setup.sh"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "~/scripts/setup-ec2-user.sh"

echo "Set up complete. To connect to the node server, run:"
echo "ssh -i $SSH_KEY ec2-user@$PUBLIC_IP"