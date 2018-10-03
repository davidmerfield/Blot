I compiled this module using babel so it works with my version of node.js (4.4.2)

$ npm install -g npx

$ npm install --save-dev babel-cli babel-preset-env

Then run the commands:

$ npx babel-cli node_modules/dropbox-stream --out-dir node_modules/dropbox-stream-compiled --copy-files

I removed the node_modules, and installed got:

$ npm install got -save

---------

# Dropbox Stream

[![NPM Version](https://img.shields.io/npm/v/dropbox-stream.svg?style=flat-square)](https://www.npmjs.com/package/dropbox-stream)
[![NPM Downloads](https://img.shields.io/npm/dt/dropbox-stream.svg?style=flat-square)](https://www.npmjs.com/package/dropbox-stream)

Upload & Download streams for [Dropbox](https://dropbox.com)

## Install

`npm i dropbox-stream`

## Usage

### Upload

Uploads stream to dropbox using upload session API

Events order:

  1. `progress`
  2. `metadata`


```js
const db = require('dropbox-stream');

const TOKEN = 'put your dropbox token here';
const FILETOUPLOAD = '/some/file.txt';

const up = db.createDropboxUploadStream({
    token: TOKEN,
    filepath: '/test/' + path.basename(FILETOUPLOAD),
    chunkSize: 1000 * 1024,
    autorename: true
  })
  .on('error', err => console.log(err))
  .on('progress', res => console.log(res))
  .on('metadata', metadata => console.log('Metadata', metadata))

fs.createReadStream(FILETOUPLOAD).pipe(up)
  .on('finish', () => console.log('This fires before metadata!'))

```

### Download

Downloads to stream from dropbox.

Events order:

  1. `metadata`
  2. `progress`


```js
const db = require('dropbox-stream');

const TOKEN = 'put your dropbox token here';
const FILETODOWNLOAD = '/some/file.txt';
const FILETODOWNLOADTO = './file.txt';

db.createDropboxDownloadStream({
    token: TOKEN,
    filepath: FILETODOWNLOAD
  })
  .on('error', err => console.log(err))
  .on('metadata', metadata => console.log('Metadata', metadata))
  .on('progress', res => console.log(res))
  .pipe(fs.createWriteStream(FILETODOWNLOADTO))
  .on('finish', () => console.log('Done!'));

```

License MIT

