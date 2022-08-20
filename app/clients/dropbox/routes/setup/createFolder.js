const titleToFolder = require("clients/dropbox/util/titleToFolder");
const promisify = require("util").promisify;

const sync = require("sync");
const database = require("clients/dropbox/database");

const listBlogs = promisify(database.listBlogs);
const get = promisify(database.get);
const set = promisify(database.set);

async function createFolder(account) {
  const { client, full_access } = account;
  const otherBlog = await otherBlogUsingAppFolder(account);

  // Since this blog is connected to Dropbox with 'app folder'
  // permissions and there are no other blogs in this app folder
  // we do not need to do anything: the folder was created by
  // dropbox when they granted Blot permission.
  if (full_access === false && !otherBlog) return account;

  if (otherBlog) await moveExistingFiles(client, otherBlog);

  const folder = "/" + titleToFolder(account.blog.title);

  const { result } = await client.filesCreateFolder({
    path: folder,
    autorename: true,
  });

  account.folder = result.path_display;
  account.folder_id = result.id;

  return account;
}

async function otherBlogUsingAppFolder(account) {
  // If we have access to the entire Dropbox folder
  // just create a new folder for this site in the
  // root directory of the user's dropbox, then
  // tell them they can move it wherever they like.
  if (account.full_access) return null;

  const blogsWithThisDropboxAccount = await listBlogs(account.account_id);

  // If the Dropbox account for this other blog does not
  // have full folder permission and its folder is an empty
  // string (meaning it is the root of the app folder) then
  // there is an existing blog using the entire app folder.
  for (const blog of blogsWithThisDropboxAccount) {
    if (blog.id === account.blog.id) continue;
    const { folder, full_access } = await get(blog.id);
    if (folder !== "") continue;
    if (full_access === true) continue;
    return blog;
  }

  return null;
}

function moveExistingFiles(client, otherBlog) {
  return new Promise((resolve, reject) => {
    // Get a lock on the blog
    // we should add a way to retry this sync attempt
    sync(otherBlog.id, async function (err, folder, done) {
      try {
        const { entries, folder, folderID } = await determineFolder(
          client,
          otherBlog.title
        );

        const {
          result: { batchResult },
        } = await client.filesMoveBatch({
          entries: entries,
          autorename: false,
        });

        if (batchResult.empty) return batchResult;

        let tag;

        do {
          const { result } = await client.filesMoveBatchCheck(batchResult);

          tag = result[".tag"];

          if (tag === "failed")
            throw new Error("Failed to move files, please try again.");

          if (tag !== "complete" && tag !== "in_progress")
            throw new Error("Unknown response " + JSON.stringify(result));
        } while (tag === "in_progress");

        await set(otherBlog.id, {
          folder: folder,
          folder_id: folderID,
          cursor: "",
        });
      } catch (err) {
        return done(err, reject);
      }

      done(null, resolve);
    });
  });
}

async function determineFolder(title, client) {
  var folder = "/" + titleToFolder(title);
  var folderID;

  let {
    result: { entries },
  } = await client.filesListFolder({
    path: "",
    include_deleted: false,
    recursive: false,
  });

  entries.forEach(function (entry) {
    if (entry.path_lower === folder.toLowerCase()) folder += " (1)";
  });

  entries = entries.map(function (entry) {
    return {
      from_path: entry.path_display,
      to_path: folder + entry.path_display,
    };
  });

  const {
    result: { id, path_display },
  } = await client.filesCreateFolder({ path: folder, autorename: false });

  folder = path_display;
  folderID = id;

  return { entries, folder, folderID };
}

module.exports = createFolder;
