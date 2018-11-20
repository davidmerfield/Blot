# Eliminating explicit parentheses with a handy combinator

This is a literate Haskell post about a trick I picked up in Raymond Smullyan's
["To Mock a Mockingbird"](https://en.wikipedia.org/wiki/To_Mock_a_Mockingbird),
a fantastic introduction to combinator logic.

Let's start with a simple demonstration. Consider the expression for `u`:

```haskell
u = (:) 'g' (show 13)
```

`u` evaluates to:

```
ghci> u
"g13"
```

__Using only function application and the non-infix compose function__, I'd
like to write a __point-free__ function `solution` such that the `u'` defined
below evaluates to the same value as `u`.

```haskell
u' = solution (:) 'g' show 13
```

The body of `u'` differs from `u` in that `show 13` is no longer
surrounded by parentheses and a function `solution` is being applied to the cons
function.

We solve for `u'` by working backwards while thinking about the implicit
parentheses we usually leave out when working with curried functions. We
also use a synonym for `(.)` so we're not overwhelmed by parentheses.

```haskell
b = (.)
```

The `B` combinator in combinator logic is defined `B x y z = x (y z)` and
serves the same purpose as the compose operator in Haskell. The mechanical
transformation we use in this post can eliminate parentheses not implied by
left-associative function application by using the definition of `B` to carry
out the transformation `x (y z) => B x y z`. By prefixing an expression with
`B`, we're able to eliminate a pair of parentheses! We solve

```haskell
u2 = ((:) 'g') (show 13)     -- `u` with some clarifying parentheses
u3 = ((b ((:) 'g')) show) 13 -- liberating `13` from parentheses
                             -- not implied by left-assoc.
u4 = ((((b b) (:)) 'g') show) 13 -- liberating `'g'` from parentheses
                                 -- not implied by left-assoc.

u5 = b b (:) 'g' show 13 -- `u4` without the parentheses which
                         -- left-associativity make redundant
```

Therefore,

```haskell
solution = b b -- equivalently, (.) (.)
```

We can verify that this definition of `solution` makes `u` and `u'` evaluate to
identical values.

```
ghci> u'
"g13"
```

More generally, this mechanical procedure can transform an arbitrary, properly typed
expression with explicit parentheses, e.g.

```Haskell
exp = z (a b) (c (d e) f) (g h i)
```

to a form entirely devoid of explicit parentheses by applying single function `y` to
the first term `z`, i.e.

```haskell
exp' = y z a b c d e f g h i
```

where `y` consists exclusively of applications of the non-infix compose function
`(.)`. With all the parentheses implied by left-associative function application,
`exp'` looks like this:

```haskell
exp' = ((((((((((y z) a) b) c) d) e) f) g) h) i)
```

If we also allow the use of `flip` in `y`, we'll see in the section below that
we can arbitrarily permute the order of the terms that follow `y`.

__Exercises:__ To test your understanding of this mechanical elimination of
explicit parentheses, use only function application and `b` (compose) to
discover point-free expressions for `solution2` and `solution3` such that `v ==
v'` and `w == w'`.

```haskell
v = length ((:) 1 [4,2])
v' = solution2 length (:) 1 [4,2]

w = (++) "elab" ((:) 'o' "rate")
w' = solution3 (++) "elab" (:) 'o' "rate"
```

```haskell
ghci> v
3

ghci> w
"elaborate"
```

A more complicated example
---------------------------------

`C` from combinator logic, defined as `C x y z = x z y`, plays a role similar to
`flip` and will augment our mechanical procedure with the ability to carry out
the transformation `x z y => C x y z`. Prepending `C` to an expression of
three terms exchanges the positions of the last two.

Consider this expression for `q` and a few renamed combinators

```haskell
c = flip
divide = (/)
mult = (*)

q = divide 3 (mult 5 4) -- equivalent to `3 / (5 * 4)`
q' = complexSoln divide mult 3 5 4
```

We now solve for a definition of `complexSoln` using only function
application and the combinators `b` and `c` such that `q == q'`.

In the comments next to the first few lines, I'll show all the
parentheses explicitly, except the outer-most pair.

```haskell
q2 = divide 3 (mult 5 4)           -- (divide 3) ((mult 5) 4)
q3 = b (divide 3) (mult 5) 4       -- ((b (divide 3)) (mult 5)) 4
q4 = b (b (divide 3)) mult 5 4     -- (((b (b (divide 3))) mult) 5) 4
q5 = b (b b divide 3) mult 5 4
q6 = b b (b b divide) 3 mult 5 4
q7 = b (b b) (b b) divide 3 mult 5 4
q8 = c (b (b b) (b b) divide) mult 3 5 4
q9 = b c (b (b b) (b b)) divide mult 3 5 4
```

So we can eliminate all the parentheses around our arguments to `complexSoln` thus:

```haskell
complexSoln = b c (b (b b) (b b))
```

We can verify that `q` == `q'`:

```haskell
ghci> q
0.15

ghci> q'
0.15
```

If we try to eliminate all the parentheses with just these combinators, our
blog post will start to look like a page from "A New Kind of Science".

```haskell
q10 = b (b c) (b (b b)) (b b) divide mult 3 5 4
q11 = b (b (b c) (b (b b))) b b divide mult 3 5 4
q12 = b b (b (b c)) (b (b b)) b b divide mult 3 5 4
q13 = b (b b (b (b c))) b (b b) b b divide mult 3 5 4
q14 = b b (b (b b (b (b c)))) b b b b b divide mult 3 5 4
q15 = b (b b) b (b b (b (b c))) b b b b b divide mult 3 5 4
q16 = b (b (b b) b) (b b) (b (b c)) b b b b b divide mult 3 5 4
q17 = b (b (b (b b) b) (b b)) b (b c) b b b b b divide mult 3 5 4
q18 = b (b (b (b (b b) b) (b b)) b) b c b b b b b divide mult 3 5 4
```

q[1-18] all evaluate to the same thing but we'll never be free of all the
parentheses just using `b`. Using this procedure, we foist the need to use
explicit parentheses on the solution functions we prepend to the original
expressions.

Solution to exercises posed in the first section
---------------------------------------------------

```haskell
solution2 = b b b
```

```haskell
solution3 = b (b b b)
```

An alternative to `solution3` is

```haskell
solution3' = b (b b) (b b)
```

A derivation of `solution3`:

```Haskell
w = (++) "elab" ((:) 'o' "rate")
w = b ((++) "elab") ((:) 'o') "rate"
w = b (b ((++) "elab")) (:) 'o' "rate"
w = b b b ((++) "elab") (:) 'o' "rate"
w = b (b b b) (++) "elab" (:) 'o' "rate"
```

A derivation of `solution3'`:

```Haskell
w = (++) "elab" ((:) 'o' "rate")
w = b ((++) "elab") ((:) 'o') "rate"
w = b b (b b (++)) "elab" (:) 'o' "rate"
w = b (b b) (b b) (++) "elab" (:) 'o' "rate"
```
