// Hopefully this makes working with the UIDs easier
var PREFIX = "user_";

// Subset of the ascii characters without descenders
// below the baseline. I like the way they look!
var CHARSET = "1234567890ABCDEFGHJKMNPRSTUVWXYZ".split("");

// The number of characters in the UID
// including the prefix. I picked 16 because
// its a computer-y number. 32^11 (16 - PREFIX.length) should be plenty right?
var LENGTH = 16;

module.exports = function generateId() {
  var uid = "";

  while (uid.length + PREFIX.length < LENGTH)
    uid += CHARSET[Math.floor(Math.random() * CHARSET.length)];

  return PREFIX + uid;
};
