module.exports =  function repoUrl(handle, token, repo) {
    return (
      "http://" +
      handle +
      ":" +
      token +
      "@localhost:8284/clients/git/end/" +
      repo +
      ".git"
    );
  };