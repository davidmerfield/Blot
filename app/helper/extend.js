var type = require('./type');
var ensure = require('./ensure');
var _ = require('lodash');

function extend (a) {

  if (a === undefined) a = {};

  return {and: function next (b) {

    softMerge(a,b);

    return extend(a);
  }}
}

// if property on a is set, use it,
// if not, use B's value
function softMerge (a, b) {

  ensure(a, 'object')
    .and(b, 'object');

  for (var i in b) {

    if (type(a[i]) === 'object' && type(b[i]) === 'object') {
      softMerge(a[i], b[i])
    }

    if (a[i] === undefined) {
      a[i] = b[i]
    }
  }
}

(function unitTests () {

  var assert = require('assert');

  var a1 = {
    name: 'Foo',
    this: 'Bar',
    count: {
      shit: 'piss',
      fuck: 'that',
      hey: {there: {delilah: {woooooo: 1}}}
    }
  }, b1 = {
    name: 'Shit',
    that: 'This',
    count: {
      shit: 'FHDJGDHJFGHJD',
      fuck: 'FDHJFGDHJGFJHDF',
      then: 'who',
      man: {who: 'fuck'},
      hey: {there: {delilah: {SNOOOOO: 'abc'}}}

    }
  }, r1 = {
    name: 'Foo',
    this: 'Bar',
    that: 'This',
    count: {
      shit: 'piss',
      fuck: 'that',
      then: 'who',
      man: {who: 'fuck'},
      hey: {there: {delilah: {woooooo: 1, SNOOOOO: 'abc'}}}
    }
  };

  softMerge(a1, b1);

  for (var i in a1)
    assert.deepEqual(a1[i], r1[i]);

  var a2 = {
    name: 'Default',
    isPublic: true,
    description: 'The default template. Designed to work well with text, image and video posts. Set in Georgia & Helvetica.',
    thumb: 'https://d1u95qvrdsh2gl.cloudfront.net/avatars/1425441405690_u054WwMUSeU8f9PmbymEhtDQ.png'
  };

  var b2 = {
    isPublic: true,
    views:
     { archives: { url: '/archives', locals: [Object] },
       sitemap: { url: '/sitemap.xml' },
       feed: { url: '/feed.rss', type: 'application/xml' },
       robots: { url: '/robots.txt' }
     }
  };

  var r2 = {
    name: 'Default',
    description: 'The default template. Designed to work well with text, image and video posts. Set in Georgia & Helvetica.',
    thumb: 'https://d1u95qvrdsh2gl.cloudfront.net/avatars/1425441405690_u054WwMUSeU8f9PmbymEhtDQ.png',
    isPublic: true,
    views:
     { archives: { url: '/archives', locals: [Object] },
       sitemap: { url: '/sitemap.xml' },
       feed: { url: '/feed.rss', type: 'application/xml' },
       robots: { url: '/robots.txt' }
     }
  };

  extend(a2)
    .and(b2);

  for (var x in a2)
    assert.deepEqual(a2[x], r2[x]);

}());

module.exports = extend;