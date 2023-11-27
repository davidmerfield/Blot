I am more than happy to run this script for you. 
If you send me the XML file and I'll send you 
back the result:

https://blot.im/contact



Guide to running the Wordpress import script
--------------------------------------------

First install the dependencies needed by Blot:

$ cd <root-of-this-repository>
$ npm install

Set the environment variable required to direct node to load modules:

$ export NODE_PATH=$(pwd)/app

Then install the dependencies needed by Blot's importer scripts:

$ cd app/dashboard/importer
$ npm install 

The Wordpress import script runs on an XML file which Wordpress generates when you export your site. Here is the guide to retrieving this XML file from Wordpress:

https://en.support.wordpress.com/export/

Once you have your XML file, you can run the importer script:

$ cd sources/wordpress
$ node index.js <path-to-source-xml-file> <path-to-output-directory>

If you run into any bugs, please tell me about them and I will fix them:

https://blot.im/contact
