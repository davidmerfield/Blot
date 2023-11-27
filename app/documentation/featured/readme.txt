Featured sites
--------------

Why? Testimonials are tacky and there's no better endorsement of a website hosting platform than someone using it to host their real-life website, so show potential customers that there are real people who trust Blot to host their website.

I want to be able to generate a wall of featured sites (~100) of users who have consented to appear on the homepage which are guaranteed to be still hosted by Blot. Want to be able to run the script once per day so the sites are always fresh even if the server doesn't go down. 


How to feature a new site
-------------------------

1. Append a line to sites.txt in the existing format, note the comma after the name:

example.com Julius Caesar, is a politician from Rome

2. Add an image for the site inside the avatars folder named for the new host:

example.com.png

3. Run the script to rebuild the list of featured sites in featured.json then commit your changes:

node app/documentation/featured/build


Specification
-------------

Return the following data:
    - first name + last name, e.g. 'John Smith'
    - a short one-sentence bio, e.g. 'is an antiquarian from London'
    - url to site, e.g. 'https://www.johnsmith.com'
    - pretty hostname, e.g. 'johnsmith.com'
    - template used on the site, e.g. 'Feed template'
    - favicon or avatar 16 x 16


Ideas
-----

Sort the sites by the latest published post?