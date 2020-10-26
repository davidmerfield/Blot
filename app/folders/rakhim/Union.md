Tags: Math

# Union

Sets on their own are somewhat boring, frozen things. Interesting results can be observed when we consider interactions between sets. At the same time, these interactions can be viewed as frozen things themselves, not actions or processes. This happens often in math: the same idea can be viewed as either an action or a thing. Even functions, seemingly actionable, moving notions, can (and will) be defined as mere static constructs. It's interesting to ponder about these things, draw analogies to physics and time. Regardless, let's quickly discuss three main sorts of interactions. Chances are they are already very familiar to you, especially if you've done any SQL.

**Union** of sets is the set of all elements of given sets. For sets $$A$$ and $$B$$, union is defined as:

$$
A \cup B = \{ x | x \in A \textrm{ or } x \in B \}
$$

This reads as: Union of $$A$$ and $$B$$ is a set of elements $$x$$,  where $$x$$ belongs to $$A$$ or x belongs to $$B$$. 

For example, if $$A = \{1, 2, 3\}$$,  and $$B = \{3, 4, 5\}$$,  then:

$$
A \cup B = \{1, 2, 3, 4, 5\}
$$

Note that even though each set contains 3 elements, the resulting union contains 5 elements only. Since union is a set, all rules and properties regarding sets apply, so it cannot contain element $$3$$ twice. But sometimes it is necessary to keep duplicates somehow, without violating the rules of sets. One way is to "tag" each element in both sets by generating a Cartesian product of each set.

$$A \times \{t_{A} \} = \{(1, t_{A}), (2, t_{A}), (3, t_{A}) \}$$
$$B \times \{t_{B} \} = \{(3, t_{B}), (4, t_{B}), (5, t_{B}) \}$$

So now instead of each number we deal with a sequence of two elements: the original number and a tag which refers to the original set. We use the term _n-tuple_ for a sequence of length $$n$$. Thus, here we deal with sets of _2-tuples_. Since all tuples are unique, the resulting union set contains 6 distinct elements:

$$
A \times \{t_{A} \} \cup B \times \{t_{B} \} = 
\{(1, t_{A}), (2, t_{A}), (3, t_{A}), (3, t_{B}), (4, t_{B}), (5, t_{B}) \}
$$

Every time we learn about a new approach or an idea, your inner mathematician should aspire to generalize. We've already generalized the notion of union by providing a formal mathematical definition. Let us now define this so-called **disjoint union** $$\sum A_{i}$$ to be:

$$
\bigcup_{1 \leq i \leq n} A_{i} \times \{i\} = \{(x, i) | x \in A_{i} \textrm{ and } 1 \leq i \leq n\}
$$

It might seem like the notation is getting more and more complicated, but it's only a combination of existing notions and symbols, nothing new. The big U is a generalization of unions, here it is limited to all sets $$A_{i} \times \{i\}$$ where $$i$$ goes from 1 to some $$n$$.  You can think of $$i$$ as a variable or a parameter. We see it then used to define different sets (e.g. $$A_{1}$$,  $$A_{2}$$,  etc) and corresponding tagging sets $$\{1\}$$,  $$\{2\}$$,  etc. Then, on the right-hand side of the equation there's a set of many 2-tuples, each containing an element from $$A_{i}$$ and a tagging number $$i$$. 

To easily differentiate between regular unions and disjoint unions, we use two different symbols: $$\cup$$ for union, $$+$$ for disjoint union. Thus:

$$
\bigcup_{1 \leq i \leq n} A_{i} \times \{i\} = A_{1} + ... + A_{n}.
$$

{>|} Contrary to popular belief, Venn diagrams aren't suitable representations of `SQL JOIN`. You'll see why later. 

When working with databases using SQL, union operation is a direct equivalent of union from set theory. The following example returns all usernames of both customers and managers:

```sql
SELECT username FROM users
UNION
SELECT username FROM managers;
```

This regular `UNION` operation behaves like set union in regards to duplicates. Thus, if both tables contain identical usernames, only one instance would end up in the union. An alternative SQL operator `UNION ALL` allows duplicates. The resulting collection of records is not necessarily a set, since it main contain identical records.

It is tempting to see SQL as set theory applied to databases, but it would be wrong to think this way. SQL can be considered a domain specific language for a particular application of relational algebra, which _incorporates_ certain areas of set theory. In general, one can say that set theory and SQL _intersect_.