# Arithmetic on a very small elliptic curve

This document gives a detailed illustration of discrete elliptic curve mathematics.
After reading this document, one should be able to carry out calculations on
elliptic curves by hand. The document is broken down as follows:

1. Introduction to a small curve and a discussion of "points at infinity"
2. Several fully-worked examples of adding points on elliptic curves over
   finite fields
3. A demonstration of how to use [sage](http://www.sagemath.org/) to do basic
   computations on elliptic curves

For those lacking background on elliptic curves, Andrea Corbellini's
[gentle introduction to elliptic curve cryptography](http://andrea.corbellini.name/2015/05/17/elliptic-curve-cryptography-a-gentle-introduction/)
should be read first.

## Elliptic curves

In a cryptographic setting--we'll avoid abstract mathematics for now--an
elliptic curve is any polynomial equation of the form

$$ y^2 = x^3 + Ax + B $$

Where $$ A, B \in F$$ where $$ F $$ is some field.

## Bitcoin's curve

Satoshi chose a curve called `secp256k1` for Bitcoin's elliptic curve public
key cryptography. The curve has the form

$$ y^2 = x^3 + 7 $$

where all coefficients and arithmetic operations are over the finite field $$
F_p, p = 2^{256} - 4294968273 $$.

## Same curve, different field

Any solutions $$ (x, y) $$ to the polynomial equation $$ y^2 = x^3 + 7 (mod 13)
$$ are points on the elliptic curve defined by this equation. This small
elliptic curve has order 7 and these are the 7 points on the curve:

$$ \{\inf, (7, 5), (7, 8), (8, 5), (8, 8), (11, 5), (11, 8)\} $$

-- TODO talk about how every point /= inf generates the curve, full order, just
like secp256k1.

### Point at infinity

Using affine coordinates
In [homogeneous
coordinates](https://en.wikipedia.org/wiki/Homogeneous_coordinates) for
projective space, the equation of our small elliptic curve becomes
They have the advantage that the coordinates of points, including points at
infinity, can be represented using finite coordinates. Formulas involving
homogeneous coordinates are often simpler and more symmetric than their
Cartesian counterparts.


$$ y^2z = x^3 + 7z^3 $$

Homogeneous coordinates have the advantage of being flexible. One important
feature is that we can w.Lo.g. normalize the first (or last) nonzero entry to
1.  Setting $$ z = 1 $$, we have our original equation of the curve. The only
    other option is to consider the case where $$ z = 0 $$.

$$ y^2 \cdot 0 = x^3 + 7 \cdot 0 $$

So for this expression to hold, $$ y $$ can be any value while $$ x = 0 $$. It
is considered that there is only a single "point at infinity" with coordinates
$$ (0:1:0) $$ because... but while we work in affine coordinates for the rest
of this document, we'll represent the point at infinity as $$ \inf $$.

## Point addition on an elliptic curve over a finite field

Let $$ P = (7, 5) $$ and $$ Q = (8, 8) $$.

### Root trick

We use the following observation in the two calculations below. Notice that
when a cubic polynomial is factored each of the roots appear in the three
factors. If the polynomial is expanded.

$$
\begin{aligned}
y^2 &= (x - a)(x - b)(x - c) \\
    &= (x^2 - (a + b)x + ab)(x - c) \\
    &= x^3 - (a + b)x^2 + abx + cx^2 + c(a + b)x - abc \\
    &= x^3 - (a + b + c)x^2 + (ab + ac + bc)x - abc \\
\end{aligned}
$$

So the coefficient of $$ x^2 $$ is the sum of the three roots of the elliptic
curve.

### Adding two distinct points

We solve for $$ R = P + Q = (7, 5) + (8, 8) $$.

First, we find the slope of the line joining the two points.

$$ m = \frac{8-5}{8-7} = 3 $$

Then we find the equation of the line by substituting the coordinates of $$
P $$ into the equation of a line with the slope calculated above.

$$ y = 3(x-7) + 5 = 3x - 16 \equiv 3x - 3 \equiv 3x + 10 $$

Now we substitute the equation of the line into the formula for the curve.

$$ y^2 = (3x + 10)^2 = 9x^2 + 60x + 100 = x^3 + 7 $$
$$ \implies 0 = x^3 -9x^2 - 60x - 93 $$

Using the root trick, $$ 9 = 7 + 8 + x \equiv 15 + x \equiv 2 + x \implies
x = 7 $$ (7 and 8 being the x-coordinates of $$ P $$ and $$ Q $$). Then we
substitute this value of $$ x $$ into our equation of the line.

$$ y = 3x + 10 = 31 \equiv 5 $$

Finally we reflect this value for $$ y $$ to find $$ -y = -5 \equiv 8 $$.
Therefore $$ P + Q = (7, 5) + (8, 8) = (7, 8) $$.

### Adding a point to itself

To find $$ S = P + P $$ we first calculate the tangent line to $$ P = (7, 5)
$$ using [implicit
differentiation](http://tutorial.math.lamar.edu/Classes/CalcI/ImplicitDIff.aspx)
on the equation of the curve $$ y^2 = x^3 + 7 $$.

$$
\begin{aligned}
       2yy' &= 3x^2
\implies y' &= \frac{3x^2}{2y} = \frac{3 \cdot 7^2}{2 \cdot 5} = \frac{147}{10}
            &= \frac{4}{10} = 4(10^{-1}) = 4 \cdot 4 = 16 \equiv 3
\end{aligned}
$$

Then we find the equation of the line by substituting the coordinates of $$
P $$ into the equation of a line with the slope ($$ y' = m $$) calculated above.

$$ y = 3(x-7) + 5 = 3x - 16 \equiv 3x - 3 \equiv 3x + 10 $$

(Note: the tangent line we found has the exact same slope as the line we found
above!)

Now we substitute the equation of the line into the formula for the curve.

$$ y^2 = (3x + 10)^2 = 9x^2 + 60x + 100 = x^3 + 7 $$
$$ \implies 0 = x^3 -9x^2 - 60x - 93 $$

Using the root trick, $$ 9 = 7 + 7 + x \equiv 14 + x \equiv 1 + x \implies
x = 8 $$. Then we substitute this value of $$ x $$ into our equation of the line.

$$ y = 3 \cdot 8 + 10 = 24 \equiv 8 $$

Finally we reflect this value for $$ y $$ to find $$ -y = -8 \equiv 5 $$.
Therefore $$ P + P = (7, 5) + (7, 5) = (8, 5) $$.

### Verification of results in Sage

Using [sage](http://www.sagemath.org/) REPL to verify our results above.

```python
sage: F = FiniteField(13); F
>>> Finite Field of size 13
sage: E = EllipticCurve(F, [ 0, 7]); E
>>> Elliptic Curve defined by y^2 = x^3 + 7 over Finite Field of size 13
sage: E.points()
>>> [(0 : 1 : 0), (7 : 5 : 1), (7 : 8 : 1), (8 : 5 : 1), (8 : 8 : 1), (11 : 5 : 1), (11 : 8 : 1)]
sage: P = E.point((7,5)); P
>>> (7 : 5 : 1)
sage: P.order()
>>> 7
sage: Q = E.point((8,8)); Q
>>> (8 : 8 : 1)
sage: Q.order()
>>> 7
sage: P + Q
>>> (7 : 8 : 1)
sage: P + P
>>> (8 : 5 : 1)
```
