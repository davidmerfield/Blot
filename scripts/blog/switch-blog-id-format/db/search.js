        console.log("Searching for old id");
        // this is a bad idea with the old format since they're just integers
        redisSearch("blog:" + blog.id + ":", function(err, results) {
        });
