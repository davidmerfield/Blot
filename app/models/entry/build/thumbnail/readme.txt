# Thumbnails

This code selects an image from a blog post and generates a series of thumbnails. At the moment, it prioritizes candidates based on how soon they appear in the post. Anything specified in the post's metadata takes priority.

To do
-----
* Add tests for autorotation
* Add test for image modification: does thumbnail also change?
* Make sure image quality is preserved
* Re-enable minify.js with imperceptible minification
* Re-enable verify.js to ensure of minimum image dimensions for thumbnail and add test to this effect
* Add tests for various corrupted and large files
* Verify thumbnails are being cached properly by NGINX

Future ideas
-------------
* It would be nice to return thumbnail URLs instantly. Perhaps a loading thumbnail that is replaced once the thumbnails are built? We also need the width and height attributes too remember... It's quite a slow process right now. Would be nice to make it asynchronous. Maybe given hash of post content at this point, see if we can overwrite its thumbnails...
* What about an api where we generate thumbnails on demand from the theme using a query string: <img src="{{thumbnail}}?width=X">. Could be cool but would have to prevent abuse.

Pitfalls
--------
* I got strange sharp errors "hash_table !== null" in the logs when the process died before sharp finished. Something to be aware of in future
