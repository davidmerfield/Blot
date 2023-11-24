local cacher = {
    _VERSION     = "cacher.lua 1.0.0",
    _DESCRIPTION = "Purgable cache for OpenResty",
    _URL         = "",
    _LICENSE     = ""
  }

require "resty.core.shdict"

local function cacher_add (self, host, cache_key) 
    local shared_dictionary = self.shared_dictionary
    local cache_key_hash = ngx.md5(cache_key)
    ngx.log(ngx.NOTICE, "adding to dictionary " .. cache_key .. " host=" .. host .. " expected_hash=" .. cache_key_hash)
    shared_dictionary:rpush(host, cache_key)
end  

local function cacher_inspect (self, ngx)
    local cache_directory = self.cache_directory
    local shared_dictionary = self.shared_dictionary

    if (cache_directory == nil) then
        ngx.say("please set cache_directory")
        ngx.exit(ngx.OK)
    end

    if (shared_dictionary == nil) then
        ngx.say("please set shared_dictionary")
        ngx.exit(ngx.OK)
    end

    -- the host is passed in ?host=example.com
    local host = ngx.var.arg_host

    if (host == nil) then
        ngx.say("please pass host to inspect as an argument")
        ngx.exit(ngx.OK)
    end

    ngx.log(ngx.NOTICE, "inspecting host: " .. host)

    local key_list = {};
    local hash_list = {};
    local total_keys = shared_dictionary:llen(host)

    ngx.log(ngx.NOTICE, "found cache keys: " .. total_keys)

    local cache_key = shared_dictionary:lpop(host)

    while cache_key do
        table.insert(key_list, cache_key)
        local cache_key_hash = ngx.md5(cache_key)
        table.insert(hash_list, cache_key_hash)
        cache_key = shared_dictionary:lpop(host)
    end

    -- reinstate the keys in the list
    for _, key in ipairs(key_list) do
        shared_dictionary:rpush(host, key)
    end

    -- append the list of cache keys to the message seperated by newlines
    local message = table.concat(hash_list, "\n")

    ngx.say(message)
    ngx.exit(ngx.OK)
end

-- this file will read the contents of the cache directory and store them in 
-- the lua shared dict shared_dictionary so we can purge them later 

-- I'm not sure why we need to deduplicate the keys?-- 
local function deduplicate_key_list_by_host (host, shared_dict)

    ngx.log(ngx.NOTICE, "deduplicate_key_list_by_host: " .. host)

    local deduplicated_key_list = {}

    -- we lpop from the list until we get nil
    local key = shared_dict:lpop(host)

    while key do

        if (deduplicated_key_list[key] == nil) then
            ngx.log(ngx.NOTICE, "unique key: " .. key)
            table.insert(deduplicated_key_list, key)
            deduplicated_key_list[key] = true
        else
            ngx.log(ngx.NOTICE, "duplicate key: " .. key)
        end

        key = shared_dict:lpop(host)
    end

    -- reinsert the keys into the list
    for _, key in ipairs(deduplicated_key_list) do
        ngx.log(ngx.NOTICE, "reinserting key: " .. key)
        shared_dict:rpush(host, key)
    end
end

local function extractHostFromCacheFile (ngx, cache_file_path)

    -- we need to read the first line of the cache file to get the host
    -- the first line is in the format:
    -- KEY: http://example.com/xyz/abc
    local file = io.open(cache_file_path, "r")
    local first_line = file:read()

    local number_of_lines_read = 1

    -- keep reading the file until we get a line that contains "KEY: ", up to a max of 10 lines
    while (first_line ~= nil and number_of_lines_read < 10 and string.match(first_line, "KEY: ") == nil) do
        first_line = file:read()
    end

    if (first_line == nil) then
        return nil
    end

    local key = string.match(first_line, "KEY: (.*)")

    if (key == nil) then
        ngx.log(ngx.NOTICE, "key is nil")
        return nil
    end

    -- the protocol is included in the uri so we need to remove it
    local uri_without_protocol = string.match(key, "://(.*)")

    if (uri_without_protocol == nil) then
        return nil
    end
    
    -- the host is the first part of the uri, up to question mark or slash or colon if there is one
    local host = string.match(uri_without_protocol, "([^/?#:]+)")

    if (host == nil) then
        return nil
    end
    
    file:close()

    -- return both the key and the host

    return {key=key, host=host}
end

-- returns a list of file or directory names in the given directory
local function readdirectory(directory)
    local i, t, popen = 0, {}, io.popen
    local pfile = popen('ls -a "'..directory..'"')

    -- we want to skip the lines that are . or ..
    for filename in pfile:lines() do
        if (filename ~= "." and filename ~= "..") then
            i = i + 1
            ngx.log(ngx.NOTICE, "found file: " .. filename)
            t[i] = filename
        end
    end

    pfile:close()
    return t
end


