Blot
----

A blogging platform with no interface. Blot turns a folder into a blog. The point of all this — the reason Blot exists — is so you can use your favorite tools to create whatever you publish.

I recommend waiting until I write a guide before attempting to run Blot on your own server. Eventually I will refactor the code such that Blot can be installed quickly and simply. I will write the neccessary documentation and sell Blot at a reasonable price to self-hosters, with an option to pay more for support. 

Please don’t hesitate to contact me with any questions: support@blot.im





The code
--------

Here is an illustration of Blot's current structure:


                    +-----------------------+      +-----------------------+
                    |                       |      |                       |
+----------+        |         NGINX         |      |                       |
|    The   <--------+                       +------>    Node.js Server     |
| Internet +--------> - SSL termination     <------+        (Blot)         |
+----------+        | - Serves static files |      |                       |
                    |                       |      |                       |
                    +--------------------^--+      +--^--------------------+
                                         ||          ||
                                         ||          ||
                                 +--------v----------v----------+
                                 |                              |
                                 |            Redis             |
                                 |                              |
                                 | - Stores SSL certificates    |
                                 | - Stores all data that       |
                                 |   can't be on disk for Blot. |
                                 |                              |
                                 +------------------------------+


The Node.js server (Blot) itself is responsible for a small crew of child processes which handle things like image minification and document conversion.

You can find the code for these parts in these folders:
  
/app 
    contains all the code for the node.js application which is Blot

/config
    contains all the configation which enables the node.js application to run on Blot's server. Things like m
  
/scripts
    contains a variety of scripts which help me in my role as server administrator

/tests
    contains the integration tests for blot. Unit tests are located next to the source code for the feature.
 
Eventually, I would like to remove NGINX and handle SSL termination and static file delivery from the Node.js server. I'd also like to remove as much data as possible from Redis and store it on disk.
