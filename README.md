# Blot

A blogging platform with no interface. Blot turns a folder into a blog. The point of all this — the reason Blot exists — is so you can use your favorite tools to create whatever you publish.

Please don’t hesitate to contact me with any questions: [support@blot.im](mailto:support@blot.im)

## Overview

The internet <> NGINX (reverse proxy) <> Blot (express.js node application) <> Redis

## Development setup

Clone this repository:

```
git clone https://github.com/davidmerfield/blot
```

Add the required hosts blot.local (for the dashboard) and example.blot.local (for the example site) to your `/etc/hosts` file:

```
127.0.0.1 blot.local
127.0.0.1 example.blot.local
```

Set up the development environment with docker:

```
docker-compose up
```

The dashboard will be available at [https://blot.local](https://blot.local) and the example site will be available at [https://example.blot.local](https://example.blot.local). You can edit the folder for the example blog inside the `data` directory:

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
