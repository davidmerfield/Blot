local cacher = {
    _VERSION     = "cacher.lua 1.0.0",
    _DESCRIPTION = "Purgable cache for OpenResty",
    _URL         = "",
    _LICENSE     = ""
  }

local md5 = require "md5"

local function cacher_add (self, ngx) 
    local shared_dictionary = self.shared_dictionary

    local host = ngx.var.host
    local request_uri = ngx.var.request_uri
    local server_port = ngx.var.server_port
    local scheme = ngx.var.scheme

    local cache_key = scheme .. "://" .. host .. ":" .. server_port .. request_uri
    local cache_key_md5 = md5.sumhexa(cache_key)

    -- the cache file path is in the following format:
    -- $x/$y/$cache_key_md5
    -- where x is the last character of the cache_key_md5
    -- and y are the two characters before that
    local cache_file_path = cache_key_md5:sub(-1) .. "/" .. cache_key_md5:sub(-3,-2) .. "/" .. cache_key_md5   
    local already_stored = shared_dictionary:get(cache_file_path)

    if (already_stored == nil) then
        ngx.log(ngx.NOTICE,host .. " " .. cache_file_path.. " adding to dictionary")
        shared_dictionary:rpush(host, cache_file_path)
        shared_dictionary:set(cache_file_path, true)
    else 
        ngx.log(ngx.NOTICE,host .. " " .. cache_file_path.. " already stored" )
    end
end  


-- this file will read the contents of the cache directory and store them in 
-- the lua shared dict shared_dictionary so we can purge them later 

-- I'm not sure why we need to deduplicate the keys?-- 
local function deduplicate_key_list_by_host (ngx, host, shared_dict)

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
    -- emit a warning with the cache_file_path
    ngx.log(ngx.NOTICE, "extracting host from cache_file_path: " .. cache_file_path)

    -- we need to read the first line of the cache file to get the host
    -- the first line is in the format:
    -- KEY: http://example.com/xyz/abc
    local file = io.open(cache_file_path, "r")
    local first_line = file:read()

    -- keep reading the file until we get a line that starts with KEY
    while (first_line ~= nil and string.match(first_line, "^KEY:") == nil) do
        first_line = file:read()
    end

    if (first_line == nil) then
        ngx.log(ngx.NOTICE, "uri is nil")
        return nil
    end

    local uri = string.match(first_line, "KEY: (.*)")

    if (uri == nil) then
        ngx.log(ngx.NOTICE, "uri is nil")
        return nil
    end

    -- the protocol is included in the uri so we need to remove it
    local uri_without_protocol = string.match(uri, "://(.*)")

    -- the host is the first part of the uri, up to question mark or slash if present
    local host = string.match(uri_without_protocol, "([^/?]+)")

    if (host == nil) then
        ngx.log(ngx.NOTICE, "host is nil")
        return nil
    end
    
    file:close()

    ngx.log(ngx.NOTICE, "found host from cache_file_path: " .. host)

    return host
end

-- list all the items in the cache directory
local function readdirectory(directory)
    local i, t, popen = 0, {}, io.popen
    local pfile = popen('find "'..directory..'" -maxdepth 1')
    for line in pfile:lines() do
        i = i + 1
        -- the line starts with the directory so we need to remove that
        local filename = string.match(line, directory .. "/(.*)")
        -- skip the first line which is the directory itself
        if (i > 1 and filename ~= nil) then
            table.insert(t, filename)
        end
    end
    pfile:close()
    return t
end


local function cacher_rehydrate (self, ngx)

    local cache_directory = self.cache_directory

     -- local purged_files = purge_host(ngx.var.arg_host)
     local shared_dictionary = self.shared_dictionary

     -- first we list all the top level directories in the cache directory
     local top_level_directories = readdirectory(cache_directory)
 
     -- store a list of hosts
     local hosts = {}
 
     -- then for each directory we list all the files in that directory
     for _, top_level_directory in ipairs(top_level_directories) do
 
         local top_level_directory_path = cache_directory .. "/" .. top_level_directory
         local second_level_directories = readdirectory(top_level_directory_path)
 
         ngx.log(ngx.NOTICE, "reading top level directory: " .. top_level_directory_path)
 
         for _, second_level_directory in ipairs(second_level_directories) do
             local second_level_directory_path = top_level_directory_path .. "/" .. second_level_directory
             local files = readdirectory(second_level_directory_path)
 
             for _, file in ipairs(files) do
                 local cache_file_path = top_level_directory .. "/" .. second_level_directory .. "/" .. file
                 local host = extractHostFromCacheFile(ngx, second_level_directory_path .. "/" .. file)
 
                 if (host ~= nil) then
                     -- add the host to the list of hosts
                 if (hosts[host] == nil) then
                     ngx.log(ngx.NOTICE, "found host: " .. host)
                     table.insert(hosts, host)
                     hosts[host] = true
                 end
 
                 ngx.log(ngx.NOTICE, "found cache file path: " .. cache_file_path)
                 shared_dictionary:set(cache_file_path, true)
                 shared_dictionary:rpush(host, cache_file_path)
                 end
 
                 
             end
         end
     end
 
     for _, host in ipairs(hosts) do
         deduplicate_key_list_by_host(ngx, host, shared_dictionary)
     end

end


local function file_exists(filepath)
    local f = io.open(filepath, "r")
    if f~=nil then io.close(f) return true else return false end
end

local function remove_file(filepath)
    if (file_exists(filepath)) then
            os.remove(filepath)
    end
end



local function cacher_purge (self, ngx)

    local cache_directory = self.cache_directory

    -- local purged_files = purge_host(ngx.var.arg_host)
    local shared_dictionary = self.shared_dictionary

    local message = "purging..."

    -- extract a list of hosts from ngx.var.args which looks something like: "host=127.0.0.1&host=example.com"
    local hosts = {}

    -- prevent an error if the args are nil
    if (ngx.var.args == nil) then
        ngx.say("please pass a host to purge")
        ngx.exit(ngx.OK)
    end

    for host in string.gmatch(ngx.var.args, "host=([^&]+)") do
        table.insert(hosts, host)
    end

    for _, host in ipairs(hosts) do
        local cached_filename = shared_dictionary:lpop(host)
        local number_of_cache_keys = tostring(shared_dictionary:llen(host))

        message = message .. "\n host: " .. host .. " number_of_cache_keys: " .. number_of_cache_keys

        while cached_filename do
            shared_dictionary:delete(cached_filename)
            local cache_file_path = cache_directory .. "/" .. cached_filename
            
            remove_file(cache_file_path)

            -- message = message .. "\n purged: " .. cache_file_path
            cached_filename = shared_dictionary:lpop(host)            
        end

    end

    ngx.say(message)
    ngx.exit(ngx.OK)
end

--- Create a new cacher instance.

function cacher.new()
    
    local function cacher_set(self, key, value)
        self[key] = value
    end

    return {
        rehydrate = cacher_rehydrate,
        purge = cacher_purge,
        set = cacher_set,
        add = cacher_add
    }
end

return cacher