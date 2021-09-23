module.exports = {
  display_name: "Google Drive",
  description: "A file storage and synchronization service",
  disconnect: require("./disconnect"),
  remove: require("./remove"),
  write: require("./write"),
  site_routes: require("./routes/site"),
  dashboard_routes: require("./routes/dashboard"),
};

/* 

Google places restrictions on the callback URL used 
during OAUTH. You can't use a fake TLD. In development
we use the fake domain blot.development, and Google
forbids this. They do allow the use of localhost though
so we create a lightweight webserver on a port which 
will forward requests to blot.development.

Specifically, this will redirect the following callback url:
  
http://localhost:8822/clients/google-drive/authenticate?code=xxxx

to:

https://blot.development/clients/google-drive/authenticate?code=xxxx

*/

if (require("config").environment === "development") {
  new require("express")()
    .use(function (req, res) {
      console.log("made it here!");
      res.redirect("https://" + require("config").host + req.originalUrl);
      console.log(
        "redirected to",
        "https://" + require("config").host + req.originalUrl
      );
    })
    .on("error", console.log)
    .listen(8822);
}
