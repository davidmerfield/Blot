#!/bin/sh

USER=$(whoami)

## If the user is root, we want to log as nobody
## because nginx creates logfiles as nobody
## since I have not configured it to run as a different user
if [ "$USER" == "root" ] 
then
   LOG_USER=nobody
else
   LOG_USER=$USER
fi

echo "Log_user is $LOG_USER"
echo "User is $USER"