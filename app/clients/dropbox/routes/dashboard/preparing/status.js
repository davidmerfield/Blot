const stages = [
  'TOKEN',
  'LOAD_ACCOUNT',
  'MOVE_EXISTING',
  'TRANSFER',
  'SAVE_ACCOUNT'
];

module.exports = (req, res, next) => {
  req.status.TOKEN = () => {
    req.session.dropbox.status.TOKEN = true;
    req.folder.status('...')
  };
 req.status.TOKEN = () => {

  };
  req.status.TOKEN = () => {

  };
   
}