This module allows us to transform
a file to some arbritrary JSON object
and persist that in the db. The file can
exist on disk or at a URL. This module
only applies the transformation function
to the same file once.

I use this module to upload images in blog
posts, but to only upload the same image once.
If it's already uploaded, this retrieves its
url and dimensions from the database.
As you can imagine, this massively speeds up
saving existing entries, since images don't need
to be reuploaded each time!