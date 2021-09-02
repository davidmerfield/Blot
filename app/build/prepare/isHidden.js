function isHidden(path) {
  var hidden = false;

  var dirs = path.split("/");

  for (var i in dirs)
    if (dirs[i][0] === "_" || dirs[i][0] === ".") hidden = true;

  return hidden;
}

module.exports = isHidden;
