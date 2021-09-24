const client = require("client");
const promisify = require("util").promisify;

const INVALID_ACCOUNT_STRING =
	"Google Drive client: Error decoding JSON for account of blog ";

const database = {
	accountKey: function (blogID) {
		return "blog:" + blogID + ":googledrive:account";
	},
	getAccount: function (blogID, callback) {
		const key = this.accountKey(blogID);

		client.get(key, function (err, account) {
			if (err) {
				return callback(err);
			}

			if (!account) {
				return callback(null, null);
			}

			try {
				account = JSON.parse(account);
			} catch (e) {
				return callback(new Error(INVALID_ACCOUNT_STRING + blogID));
			}

			callback(null, account);
		});
	},
	dropAccount: function (blogID, callback) {
		const key = this.accountKey(blogID);
		client.del(key, callback);
	},
	setAccount: function (blogID, changes, callback) {
		const key = this.accountKey(blogID);

		this.getAccount(blogID, function (err, account) {
			account = account || {};

			for (var i in changes) {
				account[i] = changes[i];
			}

			client.set(key, JSON.stringify(account), callback);
		});
	},

	folderByIdKey: function (blogID) {
		return "blog:" + blogID + ":googledrive:folder:id";
	},

	storeFolder: function (blogID, { fileId, path }, callback) {
		client
			.multi()
			.hset(this.folderByIdKey(blogID), fileId, path)
			.exec(callback);
	},

	deleteFolder: function (blogID, { fileId, path }, callback) {
		client.multi().hdel(this.folderByIdKey(blogID), fileId).exec(callback);
	},

	getByFileId: function (blogID, id, callback) {
		client.hget(this.folderByIdKey(blogID), id, callback);
	},
};

for (const property in database) {
	module.exports[property] = promisify(database[property]).bind(database);
}