local function cacher_rehydrate (self)

    -- we need to read the contents of the cache directory and store them in 
    -- the lua shared dict shared_dictionary so we can purge them later
    local cache_directory = self.cache_directory

    -- local purged_files = purge_host(ngx.var.arg_host)
    local shared_dictionary = self.shared_dictionary

    local message = ''

    ngx.log(ngx.NOTICE, "rehydrate: " .. cache_directory )

    -- first we list all the top level directories in the cache directory
    local top_level_directories = readdirectory(cache_directory)

    -- store a list of hosts
    local hosts = {}

    -- then for each directory we list all the files in that directory
    for _, top_level_directory in ipairs(top_level_directories) do

        local top_level_directory_path = cache_directory .. "/" .. top_level_directory
        local second_level_directories = readdirectory(top_level_directory_path)
  
        for _, second_level_directory in ipairs(second_level_directories) do
            local second_level_directory_path = top_level_directory_path .. "/" .. second_level_directory
            local files = readdirectory(second_level_directory_path)
 
            for _, file in ipairs(files) do
                local cache_file_path = top_level_directory .. "/" .. second_level_directory .. "/" .. file
                local response = extractHostFromCacheFile(ngx, second_level_directory_path .. "/" .. file)
                

                -- if the host was not parsed, log the file
                if (response == nil) then
                    ngx.log(ngx.NOTICE, "rehydrate: failed to parse host: " .. cache_file_path)
                    message = message .. cache_file_path .. "\n"
                else

                    local host = response.host
                    local key = response.key

                    -- add the host to the list of hosts
                    if (hosts[host] == nil) then
                        table.insert(hosts, host)
                        hosts[host] = true
                    end
    
                    ngx.log(ngx.NOTICE, "rehydrate: adding KEY=" .. key .. " HOST=" .. host .. " FILE=" .. file)
                    shared_dictionary:rpush(host, key)
                end
            end
        end
    end
 
    for _, host in ipairs(hosts) do
        deduplicate_key_list_by_host(host, shared_dictionary)
    end

    ngx.log(ngx.NOTICE, "rehydrate: complete")

    if (message == '') then
        message = "OK"
    end

    return message
end

local function cacher_purge (self, ngx)

    local cache_directory = self.cache_directory
    local shared_dictionary = self.shared_dictionary

    local message = ''

    if (cache_directory == nil) then
        ngx.say("please set cache_directory")
        ngx.exit(ngx.OK)
    end

    if (shared_dictionary == nil) then
        ngx.say("please set shared_dictionary")
        ngx.exit(ngx.OK)
    end

    -- prevent an error if the args are nil
    if (ngx.var.args == nil) then
        ngx.say("please pass host to purge as an argument")
        ngx.exit(ngx.OK)
    end

    for host in string.gmatch(ngx.var.args, "host=([^&]+)") do
        ngx.log(ngx.NOTICE, "purging host: " .. host)
        local total_keys = shared_dictionary:llen(host)
        local cache_key = shared_dictionary:lpop(host)
        while cache_key do
            -- the cache file path is in the following format: $x/$y/$cache_key_hash
            -- where x is the last character of the cache_key_hash
            -- and y are the two characters before x
            local cache_key_hash = ngx.md5(cache_key)
            local x = cache_key_hash:sub(-1)
            local y = cache_key_hash:sub(-3,-2)
            local cached_file_path = cache_directory .. "/" .. x .. "/" .. y .. "/" .. cache_key_hash
            local f = io.open(cached_file_path, "r")
            
            if f ~= nil then
                io.close(f) 
                os.remove(cached_file_path)
            end

            cache_key = shared_dictionary:lpop(host)            
        end
        message = message .. host .. ": " .. total_keys .. "\n"
    end

    -- if message is empty then replace it with a message saying that no hosts were purged
    if (message == '') then
        message = "no hosts were purged"
    end
    
    ngx.say(message)
    ngx.exit(ngx.OK)
end

function cacher_monitor_free_space (self, ngx, monitor_interval)
    
    if (monitor_interval == nil) then
        monitor_interval = 60
    end

    ngx.timer.every(monitor_interval, function (premature)
        if premature then
            return
        end

        -- if both cache_directory and shared_dictionary are set then we can rehydrate
        if (self.shared_dictionary ~= nil) then
            local free_space = self.shared_dictionary:free_space()
            ngx.log(ngx.NOTICE, "free_space: " .. free_space)
        end
    end, self)
end

--- Create a new cacher instance.
function cacher.new()
    
    local function cacher_set(self, key, value)
        self[key] = value

        -- if both cache_directory and shared_dictionary are set then we can rehydrate
        if (self.cache_directory ~= nil and self.shared_dictionary ~= nil) then
            cacher_rehydrate(self)
        end
    end

    return {
        purge = cacher_purge,
        set = cacher_set,
        add = cacher_add,
        inspect = cacher_inspect,
        rehydrate = cacher_rehydrate,
        monitor_free_space = cacher_monitor_free_space
    }
end

return cacher