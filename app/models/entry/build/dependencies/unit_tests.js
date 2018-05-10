var assert = require('assert');
var is_url = require('./is_url');
var resolve = require('./resolve');
var depedencies = require('./index');
var debug = require('debug')('build:dependencies:unit_tests');

// tests for is_url

function should_be_url (string) {
  assert(is_url(string) === true);
}

function should_not_be_url (string) {
  assert(is_url(string) === false);
}

should_be_url('http://example.org');
should_be_url('//example.org');
should_be_url('https://example.org');
should_be_url('https://ww.example.org.123');
should_be_url('https://example.org/apple/pie');

should_not_be_url();
should_not_be_url({a: 1, b: 2});
should_not_be_url(null);
should_not_be_url('');
should_not_be_url(false);
should_not_be_url('example.com');
should_not_be_url('example');
should_not_be_url('/bar/foo.jpg');
should_not_be_url('!!!!!');
should_not_be_url('fsdhjkfgsdhjf');




// tests for resolve

function should_resolve_to (input) {
  
  var result = resolve(input.path, input.src);

  try {
    assert(result === input.result);    
  } catch (e) {
    debug(input, result);
    throw e;
  }

  debug('Test passed');
}

// Should resolve relative path
should_resolve_to({
  src: 'foo.jpg',
  path: '/foo/bar.txt',
  result: '/foo/foo.jpg'
});

should_resolve_to({
  src: './foo.jpg',
  path: '/bar/baz/bat.txt',
  result: '/bar/baz/foo.jpg'
});

// Should not modify if invalid path
should_resolve_to({
  src: 'foo.jpg',
  path: '',
  result: 'foo.jpg'
});

// Should resolve nested paths
should_resolve_to({
  src: 'foo/bar.mp4',
  path: 'apps/this/that.txt',
  result: '/apps/this/foo/bar.mp4'
});

// Should not modify absolute paths
should_resolve_to({
  src: '/foo/bar.mp4',
  path: 'a/b/c/d/e/f',
  result: '/foo/bar.mp4'
});

// Should not modify empty strings
should_resolve_to({
  src: '',
  path: '',
  result: ''
});

// tests for depedencies

function should_get_dependencies (input) {

  var result = depedencies(input.path, input.html);

  try {
    assert.deepEqual(result, input.result);    
  } catch (e) {
    debug(input);
    debug(result);
    throw e;
  }
}

should_get_dependencies({
  html: '<img src="./goo.jpg">',
  path: '/foo/bar.txt',
  result: {
    html: '<img src="/foo/goo.jpg">',
    dependencies: ['/foo/goo.jpg']
  }
});

should_get_dependencies({
  html: '<img src="goo.jpg">',
  path: '/foo/bar.txt',
  result: {
    html: '<img src="/foo/goo.jpg">',
    dependencies: ['/foo/goo.jpg']
  }
});

// Should extract absolute paths
should_get_dependencies({
  html: '<img src="/foo/goo.jpg">',
  path: '/foo/bar.txt',
  result: {
    html: '<img src="/foo/goo.jpg">',
    dependencies: ['/foo/goo.jpg']
  }
});

// Should return unique list
should_get_dependencies({
  html: '<img src="/foo/goo.jpg"><img src="/foo/goo.jpg">',
  path: '/foo/bar.txt',
  result: {
    html: '<img src="/foo/goo.jpg"><img src="/foo/goo.jpg">',
    dependencies: ['/foo/goo.jpg']
  }
});

// Lots of items
should_get_dependencies({
  html: '<script type="text/javascript" src="javascript.js"></script><img src="../image.jpg"><link rel="stylesheet" type="text/css" href="/theme.css">',
  path: '/sub/folder/post.txt',
  result: {
    html: '<script type="text/javascript" src="/sub/folder/javascript.js"></script><img src="/sub/image.jpg"><link rel="stylesheet" type="text/css" href="/theme.css">',
    dependencies: ['/sub/folder/javascript.js', '/sub/image.jpg', '/theme.css']
  }
});


// SHould not mess with links
should_get_dependencies({
  html: '<a href="page.html"></a>',
  path: '/post.txt',
  result: {
    html: '<a href="page.html"></a>',
    dependencies: []
  }
});

// SHould not extract them from URLs
should_get_dependencies({
  html: '<img src="//google.com/goo.jpg">',
  path: '/bar.txt',
  result: {
    html: '<img src="//google.com/goo.jpg">',
    dependencies: []
  }
});

// SHould not consider itself a dependency
should_get_dependencies({
  html: '<img src="/image.jpg">',
  path: '/image.jpg',
  result: {
    html: '<img src="/image.jpg">',
    dependencies: []
  }
});