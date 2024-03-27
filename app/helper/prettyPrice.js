const prettyNumber = require("helper/prettyNumber");
const ensure = require("helper/ensure");

module.exports = function prettyPrice(cents) {
  ensure(cents, "number");

  var price = (cents / 100).toFixed(2);

  if (price.slice(-2) === "00") price = price.slice(0, -3);

  price = prettyNumber(price);

  return "$" + price;
};
