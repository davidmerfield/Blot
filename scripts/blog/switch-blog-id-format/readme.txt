Can this script be idempotent? It might be useful
to be able to run it multiple times... yes. this must be a requirement.

This script will edit the ID of a blog
Run this on my blogs in production first
before incrementally rolling it out to
ensure all blogs have IDs which are guuids

Things to think about:

where are the blog IDs part of the *value* of a particular key?
e.g. for the transformer keys which store all existing keys
.     the blog ID is part of the members of the set.

1. I need to go through each model and verify where the blog ID
   is being stored/
2. I need to go through where redis is used and verify blog ID are
   not part of it.

acquire a sync lock for the blog before doing any of this
any logged in sessions, any blog info in a session will need to be reset

template keys, owners, lists of templates
domain key, handle key
client databases, etc...
blog search engine keys
blog entry keys
rename /blogs/{id} directory
rename /static/{id} file directory

'template:owned_by:' + blogID,
'handle:' + blog.handle,
'domain:' // also www version...
"blog:" + blogID + ":dropbox:account";

git client should just work

Redis set whoses members are the blog IDs
connected to this dropbox account.
function blogsKey(account_id) {
  return "clients:dropbox:" + account_id;
}

The git client uses User ID so it'll continue to work

we also need to edit all template IDs stored against stuff
e.g. the blog.template property.
e.g. the templates:owned_by:X values
