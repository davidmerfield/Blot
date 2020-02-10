const mustache = require("mustache");
mustache.escape = function(text) {
	return text;
};

const fs = require("fs-extra");

const env = Object.keys(process.env)
	.filter(key => key.indexOf("BLOT_") > -1)
	.map(key => ({ key, value: process.env[key] }));

const view = {
	env,
	directory: process.env.BLOT_DIRECTORY,
	blot_repo: "https://github.com/davidmerfield/Blot",
	user: process.env.BLOT_USER, // unix user
	host: process.env.BLOT_HOST,
	environment_file: "/etc/blot/environment",
	fallback_certificate: "/etc/ssl/auto-ssl-fallback.crt",
	fallback_certificate_key: "/etc/ssl/auto-ssl-fallback.key",
	log_file: "/var/www/blot/logs/nginx.log",
	cache_directory: process.env.BLOT_CACHE_DIRECTORY,
	node: {
		host: "127.0.0.1",
		bin: `/.nvm/versions/node/v${process.env.BLOT_NODE_VERSION}/bin/node`,
		main: "/Blot/app/index.js",
		log: "/etc/blot/app.log",
		version: process.env.BLOT_NODE_VERSION,
		port: 8080
	},
	number_of_cpus: 4,
	nginx: {
		pid: "/var/run/nginx.pid",
		bin: "/usr/local/openresty/nginx/sbin/nginx",
		config: "/usr/local/openresty/nginx/conf/nginx.conf"
	},
	redis: {
		host: "127.0.0.1",
		port: 6379,
		prefix: "ssl",
		server: "/usr/bin/redis-server",
		cli: "/usr/bin/redis-cli"
	}
};

const template = fs.readFileSync(__dirname + "/nginx/server.conf", "utf8");
let partials = {};
fs.readdirSync(__dirname + "/nginx").forEach(name => {
	partials[name] = fs.readFileSync(__dirname + "/nginx/" + name, "utf8");
});

fs.ensureDirSync(__dirname + "/out");

fs.writeFileSync(
	__dirname + "/out/nginx.conf",
	mustache.render(template, view, partials)
);

const nginx_service_template = fs.readFileSync(
	__dirname + "/systemd/nginx.service",
	"utf8"
);
fs.writeFileSync(
	__dirname + "/out/nginx.service",
	mustache.render(nginx_service_template, view)
);

const redis_service_template = fs.readFileSync(
	__dirname + "/systemd/redis.service",
	"utf8"
);
fs.writeFileSync(
	__dirname + "/out/redis.service",
	mustache.render(redis_service_template, view)
);

const blot_service_template = fs.readFileSync(
	__dirname + "/systemd/blot.service",
	"utf8"
);
fs.writeFileSync(
	__dirname + "/out/blot.service",
	mustache.render(blot_service_template, view)
);

const user_data_template = fs.readFileSync(__dirname + "/user-data.sh", "utf8");
fs.writeFileSync(
	__dirname + "/out/user-data.sh",
	mustache.render(user_data_template, view)
);
