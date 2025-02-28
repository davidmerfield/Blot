const config = require("config");
const express = require("express");
const EventSource = require("eventsource");
const fetch = require("node-fetch");
const clfdate = require("helper/clfdate");
const querystring = require("querystring");
const bodyParser = require("body-parser");

const maxFileSize = config.webhooks.client_max_body_size;

// In-memory map to store connected clients
const subscribers = new Map();

const server = express();

server.get("/connect", function (req, res) {
  if (req.header("Authorization") !== config.webhooks.secret) {
    return res.status(403).send("Unauthorized");
  }

  req.socket.setTimeout(2147483647);
  res.writeHead(200, {
    "X-Accel-Buffering": "no",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  res.write("\n");

  // Add the client to the in-memory map
  const clientId = Date.now() + Math.random();
  subscribers.set(clientId, res);

  console.log(clfdate(), `Client connected: ${clientId}. Total subscribers: ${subscribers.size}`);

  req.on("close", function () {
    subscribers.delete(clientId);
    console.log(clfdate(), `Client disconnected: ${clientId}. Total subscribers: ${subscribers.size}`);
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
    limit: maxFileSize,
    type: "application/*",
  }),
  (req, res) => {
    res.send("OK");

    const headers = req.headers;

    delete headers.host;
    delete headers["x-real-ip"];
    delete headers["x-forwarded-for"];
    delete headers["x-forwarded-proto"];

    const body = req.body ? req.body.toString("base64") : null;

    const message = {
      url: req.url,
      headers,
      method: req.method,
      bodySize: body ? body.length : 0, // Include the size of the body
    };

    const metadata = JSON.stringify(message);

    console.log(clfdate(), "Webhooks publishing metadata", metadata);

    // Broadcast metadata first
    for (const [clientId, subscriber] of subscribers.entries()) {
      try {
        subscriber.write("\n");
        subscriber.write("data: " + metadata + "\n\n");
        console.log(clfdate(), "Delivered metadata to client", clientId);
      } catch (err) {
        console.error(clfdate(), `Error delivering metadata to client ${clientId}:`, err);
        subscribers.delete(clientId);
      }
    }

    // If there's a body, send it in chunks
    if (body) {
      const chunkSize = 64 * 1024; // 64 KB
      const totalChunks = Math.ceil(body.length / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const chunk = body.substring(i * chunkSize, (i + 1) * chunkSize);
        const chunkMessage = JSON.stringify({
          chunk,
          chunkIndex: i,
          totalChunks,
        });

        for (const [clientId, subscriber] of subscribers.entries()) {
          try {
            subscriber.write("\n");
            subscriber.write("data: " + chunkMessage + "\n\n");
            console.log(clfdate(), `Delivered chunk ${i + 1}/${totalChunks} to client`, clientId);
          } catch (err) {
            console.error(clfdate(), `Error delivering chunk to client ${clientId}:`, err);
            subscribers.delete(clientId);
          }
        }
      }
    }
  }
);

function listen({ host }) {
  const url = "https://" + host + "/connect";

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
    const parsed = JSON.parse(data);

    if (parsed.chunk !== undefined) {
      // Handle chunked data on the client
      if (!this.bodyChunks) this.bodyChunks = [];
      this.bodyChunks[parsed.chunkIndex] = parsed.chunk;

      if (this.bodyChunks.length === parsed.totalChunks) {
        const completeBody = this.bodyChunks.join("");
        delete this.bodyChunks;

        console.log(clfdate(), "Webhooks received complete body");

        forwardToLocal(JSON.parse(completeBody), parsed.headers);
      }
    } else {
      // Handle metadata
      this.metadata = parsed;
      console.log(clfdate(), "Webhooks received metadata", this.metadata);
    }
  };

  async function forwardToLocal(metadata, headers) {
    const path = require("url").parse(metadata.url).path;

    try {
      const options = {
        headers,
        method: metadata.method,
      };

      options.headers["x-forwarded-proto"] = "https";
      options.headers["x-forwarded-host"] = config.host;
      options.headers.host = config.host;

      if (metadata.method !== "HEAD" && metadata.method !== "GET" && metadata.body) {
        options.body = Buffer.from(metadata.body, "base64");
      }

      const localURL = "http://" + config.host + ":" + config.port + path;

      console.log(clfdate(), "Webhooks forwarding to", localURL);

      await fetch(localURL, options);
    } catch (e) {
      console.log(clfdate(), "Webhooks error forwarding request", e);
    }
  }
}

if (config.environment === "development" && config.webhooks.relay_host) {
  listen({ host: config.webhooks.relay_host });
}

module.exports = server;