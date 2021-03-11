var client = require("client");

// We use a LUA script to guarantee atomicity
// We can't use WATCH because it doesn't account for 
// the same client
const SCRIPT = `
	local exists = false; 

	for _, value in pairs(redis.call("LRANGE",KEYS[1], 0, -1)) do
	  if (value == ARGV[1]) then exists = true; break; end
	end;

	if (exists) then return 0 end;

	for _, value in pairs(redis.call("LRANGE",KEYS[2], 0, -1)) do
	  if (value == ARGV[1]) then exists = true; break; end
 	end;

	if (exists) then return 0 end;

	redis.call("LPUSH", KEYS[1], ARGV[1]);
	return 1`;

let SHA;

module.exports = function RPUSHNX(firstList, secondList, item, callback) {
	if (SHA) {
		client.evalsha(SHA, 2, firstList, secondList, item, callback);
	} else {
		client.script("load", SCRIPT, function (err, sha) {
			SHA = sha;
			client.evalsha(SHA, 2, firstList, secondList, item, callback);
		});
	}
};

client.script("load", SCRIPT, function (err, sha) {
	SHA = sha;
});
