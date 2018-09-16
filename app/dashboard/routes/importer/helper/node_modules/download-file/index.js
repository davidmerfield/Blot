var fs = require('fs')
var url = require('url')
var http = require('http')
var https = require('https')
var mkdirp = require('mkdirp')

module.exports = function download(file, options, callback) {
  if (!file) throw("Need a file url to download")

  if (!callback && typeof options === 'function') {
    callback = options
  }

  options = typeof options === 'object' ? options : {}
  options.timeout = options.timeout || 20000
  options.directory = options.directory ? options.directory : '.'

  var uri = file.split('/')
  options.filename = options.filename || uri[uri.length - 1]

  var path = options.directory + "/" + options.filename

  if (url.parse(file).protocol === null) {
    file = 'http://' + file
    req = http
  } else if (url.parse(file).protocol === 'https:') {
    req = https
  } else {
    req = http
  }

  var request = req.get(file, function(response) {

    if (response.statusCode === 200) {

      mkdirp(options.directory, function(err) { 
        if (err) throw err
        var file = fs.createWriteStream(path)
        response.pipe(file)
      })

    } else {

      if (callback) callback(response.statusCode)

    }

    response.on("end", function(){
      if (callback) callback(false, path)
    })

    request.setTimeout(options.timeout, function () {
      request.abort()
      callback("Timeout")
    })

  }).on('error', function(e) {

    if (callback) callback(e)

  })

}
