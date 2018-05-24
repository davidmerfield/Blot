module.exports = function (req, res, next){

  res.dashboard = function(name) {
    res.renderDashboard(__dirname + '/../views/' + name + '.html');
  };

  next();
};