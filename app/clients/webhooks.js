const config = require("config");
const redis = require("models/redis");
const client = require("models/client");
const express = require("express");
const CHANNEL = "webhook-forwarder";
const EventSource = require("eventsource");
const clfdate = require("helper/clfdate");
const querystring = require("querystring");
const bodyParser = require("body-parser");

// This app is run on Blot's server in production
// and relays webhooks to any connected local clients
// Should this be authenticated in some way?
const server = express();

server.get("/connect", function (req, res) {
  const client = new redis();

  if (req.header("Authorization") !== config.webhooks.secret) {
    return res.status(403).send("Unauthorized");
  }

  req.socket.setTimeout(2147483647);
  res.writeHead(200, {
    "X-Accel-Buffering": "no",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  res.write("\n");

  client.subscribe(CHANNEL);

  client.on("message", function (_channel, message) {
    if (_channel !== CHANNEL) return;
    res.write("\n");
    res.write("data: " + message + "\n\n");
    console.log(clfdate(), "Webhooks delivering message to client", message);
    res.flushHeaders();
  });

  client.on("error", function (err) {
    console.error(err);
    res.socket.destroy();
  });

  req.on("close", function () {
    client.unsubscribe();
    client.quit();
  });
});

server.get("/clients/dropbox/authenticate", (req, res) => {
  const url =
    config.protocol +
    config.webhooks.development_host +
    "/clients/dropbox/authenticate?" +
    querystring.stringify(req.query);
  res.redirect(url);
});

server.get("/clients/google-drive/authenticate", (req, res) => {
  const url =
    config.protocol +
    config.webhooks.development_host +
    "/clients/google-drive/authenticate?" +
    querystring.stringify(req.query);
  res.redirect(url);
});

// This is sent by Dropbox to verify a webhook when first added
server.get("/clients/dropbox/webhook", (req, res, next) => {
  if (!req.query || !req.query.challenge) return next();
  res.send(req.query.challenge);
});

server.use(
  bodyParser.raw({
    inflate: true,
    limit: "100kb",
    type: "application/*"
  }),
  (req, res) => {
    res.send("OK");

    const headers = req.headers;

    // These headers trigger a redirect loop?
    // host: 'webhooks.blot.development',
    // 'x-real-ip': '127.0.0.1',
    // 'x-forwarded-for': '127.0.0.1',
    // 'x-forwarded-proto': 'https',
    delete headers.host;
    delete headers["x-real-ip"];
    delete headers["x-forwarded-for"];
    delete headers["x-forwarded-proto"];

    const message = {
      url: req.url,
      headers,
      method: req.method,
      body: req.body ? req.body.toString() : ""
    };

    const messageString = JSON.stringify(message);

    console.log(clfdate(), "Webhooks publishing webhook", messageString);
    client.publish(CHANNEL, messageString);
  }
);

function listen ({ host }) {
  const url = "https://" + host + "/connect";
  
  // when testing this, replace REMOTE_HOST with 'webhooks.blot.development'
  // and pass this as second argument to new EventSource();
  const options = { headers: { Authorization: config.webhooks.secret } };

  if (
    config.environment === "development" &&
    host === config.webhooks.server_host
  ) {
    options.https = { rejectUnauthorized: false };
  }

  const stream = new EventSource(url, options);

  console.log(clfdate(), "Webhooks subscribing to", url);

  stream.onopen = function () {
    console.log(clfdate(), "Webhooks subscribed to", url);
  };

  stream.onerror = function (err) {
    console.log(clfdate(), "Webhooks error with remote server:", err);
  };

  stream.onmessage = async function ({ data }) {
    const { method, body, url, headers } = JSON.parse(data);

    console.log(clfdate(), "Webhooks requesting", url);

    try {
      const https = require("https");

      const agent = new https.Agent({
        rejectUnauthorized: false
      });

      const options = {
        headers: headers,
        method,
        agent
      };

      if (method !== "HEAD" && method !== "GET") options.body = body;

      await fetch("https://" + config.host + url, options);
      // const body = await response.text();
    } catch (e) {
      console.log(e);
    }
  };
}

if (config.environment === "development" && config.webhooks.relay_host) {
  listen({ host: config.webhooks.relay_host });
}

module.exports = server;
