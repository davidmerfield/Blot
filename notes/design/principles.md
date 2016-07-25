# Designing a blog

Admittedly the hardest part about blogging is writing the blog post, not publishing it, but that shouldn’t stop us from trying to make publishing just a little bit easier.

My central thesis is that blogging interfaces currently force a user to manually map the file representing the post into a format the platform can parse.

The publish page is just that: add your post's content, use an awkward rich text editor to format the content with links and headings and lists etc... Declare your entry's title and date then press submit. Well, surely all this information is encoded in the file?

Why not offload the responsibility of formatting to the blogging platform and let the user just create the file?

Central to my philosophy in designing blot is this assumption:
interfaces which attempt to guess your desired result and misjudge 2% of the time are superior to theoretically pure interfaces which do not. This entails using heuristics. For instance, this is the pseudo code for how Blot generates a title from a file:

If one of the first 3 nodes of the entry is a heading:
	Title is the text of the greatest, earliest heading.

If there is a node with text in the entry:
	Title is the first sentence of the first node with text.

Else
	Title is derived from the file's name. For instance
	/word_doc.txt becomes 'Word doc' and /2015/why-hello-there.txt 	becomes 'Why hello there'

This is complex requires some flexibility. But the benefit is that Blot will not complain if you do not specify a title for a blog post.

Everything is flexible.

## The publishing process

Publishing a blog post essentially looks like this:

1. Log in to your blog’s site
2. Press “New post” button
3. Write & edit your posts
4. Press “Publish” button

Online blogging software usually forces you to use their own (often buggy) rich text editor. Unfortunately, writers vary enormously in their preference for tools. Some prefer Microsoft Word, others prefer vim.

The solution is to allows writers to use whatever text editor they want to create their blog posts. Of course, plenty of people just write in their own text editor anyway then paste the contents into, say, Wordpress' form, but isn’t that evidence for a broken system? So how do we remove a lot of this interface? At their essence blog posts are files of formatted text with some extra metadata attached (date published, author’s name, comments). Anyone using a computer has a file system so instead of interacting with an interface to a online database, why don’t authors just interacting with files on their own operating system?

Markdown is the obvious choice because it basically looks like text and takes about 5 minutes to understand. It’s also fairly unambiguous about what the rendered HTMl will look like.

Since a lot of people use Dropbox, we’ll use them to transfer the blog posts from your computer to the server. Alternatives for the file transfer include rsync or git or something more custom, but Dropbox is easy so we'll use that for now.

Once we put these components together we have a system for publishing, editing and removing blog posts that allows the writer to use their own tools! This is obviously not an original idea.

## Too rigid

The internet is fucking awesome. JavaScript is awesome, HTML is fine, CSS is acceptable. Combined they give writers more creative freedom that poor old Gutenberg could conceive. They’re so powerful but lots of blogging systems are reluctant to allow their users to make full use of them. Ideally we’d have a product that wouldn’t restrict advanced users from making use of javascript and html, but wouldn’t intimidate new users with file extensions with which they're unfamiliar.

To make this work each blog would need to be sandboxed to its own subdomain (or custom domain) to prevent any security issue, which is no big deal.

Medium and Svbtle are great but what if I want to include an interactive graph or chart? Because they prevent their users from embedding javascript it’s impossible.

## I want the pages to work in 15 years time

It makes me incredibly happy that I can still browse Livejournal pages written over 15 years ago that are snappy and clear. I find it hard to believe that browsers will still render the complicated javascript mess that is say, Twitter, in 15 years time. But perhaps not. Either way, Blot would serve HTML with limited to no client side JS, unless of course specified by the user.


## Isn't this just a few lines of code?

Yes, in fact the very first version of Blot fit in a single javascript file. It was a clumsy module that grabbed a folder from my dropbox, ran each file through a markdown parser then generated an index page with links to each html file. It worked and it felt like magic.

Turning this simple thing into a piece of software worth charging for was a little more complicated. Some of the more significant challenges I had to overcome:

- Writing a wrapper to intercept file rename events from the Dropbox API. Currently renames appear as a deletion and a file creation.

- Metadata parsing. Extracting metadata declared at the top of the entry's file proved more challenging than anticipated.

- Integrating stripe was straightforward. The only cumbersome part was writing code to handle for delinquent subscribers. This is one thing about Stripe's test API that I'd improve.

# Why blot?

Own your writing

Own your identity

One of Blot's initial principles was unbranding. Nowhere on the user blog, not even in the HTML or CSS source, does any indication it is a Blot site appear. There's no tumblr-like log in bar, no subtle logo in the bottom corner. You're paying for the service so you can control how it looks.

The draw backs of Blot

Blot is a hosted service. That means I am responsible for ensuring your blog is up and running smoothly. Some people like this delegation of responsibility – it means I'm the person who's up at 3am fixing an obscure bug and not you. The benefit is that you don't have to worry about updating your blog manually to fix security patches.

The second major issue is comments: Blot doesn't yet have them. You can embed Disqus comments but it's just not the same. As evidenced by the fact that a company exists just to provide a comments widget, comments are a complicated problem to solve.

