const mustache = require("mustache");
mustache.escape = function(text) {
	return text;
};

const fs = require("fs-extra");

const view = {
	blot_repo: "https://github.com/davidmerfield/Blot",
	user: "blot", // unix user
	hosts: [{ host: "blot.im" }, { host: "blot.development" }],
	fallback_certificate: "/etc/blot/auto-ssl-fallback.crt",
	fallback_certificate_key: "/etc/blot/auto-ssl-fallback.key",
	log_file: "/var/www/blot/logs/nginx.log",
	cache_directory: "/cache",
	node: { host: "127.0.0.1", port: 8080 },
	number_of_cpus: 4,
	nginx: {
		pid: "/var/run/nginx.pid",
		bin: "/usr/local/openresty/nginx/sbin/nginx"
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

const user_data_template = fs.readFileSync(
	__dirname + "/user-data.sh",
	"utf8"
);
fs.writeFileSync(
	__dirname + "/out/user-data.sh",
	mustache.render(user_data_template, view)
);