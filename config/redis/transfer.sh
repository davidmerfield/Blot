#!/bin/sh

if [ -z "$SSH_KEY" ]; then
  echo "SSH_KEY variable missing, pass the path to the key as an argument to this script"
  exit 1
fi

if [ -z "$PUBLIC_IP" ]; then
  echo "PUBLIC_IP variable missing, pass the public ip address of the redis instance as an argument to this script"
  exit 1
fi

if [ -z "$AWS_KEY" ]; then
  echo "AWS_KEY variable missing, pass the aws key as an argument to this script"
  exit 1
fi

if [ -z "$AWS_SECRET" ]; then
  echo "AWS_SECRET variable missing, pass the aws secret as an argument to this script"
  exit 1
fi

# find the parent directory of this script file
# and set the  variable 'SCRIPTS_DIRECTORY' to that directory + './scripts'
SCRIPTS_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts"

# empty the directory './scripts' on the remote server
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "rm -rf ~/scripts"

# upload all the files in the directory './scripts' to '/var/scripts' on the remote server
# using the 'scp' command
scp -i $SSH_KEY -r $SCRIPTS_DIRECTORY ec2-user@$PUBLIC_IP:~/scripts

# ensure all the scripts are executable
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "chmod +x ~/scripts/*"

# run the setup.sh script as root and stream 
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "sudo ~/scripts/setup.sh"

# run sudo aws configure with the environment variables 'AWS_KEY' and 'AWS_SECRET'
# and the default region Oregon
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "sudo aws configure set aws_access_key_id $AWS_KEY"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "sudo aws configure set aws_secret_access_key $AWS_SECRET"
ssh -i $SSH_KEY ec2-user@$PUBLIC_IP "sudo aws configure set default.region us-west-2"

echo "Transfer complete. To connect to the redis server, run:"
echo "ssh -i $SSH_KEY ec2-user@$PUBLIC_IP"