# Folders

Test material for static site generators. 

## Add a new folder

To create a new sub-folder e.g. 'marmalade', first ensure the server is running elsewhere (npm start) then run in a seperate window:

npm run folder marmalade

## Publish new folders

To release new versions of the folders for download on master branch, just commit and push to master branch.

Then deploy the latest version of the code:

./scripts/deploy.sh

## Using new folders for templates

Set the "demo_folder" property in the locals of a given template in ./config.js to the name of this folder to make it available on the website, e.g.

"demo_folder": "marmalade",
