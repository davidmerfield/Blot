module.exports = function render (view_name) {
  return function (req, res) {
    res.dashboard(view_name);
  };
};