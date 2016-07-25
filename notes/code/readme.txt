# Blot is a blogging platform

It's not a static site generator though it behaves a lot like one.

Blot is composed of two types of plugins

The first series of plugins is for syncing a blog folder with blot.

The second is for transforming files in that blog folder into blog posts.

Blot exposes a simple api:
  set(path)
  drop(path)

Blot sync clients do the same:
  set(path)
  drop(path)

Blot file transformers need to implement:
  build(path)