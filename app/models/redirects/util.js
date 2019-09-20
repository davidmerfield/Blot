function isRegex(string) {
  return (
    string &&
    (string.slice(0, 1) === "\\" ||
      string.indexOf("(.*)") !== -1 ||
      string.indexOf("$1") !== -1)
  );
}

function is(input, from) {
  try {
    from = new RegExp(from, "i");
  } catch (e) {
    return false;
  }
  return from.test(input);
}

function notRegex(string) {
  return !isRegex(string);
}

function map(input, from, to) {
  try {
    from = new RegExp(from, "i");
  } catch (e) {
    return null;
  }
  return input.replace(from, to);
}

function matches(to, mappings) {
  for (var i = 0; i < mappings.length; i++) {
    var from = mappings[i].from;

    if (from === to) {
      return true;
    }

    if (isRegex(from) && is(to, from)) {
      return true;
    }
  }

  return false;
}

module.exports = {
  isRegex: isRegex,
  notRegex: notRegex,
  map: map,
  is: is,
  matches: matches
};
