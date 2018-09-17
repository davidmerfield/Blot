function expire (str) {

  var expires = null;
  var now = Date.now();

  if (!str) return expires;

  if (str.indexOf('max-age=') === -1) return expires;

  try {
    str = str.slice(str.indexOf('max-age='));
    str = parseInt(str) * 1000;
    expires = now + str;
  } catch (e) {
    expires = null;
  }

  return expires;
}

function date (str) {

  var date = null;

  try {
    date = (new Date(str)).valueOf();
  } catch (e) {
    date = null;
  }

  if (isNaN(date))
    date = null;

  return date;
}


module.exports = {
  date: date,
  expire: expire
};