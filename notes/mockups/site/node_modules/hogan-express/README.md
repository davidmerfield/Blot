## HOGAN-EXPRESS

[Mustache][1] template engine for the [express 3.x][2] web framework.

Uses twitter's [hogan.js][3] engine.

Supports
  - Partials (Allows you to modularize, to move pieces of templates to their own file - think of these as "included" templates)
  - Layouts (Allows you to consolidate common elements of your templates - think of these as "parent" templates)
  - Caching (Makes your app more efficient by reducing unnecessary rendering)
  - Lambdas (Allows you to create custom filters/lambdas)

### Install

Install hogan-express using [npm][4]:

`npm install hogan-express`

### Usage

#### Setup
To use hogan-express, map the file extension of your choice to the
hogan-express engine in your app setup.  For example:

```coffeescript
app.set 'view engine', 'html'    # use .html extension for templates
app.set 'layout', 'layout'       # use layout.html as the default layout
app.set 'partials', foo: 'foo'   # define partials available to all pages
app.enable 'view cache'
app.engine 'html', require('hogan-express')
```

#### Rendering a template

Within your app route callback, define `res.locals` and call `res.render`, passing any partials required by your template.  For example:

```coffeescript
app.get '/', (req,res)->
  res.locals = name: 'Andrew'
  res.render 'template', partials: {message: 'message'}
```

This would render the layout (`layout.html`, defined in setup) using the template (`template.html`) and the specified partials (`message.html`).

If `layout.html` contained:

```html
<p>
  <strong>Message Layout</strong>
  {{{ yield }}}
</p>
```

and `template.html` contained:

```html
<em>{{ name }} says {{> message }}</em>
```

and `message.html` contained:

```html
Hello World.
```

the callback would produce:

```html
<p>
  <strong>Message Layout</strong>
  <em>Andrew says Hello World.</em>
</p>
```

The special `{{{ yield }}}` variable in `layout.html` indicates the location in your layout file where your template is rendered.  You can define your layout using `app.set 'layout', ...` or specify it when calling `res.render`.  If a layout is not provided, the template is rendered directly.

#### Custom yield tags

You can define more extension points in `layout.html` using custom tags ``{{yield-<name>}}``.  For example:

layout:

```html
<head>
  ...
  {{{yield-styles}}}
  {{{yield-scripts}}}
  ...
</head>
```

index:

```html
{{#yield-styles}}
  <style>
    ...
  </style>
{{/yield-styles}}

{{#yield-scripts}}
  <script>
    ...
  </script>
{{/yield-scripts}}
```

The page `index.html` will be rendered into ``{{yield}}`` without the content in ``{{#yield-styles}}...{{/yield-styles}`` and ``{{#yield-scripts}}...{{/yield-scripts}}``. That content goes into accordingly named tags in `layout.html`.  If ``{{{yield-styles}}}`` is missing, the styles tag content will not be rendered.

#### Custom layouts

To render a page with custom layout, just specify it in the options: `res.render "admin.html", layout: "admin-layout"`

#### Custom Lambdas / Filters

To create custom filters (or lambdas) you can just specify your filter functions in the options:

```coffeescript
app.get '/', (req,res)->

  res.locals = myDefaultLabel: "oops" # here to show a little of how scoping works

  res.render 'template',
    message: 'This is a message. HERE.'
    mylist: [{label: "one", num: 1},{label: "two", num: 2},{num: 3}]

    lambdas:
     lowercase: (text) ->
       return text.toLowerCase()
     reverseString: (text) ->
       return text.split("").reverse().join("")
```

template:

```html
<p>Lowercase <strong>{{message}}</strong>: {{#lambdas.lowercase}}{{message}}{{/lambdas.lowercase}}</p>
<ul>
  {{#mylist}}
  <li>{{num}}: {{label}} is {{#reverseString}}{{label}}{{#reverseString}} in reverse.</li>
  {{/mylist}}
</ul>
```

rendered html:

```html
<p>Lowercase <strong>This is a message. HERE.</strong>: this is a message. here.</p>
<ul>
  <li>1: one is eno in reverse.</li>
  <li>2: two is owt in reverse.</li>
  <li>3: oops is spoo in reverse.</li>
</ul>
```

### Contributors

[Contributors list](https://github.com/vol4ok/hogan-express/graphs/contributors)

Thank you for your participation!

### License
hogan-express is released under an [MIT License][5].

[1]: http://mustache.github.io/mustache.5.html
[2]: http://expressjs.com/
[3]: https://github.com/twitter/hogan.js
[4]: https://npmjs.org/
[5]: http://opensource.org/licenses/MIT
