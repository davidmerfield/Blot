3.3.3 / 2016-10-11
---------------------
- added missing minified version

3.3.2 / 2016-10-11
---------------------
- added `equalsIgnoreCase` [#185](https://github.com/jprichardson/string.js/issues/185)

3.3.1 / 2015-08-06
---------------------
- fix [#160](https://github.com/jprichardson/string.js/issues/160)

3.3.0 / 2015-06-15
---------------------
- added `splitRight` and `splitLeft` method [#153](https://github.com/jprichardson/string.js/pull/153)

3.2.1 / 2015-06-13
---------------------
- add missing minified version
- update phpjs link in README [#154](https://github.com/jprichardson/string.js/pull/154)

3.2.0 / 2015-06-02
---------------------
- added `titleCase()` method [#149](https://github.com/jprichardson/string.js/pull/149)
- fix `underscore()` [#148](https://github.com/jprichardson/string.js/pull/148)

3.1.3 / 2015-05-29
--------------------
- fix [#142](https://github.com/jprichardson/string.js/issues/142)

3.1.2 / 2015-05-29
-------------------

- fix `extendPrototype()` method


3.1.1 / 2015-03-26
------------------
- hack to work around the improper behavior (modifying of string prototype) of [shelljs](https://github.com/arturadib/shelljs)
see: [127](https://github.com/jprichardson/string.js/issues/127), [128](https://github.com/jprichardson/string.js/pull/128)

3.1.0 / 2015-03-21
------------------
- added `stripLeft([chars])` and `stripRight([chars])` [#133](https://github.com/jprichardson/string.js/pull/133)


3.0.1 / 2015-03-16
------------------
* bugfix `underscore()` for single letter "words" [#131](https://github.com/jprichardson/string.js/pull/131)

```js
S('oneAtATime').underscore().s //'one_at_a_time' instead of 'one_at_atime'
```

3.0.0 / 2014-12-08
------------------
**BREAKING** Now `underscore()` behaves as one would expect.

```js
S('CarSpeed').underscore().s //'_car_speed'
```

now

```js
S('CarSpeed').underscore().s //'car_speed'
```

See [#122](https://github.com/jprichardson/string.js/pull/122) [#98](https://github.com/jprichardson/string.js/issues/98)


2.2.0 / 2014-10-20
------------------
- `endsWith()`, `startsWith()` accept multiple arguments: [Azharul Islam / #118](https://github.com/jprichardson/string.js/pull/118)
- `template()`: allow for spaces for readability: [Azharul Islam / #119](https://github.com/jprichardson/string.js/pull/119)
- `template()`: if key does not exist, replace with empty string [Azharul Islam / #117](https://github.com/jprichardson/string.js/pull/117)

2.1.0 / 2014-09-22
------------------
- added `strip()` [#115](https://github.com/jprichardson/string.js/pull/115)

2.0.1 / 2014-09-08
------------------
- forgot to bump version in actual `string.js` and `string.js.min`

2.0.0 / 2014-09-02
------------------
- bugfix `isAlpha()` for empty strings [#107](https://github.com/jprichardson/string.js/pull/107)
- added .npmignore. Closes #71
- `slugify()` behavior changed, added method `latinise()`. [#112](https://github.com/jprichardson/string.js/pull/112)

1.9.1  / 2014-08-05
-------------------
* bugfix `parseCSV()` [Sergio-Muriel / #97](https://github.com/jprichardson/string.js/pull/97)
* bugfix `wrapHTML()` [Sergio-Muriel / #100](https://github.com/jprichardson/string.js/pull/100)
* optimize `isAlpha()` and `isAlphaNumeric()` [Sergio-Muriel / #101](https://github.com/jprichardson/string.js/pull/101)

1.9.0 / 2014-06-23
------------------
* added `wrapHTML()` method, (#90)

1.8.1 / 2014-04-23
------------------
* bugfix: `toBoolean()`/`toBool()` treat `1` as `true`. (arowla / #78)

1.8.0 / 2014-01-13
------------------
* Changed behavior of 'between()'. Closes #62

1.7.0 / 2013-11-19
------------------
* `padLeft`, `padRight`, and `pad` support numbers as input now (nfriedly / #70)

1.6.1 / 2013-11-07
------------------
* fixes to `template()` (jprincipe / #69)
* added stringjs-rails to docs. Closes #48
* added Bower support. Closes #61

1.6.0 / 2013-09-16
------------------
* modified string.js to make it more extensible (jeffgran / [#57][57])
* fix browser tests, closes #45, #56

1.5.1 / 2013-08-20
------------------
* Fixes bug in `template()` for falsey values. Closes #29
* added Makefile

1.5.0 / 2013-07-11
------------------
* added correct `lines()` implementation. (daxxog/#47) Closes #52

1.4.0 / 2013-
------------------
* updated homepage in `package.json`
* The configurable option "Escape character" is documented as "escape" but was implemented as "escapeChar" (Reggino #44)
* removed `lines()`, better to not have it, then to do it incorrectly (#40)
* added `humanize()` method, (#34)
* added `count()` method, (#41)

1.3.1 / 2013-04-03
------------------
* fixed CSV / undefined (Reggino / #37)
* fixed CSV parsing bug with escape. See #32, #35, #37 (Reggino / #37)
* added multi-line CSV parse (Reggino / #37)

1.3.0 / 2013-03-18
------------------
* Added methods `between()`, `chompLeft()`, `chompRight()`, `ensureLeft()`, `ensureRight()`. (mgutz / #31)
* Removed support for Node v0.6. Added support for v0.10
* Modified `parseCSV` to allow for escape input. (seanodell #32)
* Allow `toCSV()` to have `null`.
* Fix `decodeHTMLEntities()` bug. #30

1.2.1 / 2013-02-09
------------------
* Fixed truncate bug. #27
* Added `template()`.

1.2.0 / 2013-01-15
------------------
* Added AMD support.
* Fixed replaceAll bug. #21
* Changed `slugify` behavior. #17
* Renamed `decodeHtmlEntities` to `decodeHTMLEntities` for consistency. `decodeHtmlEntities` is deprecated. #23


1.1.0 / 2012-10-08
------------------
* Added `toBoolean()` and `toBool()` method.
* Added `stripPunctuation()` method.
* Renamed `clobberPrototype()` to `extendPrototype()`.
* Added `padLeft()`, `padRight()`, and `pad()`.


1.0.0 / 2012-09-25
------------------
* Translated from CoffeeScript to JavaScript.
* Added native JavaScript string functions such as `substr()`, `substring()`, `match()`, `indexOf()`, etc.
* Added `length` property.
* Renamed `ltrim()` to `trimLeft()` and `rtrim()` to `trimRight()`.
* Added `valueOf()` method.
* Added `toInt()`\`toInteger()` and `toFloat()` methods.
* Modified behavior of `isEmpty()` to return true on `undefined` or `null`.
* Constructor will now cast the parameter to a string via its `toString()` method.
* Added `VERSION` value. Useful for browser dependency checking.
* Added `lines()` method.
* Added `slugify()` method.
* Added `escapeHTML()` and `unescapeHTML()` methods.
* Added `truncate()` method.
* Added `stripTags()` method.
* Added `toCSV()` and `parseCSV()` methods.

0.2.2 / 2012-09-20
------------------
* Fixed bug in `left()` closes #6
* Upgraded to CoffeeScript 1.3.*. Last CoffeeScript release of `string.js`.

0.2.1 / 2012-03-09
------------------
* Updated README to include Quirks/Credits.
* Added method `decodeHtmlEntities()`.

0.2.0 / 2012-03-02
------------------
* Fixed method type `cloberPrototype()` to `clobberPrototype()`.
* Fixed Node.js testing bug that caused `T` and `F` to be undefined functions.
* Moved browser tests to its own directory.
* Updated README.
* Added `captialize()`.
* Added `repeat()`/`times()`.
* Added `isUpper()`/`isLower()`.
* Added `dasherize()`, `camelize()`, and `underscore()`.

0.1.2 / 2012-02-27
------------------
* Package.json updates.

0.1.1 / 2012-02-27
------------------
* Package.json updates.

0.1.0 / 2012-02-27
------------------
* Added a few more methods.
* Removed default behavior of modifying `String.prototype`
* Updated README to be a bit more detailed.
* Ditched Makefiles for Cakefiles.

0.0.4 / 2012-01-27
----------------------
* Added trim() method for IE browsers
* Moved string.coffee to lib/string.coffee
* Now included a minified `string.js` named `string.min.js`
* Updated README that now includes Browser usage instructions.

0.0.3 / 2012-01-20
------------------
* Cleaned package.json file
* Removed development dependency on CoffeeScript and Jasmine
* Changed testing from Jasmine to Mocha
* Added `includes` and `contains` methods

[57]: https://github.com/jprichardson/string.js/pull/57
