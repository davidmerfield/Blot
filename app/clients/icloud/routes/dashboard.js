const clfdate = require("helper/clfdate");
const database = require("../database");
const disconnect = require("../disconnect");
const express = require("express");
const fetch = require("node-fetch"); // For making HTTP requests
const dashboard = new express.Router();
const parseBody = require("body-parser").urlencoded({ extended: false });
const config = require("config"); // For accessing configuration values

const VIEWS = require("path").resolve(__dirname + "/../views") + "/";

const MACSERVER_URL = config.icloud.server_address; // The Macserver base URL from config
const MACSERVER_AUTH = config.icloud.secret; // The Macserver Authorization secret from config

dashboard.use(async function (req, res, next) {
  res.locals.account = await database.get(req.blog.id);
  next();
});

dashboard.get("/", function (req, res) {
  res.render(VIEWS + "index");
});

dashboard
  .route("/disconnect")
  .get(function (req, res) {
    res.render(VIEWS + "disconnect");
  })
  .post(function (req, res, next) {
    disconnect(req.blog.id, next);
  });

dashboard
  .route("/set-up-folder")
  .post(parseBody, async function (req, res, next) {
    try {
      if (req.body.cancel) {
        return disconnect(req.blog.id, next);
      }

      const blogID = req.blog.id;
      const sharingLink = req.body.sharingLink;

      // Store the sharingLink in the database if provided
      if (sharingLink) {
        await database.store(blogID, { sharingLink });
      }

      // Make the request to the Macserver /setup endpoint
      console.log(`Sending setup request to Macserver for blogID: ${blogID}`);
      const response = await fetch(`${MACSERVER_URL}/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": MACSERVER_AUTH, // Use the Macserver Authorization header
          "blogID": blogID,
          "sharingLink": sharingLink || "", // Include the sharingLink header, even if empty
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Macserver /setup request failed: ${response.status} - ${errorText}`);
        return next(new Error(`Failed to set up folder: ${errorText}`));
      }

      console.log(`Macserver /setup request succeeded for blogID: ${blogID}`);
      
      // Redirect back to the dashboard
      res.redirect(req.baseUrl);
    } catch (error) {
      console.error("Error in /set-up-folder:", error);
      next(error); // Pass the error to the error handler
    }
  });

dashboard.post("/cancel", async function (req, res) {
  await database.blog.delete(req.blog.id);

  res.message(req.baseUrl, "Cancelled the creation of your new folder");
});

module.exports = dashboard;