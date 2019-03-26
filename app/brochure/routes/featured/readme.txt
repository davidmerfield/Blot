I want to be able to generate a wall of featured sites (~100) of users who have consented to appear on the homepage which are guaranteed to be still hosted by Blot. 

Return the following data:
    - first name + last name, e.g. 'John Smith'
    - a short one-sentence bio, e.g. 'is an antiquarian from London'
    - url to site, e.g. 'https://www.johnsmith.com'
    - pretty hostname, e.g. 'johnsmith.com'
    - template used on the site, e.g. 'Feed template'
    - favicon or avatar 16 x 16

Generate an email I can send to customers asking for permission to link to their site.

Sort the sites by the latest published post?

Want to be able to run the script once per day so the sites are always fresh even if the server doesn't go down...

Want to be able to paste in an avatar....

This shouldn't be in source code. I don't want to be distributing this, perhaps a data directory...


To add a new site, append a line to ./sites.txt in the existing format. Then add an avatar inside ./avatars with the corresponding hostname as filename. e.g. add this to the end of sites.txt

example.com John Doe, is a farmer from Sicily

and then add 'example.com.png' to /avatars to ensure there's a favicon to show on the homepage. When the server starts, Blot will build the featured sites.