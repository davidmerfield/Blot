The code in these folders is responsible for converting files of a given extension into HTML. This HTML is then used to produce a full blog post. 

## Adding a new converter

1. Converter must expose two methods, ```read``` and ```is```. 

```
converter.read(blog <object>, path <string>, options <object>, callback<function>) which invokes callback with (err <null or Error>, html <string>, stat <fs.Stat object>)

converter.is(path <string>) which returns <boolean>
```

Then expose the new converter in [index.js](./index.js).

## Why do converters need to know about the blog?

Some converters, like the one for Word Documents, unbundles embedded files and needs to expose them somewhere. This means we need to know the structure of the blog's folder for instance. We also might need to know some conversion options. I would like to simplify the signature of ```converter.read``` to something like: (path to folder, path to file inside folder, options, callback).
