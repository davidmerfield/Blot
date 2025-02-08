# Blot

A blogging platform with no interface. Blot turns a folder into a blog. The point of all this — the reason Blot exists — is so you can use your favorite tools to create whatever you publish.

Please don’t hesitate to contact me with any questions: [support@blot.im](mailto:support@blot.im)

## Overview

The internet <> NGINX (reverse proxy) <> Blot (express.js node application) <> Redis

## Development setup


You will need Docker. 

Once you have Docker installed and running, clone the repository:

```
git clone https://github.com/davidmerfield/blot
```

Then start the server:

```
npm start
```

Before you begin working on the code, you'll need to open up the following URLs in your browser and add an exception for the self-signed SSL certificates which we've generated:

```
https://localhost/
https://cdn.localhost/
https://example.localhost/
```

After you've trusted the self-signed certificates, the dashboard will be available at [https://localhost](https://localhost) and the example site will be available at [https://example.localhost](https://example.localhost). You can edit the folder for the example blog inside the `data` directory:

```
./data/blogs/blog_$ID
```

## Inside this folder

```
/
├── app/
│	the code for the node.js application which is Blot
├── config/
│	configation for the system utilities which keep redis, NGINX and the node.js processes up
├── scripts/
│	scripts which help the server administrator
├── tests/
│	integration tests and test configuration for blot
├── todo.txt
│	Blot's to-do list
```
