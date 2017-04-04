# Glossary

Theme - a collection of templates which instruct Blot how to serve your blog
Template - a
Partial - a partial template, embedded in multiple templates.



Creating a custom theme will give you absolute control over the content and appearance of your site. In order to create a theme you will need an understanding of HTML, CSS and Mustache. Blot will be familiar to those who have created themes for other blogging platforms.

# Making your own theme

First create a folder called 'Themes' inside your blog folder. This folder will contain all your blog's custom themes.

Lets start with an empty folder. By the way, an empty directory is a valid Blot theme: Blot will act as a static file server, serving the contents of your blog folder unmodified.

However, we want to do more than just a static file server. So lets add a file inside called ```index.html```. The name is not important. Inside we'll put this Mustache template.

```
---
routes:
  - /
  - /page/{{number}}
partials:
  title: Archives - {{blog.title}}
  description: The archives of {{blog.title}}
---

<html>
  <body>
    <p>{{blog.title}}</p>
  </body>
</html>
```

Next we'll create a file called ```entry.html```. Inside we'll put this template:

```
---
route: /{{permalink}}
---

<html>
  <body>
    {{{entry.html}}}
  </body>
</html>
```


```
---
route: /search/{{query}}
---

<h>!

```


```
---
route: /tagged/{{tag}}
---

<h>!

```
Now lets create another file called
