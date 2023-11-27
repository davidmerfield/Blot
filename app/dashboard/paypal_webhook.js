const express = require("express");
const paypal = new express.Router();
const fetch = require("node-fetch");
const crypto = require("crypto");
const parser = require("body-parser");

const { webhook_id } = require("config").paypal;

// Webhook verification middleware
const verifyWebhook = async (req, res, next) => {
  const transmission_id = req.headers["paypal-transmission-id"];
  const transmission_time = req.headers["paypal-transmission-time"];
  const transmission_signature = req.headers["paypal-transmission-sig"];
  const httpPayPalCertUrl = req.headers["paypal-cert-url"];
  const rawRequestBody = req.rawBody;

  const inputString = `${transmission_id}|${transmission_time}|${webhook_id}|${crc32(
    rawRequestBody
  )}`;

  try {
    const certificate = await fetchCertificate(httpPayPalCertUrl);

    // Verify the signature using the certificate and algorithm
    req.webhook_verified = crypto.verify(
      "sha256WithRSAEncryption",
      Buffer.from(inputString),
      {
        key: certificate,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(transmission_signature, "base64")
    );

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Failed to verify webhook signature:", error);
    res.status(500).send("Internal Server Error");
  }
};

paypal.post(
  "/",
  parser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    }
  }),
  verifyWebhook,
  (req, res) => {
    if (req.webhook_verified) {
      console.log("WEBHOOK VERIFIED");
    } else {
      console.log("WEBHOOK NOT VERIFIED");
    }

    console.log("WEBHOOK PAYLOAD", req.body);

    res.status(200).send("OK");
  }
);

// Helper function to calculate the CRC32 checksum
const crc32 = data => {
  return crypto.createHash("crc32").update(data).digest("hex");
};

const certificateCache = new Map(); // Cache for storing PayPal certificates

// Fetch the PayPal certificate from cache or make a request to retrieve it
const fetchCertificate = async certUrl => {
  let cached_certificate = certificateCache.get(certUrl);

  if (cached_certificate) {
    return cached_certificate;
  }

  const response = await fetch(certUrl);

  if (response.ok) {
    const certificateData = await response.text();
    // Decode the base64-encoded certificate
    const certificate = Buffer.from(certificateData, "base64");

    // Store the certificate in cache
    certificateCache.set(certUrl, certificate);

    return certificate;
  } else {
    throw new Error(
      `Failed to fetch PayPal certificate. HTTP status: ${response.status}`
    );
  }
};

// Retrieve the public key from the certificate URL
module.exports = paypal;
