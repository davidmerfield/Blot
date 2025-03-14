const siteConfig = {
  cpus: 1,
  memory: "1.3g",
  maxOldSpaceSize: 700
};

const blogsConfig = {
  cpus: 0.33,
  memory: "0.7g",
  maxOldSpaceSize: 600
}

module.exports = {
  REGISTRY_URL: "ghcr.io/davidmerfield/blot",
  PLATFORM_OS: "linux",

  // This is the port each container listens on internally
  // Externally they listen on the port specified in the container
  // configuration and our reverse proxy load balances between them.
  INTERNAL_PORT: 8080,

  // This is the directory which contains all the blog data, static
  // files, etc. It is mounted into each running container so they
  // can all access the same data.
  DATA_DIRECTORY_ON_SERVER: "/var/www/blot/data",
  DATA_DIRECTORY_ON_CONTAINER: "/usr/src/app/data",

  ENV_FILE_ON_SERVER: "/etc/blot/secrets.env",

  CONTAINERS: {
    BLUE: {
      name: "blot-container-blue",
      port: 8088,
      ...siteConfig,
    },
    GREEN: {
      name: "blot-container-green",
      port: 8089,
      ...siteConfig,
    },
    YELLOW: {
      name: "blot-container-yellow",
      port: 8090,
      ...siteConfig,
    },
    PURPLE: {
      name: "blot-container-purple",
      port: 8091,
      ...blogsConfig,
    },
    RED: {
      name: "blot-container-red",
      port: 8092,
      ...blogsConfig,
    },
    ORANGE: {
      name: "blot-container-orange",
      port: 8093,
      ...blogsConfig,
    },
  },
};
