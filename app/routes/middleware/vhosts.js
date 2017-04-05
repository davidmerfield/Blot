var Blog = require('blog'),
    config = require('config'),
    Template = require('template'),
    helper = require('helper'),
    logger = helper.log({file: 'redirects'});

var siteHost = config.host;

module.exports = function (req, res, next){

  var reqHost = req.get('host'),
      reqBlog;

  // Not sure why this happens
  if (!reqHost) {
    var error = new Error('This blog does not exist');
        error.code = 'NOBLOG';
    return next(error);
  }

  // Cache the original host for use in templates
  // this should be req.locals.originalHost
  req.originalHost = reqHost;

  // REQUEST TO BLOT.IM LEAVE NOW ------------>
  // This is important for security -> otherwise
  // untrusted blog content might run on blot.im
  if (reqHost === siteHost) return next();

  if (isSubdomain(reqHost, siteHost)) {

    var handle = extractHandle(reqHost, siteHost);

    if (handle === 'www') return res.redirect('http://' + siteHost);

    // REQUEST TO USER.BLOT.IM ------------>
    reqBlog = {handle: handle};

  } else {

    // REQUEST FROM CUSTOM DOMAIN ------------>
    reqBlog = {domain: reqHost};
  }

  Blog.get(reqBlog, function onGet (err, blog){

    if (err || !blog || !blog.handle || blog.isDisabled || blog.isUnpaid) {

      // If the visit is to www.CUSTOM.com
      // then strip www. and try again

      // Check the original host to prevent an
      // infinite loop.
      if (reqHost.slice(0, 4) === 'www.' &&
          reqHost.length > 4 &&
          req.originalHost.indexOf('www.') === 0) {
        reqHost = reqHost.slice(4);
        return Blog.get({domain: reqHost}, onGet);
      }

      // If the visit is to CUSTOM.com
      // then add www. and try again

      // Check the original host to prevent an
      // infinite loop.
      if (reqHost.slice(0, 4) !== 'www.' &&
          reqHost.length > 4 &&
          req.originalHost.indexOf('www.') !== 0) {
        reqHost = 'www.' + reqHost;
        return Blog.get({domain: reqHost}, onGet);
      }

      if (reqHost.slice(0, 5) === 'blog.' && reqHost.length > 5) {
        reqHost = reqHost.slice(5);
        return Blog.get({domain: reqHost}, onGet);
      }

      var error = new Error('This blog does not exist');
          error.code = 'NOBLOG';

      return next(error);
    }

    // Retrieve the name of the template from the host
    // If the request came from a preview domain
    // e.g preview.original.david.blot.im
    if (isSubdomain(reqHost, siteHost) && reqHost !== blog.handle + '.' + siteHost) {

      var template = extractPreviewTemplate(reqHost, siteHost);
      var owner = template.isBlots ? Template.siteOwner : blog.id;

      if (owner && template && template.name) {
        req.previewSubdomain = true;
        blog.template = Template.makeID(owner, template.name);

        // don't use the deployed asset for preview subdomains
        blog.cssURL = Blog.url.css(blog.cacheID);
        blog.scriptURL = Blog.url.js(blog.cacheID);
      }
    }

    // Redirect www. and blog. remaps to the proper domain
    if (blog.domain && blog.domain !== req.originalHost && !isSubdomain(reqHost, siteHost)) {
      logger.set({prefix: blog.domain});
      logger(req.originalHost + ' to ' + req.protocol + '://' + blog.domain + req.url);
      return res.status(301).redirect(req.protocol + '://' + blog.domain + req.url);
    }

    // This is an old handle, redirect it...
    if (isSubdomain(reqHost, siteHost) && req.originalHost !== blog.handle + '.' + config.host && !req.previewSubdomain) {
      return res.status(301).redirect(req.protocol + '://' + blog.handle + '.' + config.host + req.url);
    }


    // Load in pretty and shit...
    // this must follow preview
    // since cssURL and scriptURL
    // for subdomains.
    blog = Blog.extend(blog);

    blog.locals = blog.locals || {};

    // Store the original request's url so templates {{blogURL}}
    blog.locals.blogURL = req.protocol + '://' + req.originalHost;
    blog.locals.siteURL = 'https://' + config.host;

    // Store the blog's info so routes can access it
    req.blog = blog;

    return next();
  });
};


function isSubdomain (reqHost, siteHost) {
  return reqHost.slice(-siteHost.length) === siteHost && reqHost.slice(0, -siteHost.length).length > 1;
}

function extractHandle (reqHost, siteHost) {
  if (!isSubdomain(reqHost, siteHost)) return '';
  return reqHost.slice(0, -siteHost.length - 1).split('.').pop();
}

function extractPreviewTemplate (reqHost, siteHost) {
  if (!isSubdomain(reqHost, siteHost)) return false;
  var subdomains = reqHost.slice(0, -siteHost.length - 1).split('.');
  var handle = subdomains.pop();
  var prefix = subdomains.shift();
  if (!subdomains || !subdomains.length || prefix !== 'preview') return false;
  return {name: subdomains.pop(),isBlots: !(subdomains.pop())};
}

(function unitTests () {

  var siteHost = 'blot.im';
  var assert = require('assert');

  assert(isSubdomain('david.blot.im', siteHost));
  assert(isSubdomain('a.b.c.d.e.f.g.blot.im', siteHost));

  assert.equal(isSubdomain('blot.im', siteHost), false);
  assert.equal(isSubdomain('d.BLOG.im', siteHost), false);
  assert.equal(isSubdomain('google.com', siteHost), false);
  assert.equal(isSubdomain('...blot.im..', siteHost), false);
  assert.equal(isSubdomain('.blot.im', siteHost), false);
  assert.equal(isSubdomain('', siteHost), false);

  assert.equal(extractHandle('david.blot.im', siteHost), 'david');
  assert.equal(extractHandle('preview.my.theme.david.blot.im', siteHost), 'david');
  assert.equal(extractHandle('david.merfield.blot.im', siteHost), 'merfield');
  assert.equal(extractHandle('david.merfield.google.com', siteHost), '');

  assert.equal(extractPreviewTemplate('foo.david.blot.im', siteHost), false);
  assert.equal(extractPreviewTemplate('david.blot.im', siteHost), false);
  assert.equal(extractPreviewTemplate('blot.im', siteHost), false);
  assert.equal(extractPreviewTemplate('', siteHost), false);
  assert.equal(extractPreviewTemplate('google.com', siteHost), false);
  assert.equal(extractPreviewTemplate('preview.blot.im', siteHost), false);
  assert.equal(extractPreviewTemplate('preview.david.blot.im', siteHost), false);
  assert.equal(extractPreviewTemplate('preview.this.david.blot.com', siteHost), false);
  assert.equal(extractPreviewTemplate('this.preview.my.foo.david.blot.im', siteHost), false);

  assert.deepEqual(extractPreviewTemplate('preview.foo.david.blot.im', siteHost), {name: 'foo', isBlots: true});
  assert.deepEqual(extractPreviewTemplate('preview.my.foo.david.blot.im', siteHost), {name: 'foo', isBlots: false});

  // console.log('Host handler tests passed!');
}());
