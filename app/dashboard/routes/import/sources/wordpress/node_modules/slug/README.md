# [slug](https://github.com/dodo/node-slug)

slugifies every string, even when it contains unicode!

Make strings url-safe.

- respecting [RFC 3986](https://tools.ietf.org/html/rfc3986)
- Comprehensive tests
- No dependencies (except the unicode table)
- Not in coffee-script (except the tests lol)
- Coerces foreign symbols to their english equivalent
- Works in browser (window.slug) and AMD/CommonJS-flavoured module loaders (except the unicode symbols unless you use browserify but who wants to download a ~2mb js file, right?)

```
npm install slug
```

```
bower install slug
```

## example

```javascript
var slug = require('slug')
var print = console.log.bind(console, '>')

print(slug('i ♥ unicode'))
// > i-love-unicode

print(slug('unicode ♥ is ☢')) // yes!
// > unicode-love-is-radioactive

print(slug('i ♥ unicode', '_')) // If you prefer something else then `-` as seperator
// > i_love_unicode

slug.charmap['♥'] = 'freaking love' // change default charmap or use option {charmap:{…}} as 2. argument
print(slug('I ♥ UNICODE', {lowercase: false})) // If you prefer not lower case
// > I-freaking-love-UNICODE

print(slug('i <3 unicode'))
// > i-love-unicode
```

## options

```javascript
// options is either object or replacement (sets options.replacement)
slug('string', [{options} || 'replacement']);
```

```javascript
slug.defaults.mode ='pretty';
slug.defaults.modes['rfc3986'] = {
    replacement: '-',      // replace spaces with replacement
    symbols: true,         // replace unicode symbols or not
    remove: null,          // (optional) regex to remove characters
    lower: true,           // result in lower case
    charmap: slug.charmap, // replace special characters
    multicharmap: slug.multicharmap // replace multi-characters
};
slug.defaults.modes['pretty'] = {
    replacement: '-',
    symbols. true,
    remove: /[.]/g,
    lower: false,
    charmap: slug.charmap,
    multicharmap: slug.multicharmap
};
```

## browser

When using browserify you might want to remove the symbols table from your bundle by using `--ignore` similar to this:
```bash
# generates a standalone slug browser bundle:
browserify slug.js --ignore unicode/category/So -s slug > slug-browser.js
```

[![Build Status](https://secure.travis-ci.org/dodo/node-slug.png)](http://travis-ci.org/dodo/node-slug)

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/dodo/node-slug/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

