var CLF_MONTH = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

function pad2(num) {
  var str = String(num);

  return (str.length === 1 ? "0" : "") + str;
}

function rpad3(num) {
  var str = String(num);

  if (str.length === 2) return str + "0";

  if (str.length === 1) return str + "00";

  return str;
}

module.exports = function clfdate(dateTime) {
  var date = dateTime.getUTCDate();
  var hour = dateTime.getUTCHours();
  var mins = dateTime.getUTCMinutes();
  var secs = dateTime.getUTCSeconds();
  var year = dateTime.getUTCFullYear();
  var msecs = dateTime.getUTCMilliseconds();

  var month = CLF_MONTH[dateTime.getUTCMonth()];

  return (
    pad2(date) +
    "/" +
    month +
    "/" +
    year +
    ":" +
    pad2(hour) +
    ":" +
    pad2(mins) +
    ":" +
    pad2(secs) +
    "." +
    rpad3(msecs) +
    " +0000"
  );
};
