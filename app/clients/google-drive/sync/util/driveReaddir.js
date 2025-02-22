
const readdir = async (drive, dirId) => {
    let res;
    let items = [];
    let nextPageToken;
  
    do {
      const params = {
        q: `'${dirId}' in parents and trashed = false`,
        pageToken: nextPageToken,
        fields:
          "nextPageToken, files/id, files/name, files/md5Checksum, files/mimeType, files/modifiedTime",
      };
      res = await drive.files.list(params);
  
      // Transform only once
      const transformed = res.data.files.map((f) => {
        if (f.mimeType === "application/vnd.google-apps.document") {
          f.name += ".gdoc";
        }
        return f;
      });
  
      items = items.concat(transformed);
      nextPageToken = res.data.nextPageToken;
    } while (nextPageToken);
  
    return items;
  };