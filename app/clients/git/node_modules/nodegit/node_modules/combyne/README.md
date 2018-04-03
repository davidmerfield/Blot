<img align="left" src="http://dl.dropboxusercontent.com/u/79007/combyne.png">

**Stable: 0.8.1**

[![Build Status](https://travis-ci.org/tbranyen/combyne.svg)](https://travis-ci.org/tbranyen/combyne)
[![Coverage Status](https://coveralls.io/repos/tbranyen/combyne/badge.svg)](https://coveralls.io/r/tbranyen/combyne?branch=master)
[![Code Climate](https://codeclimate.com/github/tbranyen/combyne.svg)](https://codeclimate.com/github/tbranyen/combyne)


No dependencies.  Can be loaded as a browser global, AMD module, and Node
module.  Works with Browserify.  Can be installed via NPM or Bower.

Combyne works great with:

- [Express](https://github.com/tbranyen/combynexpress)
- [Browserify](https://github.com/chesles/combynify)
- [AMD](https://github.com/tbranyen/combyne-amd-loader)

**For when you're stuck and need help:**

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/tbranyen/combyne?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Install. ##

Node:

``` bash
npm install combyne
```

Bower:

``` bash
bower install combyne
```

## Getting started. ##

### Node. ###

Require in your source:

``` javascript
var combyne = require("combyne");
```

### AMD. ###

``` javascript
// Configure the path if necessary.
require({
  paths: {
    combyne: "path/to/combyne"
  }
});

// Use in a module.
define(["combyne"], function(combyne) {});
```

There is also an AMD plugin for easier consumption and building:

https://github.com/tbranyen/combyne-amd-loader

### Browserify. ###

[combynify](https://github.com/chesles/combynify) is a
[browserify](https://github.com/substack/browserify) transform plugin to
pre-compile combyne templates.

In your code:

``` javascript
var template = require("./template.combyne");
var data = { ... }

template.render(data)
```

Install combynify and browserify it:

``` bash
npm install --save-dev combynify
browserify -t combynify main.js > bundle.js
```

Once the template is precompiled, there is no dependency on the combyne
engine.

### Browser global. ###

[Include the latest stable](https://github.com/tbranyen/combyne/releases)
in your markup:

``` html
<script src="path/to/dist/combyne.js"></script>
```

#### Compatibility. ####

Combyne is written in ES5 and contains polyfills to provide support back to IE
7.  These polyfills are omitted in the **dist/combyne.js** file, but exist in
the **dist/combyne.legacy.js** file.  Use this if you are developing/testing
with older IE.

[![Sauce Test Status](https://saucelabs.com/browser-matrix/combyne.svg)](https://saucelabs.com/u/combyne)

## Basic usage. ##

``` javascript
var tmpl = combyne("hello {{msg}}!");
tmpl.render({ msg: "world" });

// => hello world!
```

## Features. ##

Combyne works by parsing your template into an AST.  This provides mechanisms
for intelligent compilation and optimization.  The template is converted to
JavaScript and invoked upon calling render with data.

### Security. ###

By default all templates are encoded to avoid possible issues arising from XSS
attacks.  This is specifically applied to properties and you can avoid this by
using the raw property style: `{{{ value }}}`.  This is very similar to
Mustache.

While using this template engine in the browser, it is important to note that
you should not trust unknown values to render unencoded.  The recommendation is
to forget it exists while writing templates in the browser, unless you know
what you're doing and have a valid use case.

View this [XSS (Cross Site Scripting) Prevention Cheat Sheet](https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet) for more information.

### Comments. ###

Comments are useful for ignoring anything between the open and close.  They can
be nested.

``` javascript
var tmpl = combyne("test {%-- not parsed --%}");
tmpl.render();

// => test
```

### Custom delimiters. ###

If you are not happy with the default Mustache-like syntax, you can trivially
change the delimiters to suit your needs.  You may only change the delimiters
at a global level, because templates are compiled immediately after invoking
the `combyne` function.

``` javascript
// This sets the delimiters, and applies to all templates.
combyne.settings.delimiters = {
  START_PROP: "[[",
  END_PROP: "]]"
};

var tmpl = combyne("[[msg]]", { msg: "hello world" });

tmpl.render();
// => hello world
```

Defaults:

``` javascript
START_RAW:  "{{{"
END_RAW:    "}}}"
START_PROP: "{{"
END_PROP:   "}}"
START_EXPR: "{%"
END_EXPR:   "%}"
COMMENT:    "--"
FILTER:     "|"
```

### Template variables. ###


``` javascript
var template = "{{foo}}";
var context = { foo: "hello" };

var tmpl = combyne(template);

var output = tmpl.render(context);
/// output == "hello"
```

Variables can be literal values, functions, or even objects.

#### Passing arguments to a function. ####


``` javascript
var template = "{{toUpper 'hi'}}";
var context = { toUpper: function(val) { return val.toUpperCase(); } };

var tmpl = combyne(template);

var output = tmpl.render(context);
/// output == "HI"
```

### Using filters on variables. ###

``` javascript
var template = "{{foo|reverse}}";
var context = { foo: "hello" };

var tmpl = combyne(template);

tmpl.registerFilter("reverse", function(val) {
  return val.split("").reverse().join("");
});

var output = tmpl.render(context);
/// output == "olleh"
```

#### Passing arguments to filters. ####

You may find that the property value is not enough information for the filter
function, in which case you can send additional arguments.

``` javascript
var tmpl = combyne("{{ code|highlight 'javascript' }}");

tmpl.registerFilter("highlight", function(code, language) {
  // Magic highlight function that takes code and language.
  return highlight(code, language);
});
```

#### Chaining filters on variables. ####

``` javascript
var template = "{{foo|reverse|toUpper}}";
var context = { foo: "hello" };

var tmpl = combyne(template);

tmpl.registerFilter("reverse", function(val) {
  return val.split("").reverse().join("");
});

tmpl.registerFilter("toUpper", function(val) {
  return val.toUpperCase();
});

var output = tmpl.render(context);
/// output == "OLLEH"
```

### Conditionals. ###

Instead of being *logic-less*, `combyne` doesn't make any assumptions and
allows you to do things like `if/elsif/else` with simple conditionals,
such as `if something == somethingElse` or `if not something`.  All data
types will be coerced to Strings except for Numbers.

``` javascript
var template = "{%if not foo%}why not?{%endif%}";
var context = { foo: false };

var tmpl = combyne(template);

var output = tmpl.render(context);
/// output == "why not?"
```

or a more complicated example...

``` javascript
var template = "{%if foo == 'hello'%}Hi!{%else%}bye...{%endif%}";
var context = { foo: "hello" };

var tmpl = combyne(template);

var output = tmpl.render(context);
/// output == "Hi!"
```

elsif is also supported:

``` javascript
var template = "{%if foo == ''%}goodbye!{%elsif foo == 'hello'%}hello!{%endif%}";
var context = { foo: "hello" };

var tmpl = combyne(template);

var output = tmpl.render(context);
/// output == "hello!"
```

You can also pass conditionals through filters to do more complex logic:

``` javascript
var tmpl = combyne("{%if hello|upper|reverse == 'OLLEH'%}hello{%endif%}");

tmpl.registerFilter('upper', function(value) {
  return value.toUpperCase();
});

tmpl.registerFilter("reverse", function(value) {
  return value.split("").reverse().join("");
});

var output = tmpl.render({ hello: 'hello'});
/// output == "hello"
```

It also works with properties that need to be not encoded

``` javascript
var tmpl = combyne("{%if {{{hello}}} == '<>'%}hello{%endif%}");

var output = tmpl.render({ hello: '<>'});
/// output == "hello";
```

### Iterating arrays. ###

*Also works on array-like objects: arguments and NodeList.*

``` javascript
var template = "{%each foo%}{{.}} {%endeach%}";
var context = { foo: [1,2,3,4] };

var tmpl = combyne(template);

var output = tmpl.render(context);
/// output == "1 2 3 4 "
```

You can also pass the value into a filter before iterating over it

``` javascript
var template = "{%each foo|upper%}{{.}} {%endeach%}";
var context = { foo: ["a", "b", "c"] };

template.registerFilter("upper", function(array) {
  return array.map(function (entry) {
    return entry.toUpperCase();
  });
});

var tmpl = combyne(template);

var output = tmpl.render(context);
/// output == "A B C"
```

You can even use filters on the root object by either specifying '.'
or leaving it blank

``` javascript
var template = "{%each .|upper%}{{.}} {%endeach%}";
var context = ["a", "b", "c"];

template.registerFilter("upper", function(array) {
  return array.map(function (entry) {
    return entry.toUpperCase();
  });
});

var tmpl = combyne(template);

var output = tmpl.render(context);
/// output == "A B C"
```

#### Iterating an array of objects shorthand. ####

If you pass an array of objects to Combyne, you may iterate it via a shorthand:

``` javascript
var template = "{%each%}{{foo}} {%endeach%}";
var context = [{ foo: 1 }, { foo: 2 }, { foo: 3 }, { foo: 4 }];

var tmpl = combyne(template);

var output = tmpl.render(context);
/// output == "1 2 3 4 "
```

#### Change the iterated identifer within loops. ####

``` javascript
var template = "{%each arr as val%}{{val}}{%endeach%}";
var context = { arr: [1,2,3] };

var tmpl = combyne(template);

var output = tmpl.render(context);
/// output = "123"
```

### Iterating objects. ###

``` javascript
var template = "{%each fruits as val key%}the {{key}} is {{val}}{%endeach%}";
var context = {
  fruits: {
    apple: "green"
  }
};

var tmpl = combyne(template);

var output = tmpl.render(context);
/// output == "the apple is green"
```

### Partials. ###

``` javascript
var template = "{{foo}} {%partial bar%}";
var context = { foo: "hello" };

var tmpl = combyne(template);

tmpl.registerPartial("bar", combyne("{{name}}", {
  name: "john"
}));

var output = tmpl.render(context);
/// output == "hello john"
```

#### Pass template data to partial. ####

If you need to pass the template's data to the partial, simply use the magic
operator `.`.

``` javascript
var template = "{{foo}} {%partial bar .%}";
var context = { foo: "hello", name: "carl" };

var tmpl = combyne(template);

tmpl.registerPartial("bar", combyne("{{name}}"));

var output = tmpl.render(context);
/// output == "hello carl"
```

If you need to manipulate the data passed to any partial, you must create a
function on the parent template's data that returns an object or array that
will be used by the nested partial.

You can even pass arguments along to that function to use.

An example follows:

``` javascript
var template = "{%partial bar showName 'carl'%}";
var context = {
  showName: function(name) {
    return { displayName: name };
  }
};

var tmpl = combyne(template);

tmpl.registerPartial("bar", combyne("hello {{displayName}}"));

var output = tmpl.render(context);
/// output == "hello carl"
```

If you wish to filter the data passed to the partial you can supply a filter.

``` javascript
var people = { carl: { knownAs: 'Carl, the Duke' } };
var template = "{%partial bar people|find 'carl'%}";
var context = {
  find: function(name) {
    return people[name];
  }
};

var tmpl = combyne(template);

tmpl.registerPartial("bar", combyne("hello {{knownAs}}"));

var output = tmpl.render(context);
/// output == "hello Carl, the Duke"

```

#### Template inheritance. ####

When using a framework that handles rendering for you and you wish to inject
your template into a different template (maybe a layout) in a given region
you can express this through template inheritance expressions.

Illustrated below is a typical use case for this feature:

``` javascript
var template = "{%extend layout as content%}<h1>{{header}}</h1>{%endextend%}";
var context = { header: "Home page" };

var page = combyne(template);

// Register the layout template into the page template.
page.registerPartial("layout", combyne("<body>{%partial content%}</body>"));

var output = page.render(context);
/// output == "<body><h1>Home page</h1></body>"
```

The context object you pass at the `page.render` line will be propagated to
the partial template.  This means that you can optionally pass a nested object
structure like:

``` javascript
var context = {
  header: "My site",

  page: {
    header: "Home page"
  }
};

// Pass the page object to the page template, restricting what it has access
// to.
var layout = "<title>{{header}}</title><body>{%partial content page%}</body>";

// Register it in the partial.
page.registerPartial("layout", combyne(layout));

var output = page.render(context);
/// output == "<title>My site</title><body><h1>Home page</h1></body>"
```

## Unit tests. ##

There are many ways to run the unit tests as this library can operate in
various environments.

### Browser ###

Open test/index.html in your web browser.

### Node ###

Run the tests inside the Node runtime and within PhantomJS:

``` bash
grunt test
```

This will run the tests against the AMD source, the built modern
dist/combyne.js, and the built legacy dist/combyne.legacy.js files.

### Continuous testing ###

To keep the PhantomJS tests running continuously, run:

``` bash
grunt karma:watch
```

The tests will automatically run whenever files change.

#### Code coverage ####

If you run the tests through Karma, a test/coverage directory will be created
containing folders that correspond with the environment where the tests were
run.

If you are running the defaults you should see something that looks like:

``` unicode
.
└── coverage
    ├── Chrome 33.0.1750 (Linux)
    └── PhantomJS 1.9.7 (Linux)
```

Inside PhantomJS contains the HTML output that can be opened in a browser to
inspect the source coverage from running the tests.
