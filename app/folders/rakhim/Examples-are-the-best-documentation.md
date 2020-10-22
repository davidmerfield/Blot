Tags: Programming

# Examples are the best documentation

When I'm searching for docs, 95% of the time a single example would suffice. Yet, 95% of the time I can't find one in any official source.

It seems that by default formal technical documentation is targeted towards someone who's deeply immersed in the ecosystem. But many developers have to juggle a lot of "worlds" in their heads daily. When jumping between projects, languages and frameworks, it takes a considerable amount of mental energy to restore the context and understand what is going on. Consider this [example](https://docs.python.org/3/library/functions.html#max) from the Python 3 docs:

> `max(iterable, *[, key, default])`
> Return the largest item in an iterable or the largest of two or more arguments... _[followed by 5 short paragraphs]_.

You need to know quite a bit about Python in order to understand this:

-   What `*` means in the function definition.
-   What's iterable.
-   What are keyword-only arguments.
-   What `key` usually means.

Then you have to read some text in order to understand what values you can pass and how to actually call the function.

Granted, these are important details that can't be omitted for brevity. But I bet a lot of developers looked at that article simply because they needed to quickly find out how to pass a custom sorting function. This example would've quickly helped them:

```python
max(4, 6) # → 6

max([1, 2, 3]) # → 3

max(['x', 'y', 'abc'],  key=len) # → 'abc'

max([]) # ValueError: max() arg is an empty sequence
max([], default=5) # → 5
```

Easy, right?

One popular community-based project in the Clojure world is [clojuredocs.org](https://clojuredocs.org/), a site where people contribute examples for built in functions. It's fantastic and, in my experience, indispensable in day-to-day coding. For example, check out the pages about [into](https://clojuredocs.org/clojure.core/into) or [spit](https://clojuredocs.org/clojure.core/spit) or [map](https://clojuredocs.org/clojure.core/map). Note that examples often include related functions, not only those in question. This increases the real-world usefulness and practicality.

Since even major software projects rarely offer [4 distinct kinds of documentation](https://www.divio.com/blog/documentation/), I am often hesitant to click on a "Documentation" link. Chances are, it's a terse, difficult to read, automatically generated API reference. I often choose to find a tutorial, not because I need a walk-through, but because there are examples in it.
