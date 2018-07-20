1. make sure you make all the contents of scripts/production executable:

chmod +x scripts/production/start_blot.sh


Seems to be that setting up application environment is best done with a script in /etc/profile.d

I did these:

sudo nano /etc/profile.d/blot.sh

I put this inside:

export BLOT_CACHE=true

Then I made the script executable:

sudo chmod +x /etc/profile.d/blot.sh

I verified that the variable was set by logging out and in, then running this:

echo "$BLOT_CACHE"

