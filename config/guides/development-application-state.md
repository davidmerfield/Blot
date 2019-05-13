I have a script to save application state and reload application state. If you have existing things in the database, consider recommend flushing redis:

```redis-cli flushall```

Building the templates:

```node scripts/build/template```

Creating a user and blog:
```node scripts/user/create example@example.com XXXXXX```
```node scripts/blog/create example@example.com dev```

Logging in and configuring the blog 'dev' which you just created to the local client at a folder of your choice:

```node scripts/access dev```

Then saving the entire application state using the following script:

```node scripts/folder/save init```

In future, you can run the following to go back to the clean slate:

```node scripts/folder/load init```