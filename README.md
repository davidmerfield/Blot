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

Blot requires a number of different hosts to work (one for the dashboard, one for the CDN and many for your sites). In order to get this working in a local development environment, I recommend using [dnsmasq](https://wiki.archlinux.org/index.php/dnsmasq) to resolve everthing under the non-existent `.blot` TLD to the local machine:

```
brew install dnsmasq
```

Create config directory for dnsmasq

```
mkdir -pv $(brew --prefix)/etc/
```

Setup \*.blot in dnsmasq:

```
echo 'address=/.blot/127.0.0.1' >> $(brew --prefix)/etc/dnsmasq.conf
```

Autostart dnsmasq - now and after reboot:

```
sudo brew services start dnsmasq
```

Create resolver directory for macOS:

```
sudo mkdir -v /etc/resolver
```

Add your nameserver to resolvers:

```
sudo bash -c 'echo "nameserver 127.0.0.1" > /etc/resolver/blot'
```

Finally, you are ready to start the development environment with docker:

```
docker-compose up --build
```

The dashboard will be available at [https://blot](https://blot) and the example site will be available at [https://example.blot](https://example.blot). You can edit the folder for the example blog inside the `data` directory:

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
