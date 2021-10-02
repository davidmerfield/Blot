const client = require("client");
const promisify = require("util").promisify;

const INVALID_ACCOUNT_STRING =
	"Google Drive client: Error decoding JSON for account of blog ";

const database = {
	keys: {
		allAccounts: function () {
			return "clients:google-drive:all-accounts";
		},
		account: function (blogID) {
			return "blog:" + blogID + ":google-drive:account";
		},
	},

	allAccounts: function (callback) {
		client.smembers(this.keys.allAccounts, (err, blogIDs) => {
			if (err) return callback(err);
			if (!blogIDs || !blogIDs.length) return callback(null, []);
			client.mget(blogIDs.map(this.keys.account), (err, accounts) => {
				if (err) return callback(err);
				if (!accounts || !accounts.length) return callback(null, []);
				accounts = accounts
					.map((serializedAccount, index) => {
						if (!serializedAccount) return null;
						try {
							const account = JSON.parse(serializedAccount);
							account.blogID = blogIDs[index];
							return account;
						} catch (e) {}
						return null;
					})
					.filter((account) => !!account);

				callback(null, accounts);
			});
		});
	},

	getAccount: function (blogID, callback) {
		const key = this.keys.account(blogID);
		client.get(key, (err, account) => {
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

	setAccount: function (blogID, changes, callback) {
		const key = this.keys.account(blogID);

		this.getAccount(blogID, (err, account) => {
			account = account || {};

			for (var i in changes) {
				account[i] = changes[i];
			}

			client
				.multi()
				.sadd(this.keys.allAccounts, blogID)
				.set(key, JSON.stringify(account))
				.exec(callback);
		});
	},

	dropAccount: function (blogID, callback) {
		client
			.multi()
			.del(this.keys.account(blogID))
			.del(this.keys.folderById(blogID))
			.srem(this.keys.allAccounts, blogID)
			.exec(callback);
	},
};

for (const property in database) {
	if (property === "keys") continue;
	module.exports[property] = promisify(database[property]).bind(database);
}
