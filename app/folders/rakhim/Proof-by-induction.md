Tags: Logic

# Proof by Induction

One of the most powerful techniques is proof by induction. 

{>|} Do not confuse mathematical induction with inductive or deductive reasoning. Despite the name, mathematical induction is actually a form of deductive reasoning.

Let's say, we want to prove that some statement $$P$$ is true for all positive integers. In other words: $$P(1)$$ is true, $$P(2)$$ is true, $$P(3)$$ is true... etc. We could try and prove each one directly or by contradiction, but the infinite number of positive integers makes this task rather grueling. Proof by induction is a sort of generalization that starts with the basis:

**Basis:** Prove that $$P(1)$$ is true.

Then makes one generic step that can be applied indefinitely. **Induction step:** Prove that for all $$n\geq1$$, the following statement holds: If $$P(n)$$ is true, then $$P(n+1)$$ is also true.

We've devised another problem to solve, and it's seemingly the same. But if the basis is true, then proving this _inductive step_ will prove the theorem. To do this, we chose an arbitrary $$n\geq1$$ and assumed that $$P(n)$$ is true. This assumption is called the _inductive hypothesis_. The tricky part is this: we don't prove the hypothesis directly, but prove the $$n+1$$ version of it. This is all rather amorphous, so let's prove a real theorem.

**Theorem 5.** For all positive integers $$n$$,  the following is true:

$$
1 + 2 + \ldots + n = \frac{n(n+1)}{2}
$$

**Proof**. First, just calculate the basis when $$n = 1$$: 

$$
1 = \frac{1(1+1)}{2} = \frac{2}{2}.
$$

This is correct, so, the basis is proven. Now, assume that the theorem is true for any $$n\geq1$$: 

$$
1 + 2 + \ldots + n = \frac{n(n+1)}{2}
$$

Holding that assumption, prove the induction step. In other words, prove that the basis is also true for $$n+1$$: 

$$
1 + 2 + \ldots + (n+1) = \frac{(n+1)(n+2)}{2}
$$

All we did is substituted $$n$$ with $$n+1$$. We can expand this equation. The last member on the left side is $$n+1$$.  Before it must be $$n$$, so let's show it:

$$1 + 2 + \ldots + (n+1)$$
$$= 1 + 2 + \ldots + n + (n+1)$$

Assumption (2) tells us the value of $$1 + 2 + \ldots + n$$,  so let's take it and replace the corresponding part of the right-hand side (rectangle shows this replacement):

$$1 + 2 + \ldots + (n + 1) = \boxed{ \frac{n(n+1)}{2} } + (n+1)$$

And then make that addition so that the right hand side is a single fraction:

$$\frac{n(n+1)}{2} + \frac{2(n+1)}{2}$$
$$= \frac{n(n+1) + 2(n+1)}{2}$$
$$= \frac{(n+1)(n+2)}{2}.$$

So:

$$
1 + 2 + \ldots + (n + 1) = \frac{(n+1)(n+2)}{2}
$$

Great, the've proved that the induction step (3) is true. So far, we have two results:

1. The theorem is true for $$n=1$$. 
2. If the theorem is true for any $$n$$,  then it's also true for $$n+1$$. 

Note how neither one of the two facts is sufficient alone. The first fact is limited to a single case. The second fact is based on a condition — it basically says "give me a ladder, then I can touch the sky". Fact 1 is the ladder. Now, we can touch the sky by combining the two facts. The theorem is true for all positive integers $$n$$.  $$\blacksquare$$.

I had troubles with this technique because for a long time I couldn't for the life of me understand why is this _enough_ and how is the basis _helping_?! The basis seemed redundant. We assume $$P(n)$$ is true, then prove that $$P(n+1)$$ is true given that $$P(n)$$ is true, but so what? We didn't prove the thing we assumed!

It clicked after I understood that we don't have to prove $$P(n)$$,  we just take the concrete value from the basis and use it as $$n$$.  Since we have a proof of $$P(n+1)$$ being true **if** $$P(n)$$ is true, we conclude that if $$P(1)$$ is true, then $$P(1+1)$$ is true. Well, if $$P(1+1)$$ is true, then, using the same idea, $$P(1+1+1)$$ is true, and so forth. The basis was a _cheat-code_ to kick-start the process by avoiding the need to prove the assumption.