     multi.del(key.allViews(id));

      for (var i in views) multi.del(key.view(id, views[i].name));

    getAll(id, function(err, views) {
      if (err || !views) return callback(err || new Error("No views"));
