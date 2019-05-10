Does Cloudfront use blot.im as host when requesting origin or blot.im? 
- It would be nice ot keep blotcdn.com as host so we could remove cloudfront and everything would still work.
- Will we need to generate an SSL cert for blotcdn.com

Add some lines to nginx configuration to handle delivery of static files too, but pass requests to node if otherwise.

Add way to replace protocol of CDN links in HTTP responses in blog rendering middleware.