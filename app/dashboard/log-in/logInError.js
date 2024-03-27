function LogInError(code, message) {
  this.name = "LogInError";
  this.message = message || "";
  this.code = code || "";
}

LogInError.prototype = new Error();

module.exports = LogInError;
