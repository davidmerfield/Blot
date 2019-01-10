When you add a new route, make sure you export it in index.js

Basic problem is we have some pages which need to be seen when logged in and logged out:

about
contact
documentation
terms and privacy
updates

# References

[Pinboard](http://pinboard.in) - Stole much of the copy from their terms page and privacy policy. Macej's design 'philosophy' was also influential. If I could only steal his sense of humour.

[Kirby](http://getkirby.com) - Stole some of their marketing copy. Looking back, they're likely the subliminal inspiration for Blot's logo.

[New York Times](http://nytimes.com) - Their type treatment of Georgia was ripped and used to design the default theme.

[Cargo Collective](https://cargocollective.com/) - I think they do some really interesting, thoughtful work. Stolen from their selection of themes to help make Blot's.

[Jekyll](http://jekyllrb.com) - A spiritual ancestor to Blot. A beautiful piece of software.

[Stripe](http://stripe.com) - Stole from their excellent support & documentation section when writing Blot's documentation.

[Subtraction](http://subtraction.com) - The original Blot template was massively influenced by Khoi Vinh's blog.

[Second Crack](http://www.marco.org/secondcrack) The project which runs Marco Ament's blog, shares a lot of the design principles of Blot. I didn't see this until after opening Blot to the public and I wish I'd seen it sooner.

# Demo script

Make a simple app which interacts with the Blot folder somehow to demonstrate that its easy to make tools for publishing with Blot.

-----------



Hello there, I've just created an account and Blot has added a folder to my Dropbox. This is that folder. Blot looks for files inside this folder and turns them into blog posts.

Here's a text file containing my first blog post on my desktop. To publish it to my blog, all I have to do is put it in Blot’s folder.

*move file*

Once Dropbox has synced the file, Blot will publish it to my blog. And there it is!

If I want to edit the blog post, all I have to do is edit the file. Blot will update the post automatically.

Blot can also publish images and it works the same way.

*move file*

Lots of people use Blot for scrapbooking – it’s very simple to use!

Here’s a file which has more complicated formatting. It’s got Math equations set in LaTex, some code snippets, embedded images and videos. Blot can understand all this, so when I publish it to my blog it will display correctly. There we go!

Blot also supports HTML with javascript and CSS so you can have total control over your blog posts. Here’s a file which makes use of that.

*move file*

Blot will generate an archives page, RSS feed, sitemap, and a search engine for each blog automatically. It’s got all the features you could want from a blogging platform.

Blot also makes it easy to preview a post before publishing it to my blog. All I have to do is add draft to the file’s name and Blot will create a preview for me. Here it is.

*open file*

This is exactly how it will appear on my blog. When I’m happy, all I have to do is remove ‘draft’ from the file’s name and Blot will publish it. There it is, live on my blog!





# Demo sources

https://en.wikinews.org/wiki/Fernando_Torres_signs_contract_extension_with_Atl%C3%A9tico_Madrid?dpl_id=2793772
https://projects.propublica.org/graphics/d4d-hospital-lookup
https://www.propublica.org/archive/P60/
https://www.good.is/features?page=5
https://commons.wikimedia.org/wiki/Category:Botanical_illustrations
https://commons.wikimedia.org/wiki/Category:Familiar_wild_flowers_figured_and_described
http://threedscans.com/
https://commons.wikimedia.org/wiki/Commons:Featured_pictures/Astronomyhttps://commons.wikimedia.org/wiki/Category:Minerals_on_black_background
https://commons.wikimedia.org/wiki/Category:Extinct_plant_diagrams
https://commons.wikimedia.org/wiki/The_North_American_Sylva
https://commons.wikimedia.org/wiki/Category:Beta_vulgaris_-_botanical_illustrations
https://commons.wikimedia.org/wiki/Category:Daucus_carota_-_botanical_illustrations
https://commons.wikimedia.org/wiki/Category:The_Fruits_of_America
https://commons.wikimedia.org/wiki/Category:USDA_Pomological_Watercolors
https://commons.wikimedia.org/w/index.php?title=Category:USDA_Pomological_Watercolors&filefrom=Pomological+Watercolor+POM00000999.jpg%0APomological+Watercolor+POM00000999.jpg
https://www.flickr.com/photos/nasacommons
https://en.wikipedia.org/wiki/Wikipedia:Featured_pictures
https://en.wikipedia.org/wiki/Wikipedia:Featured_pictures/People/Artists_and_writers
https://en.wikipedia.org/wiki/Wikipedia:Featured_pictures/People/Military
https://upload.wikimedia.org/wikipedia/commons/2/24/Brian_Shul_in_the_cockpit_of_the_SR-71_Blackbird.jpg
https://commons.wikimedia.org/wiki/Commons:European_Science_Photo_Competition_2015/Image_categories
https://en.wikipedia.org/wiki/Wikipedia:Wikiproject:Estonian_Science_Photo_Competition

# Domains

blot.com

blot.im
blot.is
blot.my

useblot.com
tryblot.com
blotcms.com
blotplatform.com

blot.website
blot.host
blot.pub
blot.love

b-l-o-t.com
blot.cm
blot.li
blot.lu
blot.lt
blot.lv
blot.nu
blot.sh
blot.tl
blot.fm
blot.gd
blot.ht
blot.fm
blot.jp

# Free speech

Blot has been running for almost three years now and already there are hundreds of posts and articles published that disgust me. But I would never remove them. I think free-speech is a good principle. Of course letting people speak freely sometimes causes others pain. On balance, I believe the pain is less damaging than the censorship needed to prevent it.

There's a webcomic on free-speech which irritates me whenever I come across it: ...

From the start, Blot was designed with free-speech in mind.
- no advertisers
- no patrons

I don't want to have the power to prevent people from reading dumb, hateful, mean and stupid things. 

If I had a choice, I wouldn't remove anything from Blot. I believe in the marketplace of ideas. I have a low opinion of copyright but I am bound by the laws of the state of Washington in the USA. I will remove copyrighted material per the DMCA.

At some point, Blot will be blocked in China, in Russia and various other states which implement internet filtering. Perhaps some bureacrat will ask me to block or remove some content from the site. It is inevitable. Thankfully, Blot is open-source software dedicated to the public domain. You can host it on your own server and (at least for a little while) beat the jackbooted arseholes who want to control your thoughts.

The poet must not avert his eyes.


# Plan

Blot turns a folder into a website.

Blot creates a new folder inside your Dropbox. It publishes files you put inside. Images, text files, Markdown, Word Documents, bookmarks and more are published automatically.

Use your favourite app to create. Just drag-and-drop files into Blot’s folder in your Dropbox when you're ready to publish them to the internet.

There's no complicated CMS, publishing interface and nothing to install. Just files and folders inside your Dropbox.



2. Write entries on my blog with link back to Blot
  - write about the design process
  - write about using dropbox api with node
3. Publish open source projects.
  - express custom domains OS project
4. Do the legwork to get high-profile designers, programmers, artists, academics, journalists and writers on Blot. Offer to migrate posts and template for free.
  offer to migrate this guy's blog https://twitter.com/thoughtwax

I need people who aren't publicly associated with another
blogging platform & who probably use Dropbox.

-------------
orenchi beyond
zuni café
20th century café
-------------
Peter mendelsund
Frank chimero
Daniel gray
Soleio
Jessica Hische
-------------
Katie rose pipkin
Rasmus Andersson
Erik Bernhardsson
TJ Holowaychuk
Wilson Miner
-------------
Ana Luisa
lilli waters
Jefferson Cheng
Lotta Nieminen
-------------
Mike Bostock
Jeremy Ashkenas
-------------
Robin Sloan
Maciej Ceglowski
-------------

This guy finds obscure music from Iraq and Iran and Afganistan
https://www.reddit.com/r/vintageobscura/comments/7bc289/the_lost_45s_78s_from_afghanistan/https://www.mixcloud.com/madsnimannjensen/the-lost-78s-45s-from-afghanistan/

https://twitter.com/mijustin
https://justinjackson.ca/

https://www.justinobeirne.com/
http://readwrite.com/2011/11/23/how_to_use_calepin_the_easiest_blog_tool_in_the_wo
https://twitter.com/calepinapp/followers
https://twitter.com/scriptogram/followers
http://www.californiossf.com/about.html
http://www.zeldman.com/2015/07/10/give-me-file-hierarchies-or-give-me-chaos/
https://louderthanten.com/articles/story/design-machines
http://www.swiss-miss.com/2012/01/scriptogr-am.html
http://lifehacker.com/5874562/scriptogram-turns-your-dropbox-into-a-blog
http://www.gizmag.com/scriptogram-dropbox-weblog-platform/21133/
http://www.adweek.com/fishbowlny/quickly-start-your-own-dropbox-synced-blog-with-scriptogram/251170?red=kw
http://www.addictivetips.com/windows-tips/scriptogr-am-uses-dropbox-to-create-markdown-document-based-web-log/

Help [Larry](https://mail.google.com/mail/u/0/?zx=2vje3rd5i2o6#inbox/15b6e305d54927b4) 

Help [Svenja](https://mail.google.com/mail/u/1/#inbox/15f734998c533068) 


# Sales copy

People describe it like this:
-----------------------------

This looks like a really simple, elegant way to have a blog just by putting files in your Dropbox

Wordpress watch out!

If you're blog-lazy, but have dropbox, blot.im is an easy alternative. Drop pics and text into a folder, and you make blog.

It's so wonderfully simple!

Really clean and simple.

Blot creates a folder in your Dropbox
and publishes files you put inside.

Just discovered http://blot.im  A hosted blog straight from your Dropbox. Clever idea. Simple and clean. Nice work

In other news I bought this the other day and it is good. Using it is like Tumblr but slightly less convenient: http://blot.im

Blot - Create your Blog in Dropbox

this simple blogging platform seems perfect!

perfect! And so quick - we love blot.im! :D

holy shit. i am totally doing this. very easy blog system (based on dropbox + markdown = generates blog)

OMG I'm already in love with this! blot.im

# Pledge

Need a blog? So did I.

This one is made to last forever.

We need a good solid blog platform for ourselves, and we know our friends and colleagues need one too.

We’re not going to show ads. We’re not looking for investors. We’re going to make money the best way we know how: charging for it.

It will be everything you expect in a blog platform - simple and modern.

What is it?

Post haven is a long-term project that aims to create the world’s best blogging platform and stay that way for as long as humanly possible. We’re as sick as you are about having to move your posts and photos every time a service goes away.

What are the key goals of Posthaven?

Durable URLs forever
Straightforward, open, self-sustaining, pro-user business model
Best-in-class ease of use always

Why are you doing this?

We want to build simple, useful, usable software for people. That’s what we love to do. We’ll never sell this site. It’s not for sale. Ever. Not negotiable.

Will it be $30 a year forever?

No, it will probably end up at something like $5 a month, or $60 a year. Right now, Blot is still unfinished.

We believe fair’s fair — and we’ll always be fair.

First off, we’ll charge money. There’s no question the site will run when you know how to pay for the servers.

Then we’ll keep improving the site the way a good caretaker would tend a garden. We’ll make sure things are clean and safe, and replace things when they get worn, or when it’s ready for a renovation. Think of us as long term data custodians.

What happens if I stop paying?

Permanent URLs are a powerful idea, and it’s a feature of using Posthaven we think you should get even if you stop paying. We’ll keep the site online, but you won’t be able to edit content or add to it. If you want to renew, start paying again and your account will be restored.

When will something qualify for permanent storage? Let’s keep it simple initially: If you pay for a year’s worth of service, your content is safe and we’ll keep it online.

Can I use custom domains with Posthaven?

Yes, you’ll be able to use any domain name you have with Posthaven.

Will Posthaven support multiple sites for one user?

Most definitely — we’re thinking $5/mo per user will buy you up to 10 sites with more for a small additional fee. So don’t worry about paying $5/mo for every new site you have.

What do the blogs look like?

Here are some prominent blogs currently hosted on Posthaven:

Alexis Ohanian — Cofounder of Reddit
Sam Altman — Founder of Loopt
Y Combinator — Startup Incubator
When will Posthaven be able to do _______?

We’re trying to reimplement what took us years to do with a larger team and more resources, but now with just the two of us (Brett and Garry) and just a few months. So it’s a lot, but we can’t wait to ship it all for you.

Here’s what’s in there now:

Post by email
Post by web, with photos, music, video and documents
Private sites with passwords
Pages and links
Autopost to Facebook and Twitter
Image gallery upload and editing
Commenting with automatic anti spam
Blog following with email notifications
Multiple contributors per blog
Here’s what’s coming soonest:

Bookmarklet
HTML/CSS customization
Autopost to App.net and other services
The biggest feature that we’ll put at the end of this list but will get to in a few months is full HTML/CSS theming. It’s the most complicated feature of Posterous and we rushed it last time — so we don’t want to make that mistake again.

We’ll deploy the features and let you know as soon as they’re available. The best way to see the latest is to follow us at the Posthaven Blog .

Questions? Comments?
Email us at help@posthaven.com »

Landing-divider

Welcome to Posthaven-landing
Simple, easy blogs for $5 a month, forever.
Sign Up for Posthaven login


Dropbox folder -> blog

Turns a Dropbox folder into a blog

Blot turns a dropbox folder into a blog

Blot is a blogging platform.

Blot is a simple way to blog.

It adds a folder to your Dropbox and publishes files you put inside.

Move to dashboard.blot.im ?

Publish your blog with
B L O T

Sign up * Log In

Hi, welcome to Blot!
A blogging platform for lazy people

Hi. This is Blot. A blogging platform.

Check the blog for the latest.

Made in the USA

It’s the best blogging platform. Publish a post from your phone. Fix a web page from the back of a car. It’s elegant, powerful, and always ready.

Start from scratch or choose from a variety of included templates.


Any Content You Like

Blog articles, galleries, simple pages or complex product sheets – with Kirby you are not limited to a fixed data structure. You are in control of


Why isn’t there a free plan?
We want Cushion to live a long and healthy life, and we want to afford to work on it. That’s only possible if it can pay for itself.

# Bring your own morals

I am unconcerned with the moral quality of what you publish.  I don't have to energy to evaluate all the erotic poetry published on Blot, let alone the scatological short stories. If it's legal, it stays.

## Should I switch to Blot from another platform?

It's probably more effort than it's worth. Some of Blot's user have written some export tools for Tumblr, Wordpress and Jekyll.

## Should I use Blot or Medium?

Just use Medium. By the way, if anyone comes across anything worthwhile on that platform, please contact me. They've published 2 million articles and each one apparently frivolous.

## Will Blot make me write more?

No. Blot might make publishing a blog easier but it's not going to turn you into Cicero.

## Where does the subscription fee go?

My bank account.

## Don't suffer for your success

Most of the blogs on Blot receive around 100,000 visitors or fewer a month. The annual fee of $30 ensures that Blot is profitable. Large bursts of traffic aren't a big deal, but if you're planning to host a large publication on Blot, perhaps consider hosting yourself because...

## Blot is run by one person

That's me. If I get hit by a bus: all your blog posts are on your machine and the source code is public. I'm sure you'll manage. At this point, I just tend to the few bugs left and ensure things run smoothly.

## A hosted service

I have to wake up at 3am to fix something instead of you. If the service goes down at 3am you'll have to wake me up.


## Feature requests

I built Blot to be the blogging platform I want. I recognize it is a niche product and I'm not going to do anything retarded and raise funding or employ people. I've been on that proverbial rollercoaster before and it was silly.

This means that I only add features to the platform which I want to exist. Otherwise I won't care to implement them properly.

## Branding

As far as I'm concerned, advertising is the devil and anyone party to it should be lined up at shouted at until they past. One of my goals has been to ensure that it would difficult to tell whether or not a blog is published on Blot. Even the source code.


## The worst are full of passionate intensity

I don't *really* care about this. It's a way to host my writing which got a little out of hand. 100% passion-free guarantee. If you want passion, go public your listicle on Medium.


# A blogging platform

Blot creates a folder in your Dropbox
and publishes files you put inside.

Write with your favorite tool. Drag-and-drop
text and images into Blot's special folder.

Blot handles typesetting and distribution
behind the scenes. Learn more about what Blot.

I charge a small annual fee to keep Blot fast,
independent and sustainable.

THE BASIC GOAL OF THE HOMEPAGE IS TO GET THE USER TO WATCH THE DEMO, UNDERSTAND HOW THE PUBLISHING HAPPENS.

HOME
- FAQ
- TERMS
- SIGN UP

A blogging platform with no interface.

Blot turns files in your Dropbox into blog posts. Publishing is as simple as drag and drop.

Just files and folders.

You can use whatever text editor you like to write your blog posts.

Blot creates a folder in your Dropbox and converts files you put inside to blog posts. Publishing is as easy as drag and drop.

Stop filling out forms and focus on your writing.

Blot was designed with an obsessive eye for typography. Read more about the steps Blot takes to set your writing beautifully.

Unlike some business, the more people use Blot, the more money Blot makes. This is because blot charges $30 a year.


Tumblr is so easy to use that it’s hard to explain.
We made it really, really simple for people to make a blog and put whatever they want on it. Stories, photos, GIFs, TV shows, links, quips, dumb jokes, smart jokes, Spotify tracks, mp3s, videos, fashion, art, deep stuff. Tumblr is 236 million different blogs, filled with literally whatever.

You do this:

1. Write a blog post, take a photo. THis is the hard part.
2. Drag and drop the post or image into Blot's folder

Blot does the rest automatically:

1. Downloads the file from Dropbox
2. Converts it into a blog post. If there's text, it will typeset it.
3. Publish it to your blog, add it to your RSS feed & search engine.



Blot is friendly to designers and developers.
Creating your own template is simple and
straightforward. Customzing an existing template
is easy too.

Websites come and go.
This is one made to last forever.


Freedom of expression

Because Blot isn't subject to the business ethics of advertisers, you are free to publish anything as long as it's legal in the USA. Blot does not and will never censor your blog posts.

Blot allows you to retain full intellectual ownership of the material you post.

Use your own domain.
Unbranded – blot's logo appears nowhere on your blog.
Blot comes with plugins to make writing even easier:
- embedded tweets
- embedded videos from youtube and vimeo
- automatic smart punctuation.

Why Blot?

Here are thirteen great reasons to use Blot:

1. Blot has the simplest publishing interface – drag and drop.
2. Blot is fast, even with thousands of blog posts.
3. You get support from the developer, via email or Twitter.
4. You can use your own domain.
5. Blot doesn't put ads on your blog and never will.
6. You can completely customize the HTML & CSS of your blog.
7. Blot is reliable. Downtime is rare and brief.
8. The pricing plan is simple and fair: you pay a small annual fee
9. You can write your posts in a variety of formats: html, markdown and plain text.
10. Blot offers handy plugins for improving your publishing experience.
10. Blot caters to users who value privacy. You don't need to use your real name or share your address.
12. Blot generates an RSS feed, sitemap and search engine for your blog automatically.

Your current blogging platform is poorly designed, slow and unnecessarily complex. Publishing new posts is a chore.

Blot is the simplest way to blog.

<video>

Blot creates a folder inside your Dropbox and automatically converts any text files inside to blog posts.

Blot has no interface. Publishing is as simple as moving a text file into Blot's Dropbox folder.

You can write with the text editor of your choice and publish from anywhere. Blot supports Markdown which allows your to add rich formatting to your blog posts. Read more about Markdown.

Blot comes with a good looking theme by default. You can also write your own custom theme. It's blazing fast. You can also use a custom domain with Blot.

Blot charges $12 a year. This fee goes towards the costs of running and maintaining Blot. The signup fee helps discourage spammers and gives me more time to work on features. It also ensures Blot is a service you can depend to be around.

Blot is open source. You can self-host the code which powers Blot for free.

Additional features

- Open source
- Markdown support
- Custom themes
- Custom domains
- Is a financially sustainable project
- No ads, anywhere, ever.
- Great privacy policy and data protection

# Social media

# Rules for Social Media

- Have as few social media accounts as possible
- Respect the time of the people who follow you
- Only post updates which pertain to Blot itself
- It's fine not to tweet for months.
- Never retweet praise, it's tacky.
- Express as few opinions as neccessary
- Proof-read all posts
- Never use emoji
- Never like user content
- Never follow other users
- Never pay for followers
- Never pay for advertising

# Description

At its core, Blot is a static file server.

If you put a file called apple.png inside Blot's folder, it will be accessible at your-domain.com/apple.png.

This means you could use Blot as a relatively inexpensive host the output of a static blogging tool like Jekkyl or to host hand-crafted site.

But that's fairly boring. What makes Blot more interesting is its templating system.

The templating system sits above the static file server

# Users

[X] [X] [X] [X] [X]    [X] [X] [X] [X] [X]    [X] [X] [X] [X][X]
[X] [X] [X] [X] [X]    [X] [X] [X] [X] [X]    [X] [X] [X] [X][X]
[X] [X] [X] [X] [X]    [X] [X] [X] [X] [X]    [X] [X] [X] [X][X]
[X] [X] [X] [X] [X]    [X] [X] [X] [X] [X]    [X] [X] [X] [X][X]
[X] [X] [X] [X] [X]    [X] [X] [X] [X] [X]    [X] [X] [X] [X][X]

[X] [X] [X] [X] [X]    [X] [X] [X] [X] [X]    [ ] [ ] [ ] [ ][ ]
[X] [X] [X] [X] [X]    [X] [X] [X] [X] [X]    [ ] [ ] [ ] [ ][ ]
[X] [X] [X] [X] [X]    [X] [X] [X] [X] [X]    [ ] [ ] [ ] [ ][ ]
[X] [X] [X] [X] [X]    [X] [X] [X] [X] [X]    [ ] [ ] [ ] [ ][ ]
[X] [X] [X] [X] [X]    [X] [X] [X] [X] [X]    [ ] [ ] [ ] [ ][ ]
