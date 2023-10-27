local cache_directory = "{{{cache_directory}}}"

-- this file will read the contents of the cache directory and store them in 
-- the lua shared dict proxy_cache_keys_by_host so we can purge them later 

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

local function extractHostFromCacheFile (cache_file_path)
    -- emit a warning with the cache_file_path
    ngx.log(ngx.NOTICE, "extracting host from cache_file_path: " .. cache_file_path)

    -- we need to read the first line of the cache file to get the host
    -- the first line is in the format:
    -- KEY: http://example.com/xyz/abc
    local file = io.open(cache_file_path, "r")
    local first_line = file:read()
    local uri = string.match(first_line, "KEY: (.*)")

    -- the protocol is included in the uri so we need to remove it
    local uri_without_protocol = string.match(uri, "://(.*)")

    -- the host is the first part of the uri, up to question mark or slash if present
    local host = string.match(uri_without_protocol, "([^/?]+)")

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

if ngx ~= nil then

    -- local purged_files = purge_host(ngx.var.arg_host)
    local proxy_cache_keys_by_host = ngx.shared.proxy_cache_keys_by_host

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
                local host = extractHostFromCacheFile(second_level_directory_path .. "/" .. file)

                -- add the host to the list of hosts
                if (hosts[host] == nil) then
                    ngx.log(ngx.NOTICE, "found host: " .. host)
                    table.insert(hosts, host)
                    hosts[host] = true
                end

                ngx.log(ngx.NOTICE, "found cache file path: " .. cache_file_path)
                proxy_cache_keys_by_host:set(cache_file_path, true)
                proxy_cache_keys_by_host:rpush(host, cache_file_path)
            end
        end
    end

    for _, host in ipairs(hosts) do
        deduplicate_key_list_by_host(host, proxy_cache_keys_by_host)
    end
end



local redis = require "resty.redis"

local redis_options = { host = "{{redis.host}}", port = 6379 , prefix = "ssl" }

local function get_redis_instance(redis_options)

  local instance = ngx.ctx.auto_ssl_redis_instance

  if instance then
    return instance
  end

  instance = redis:new()

  local ok, err

  if redis_options["socket"] then
    ok, err = instance:connect(redis_options["socket"])
  else
    ok, err = instance:connect(redis_options["host"], redis_options["port"])
  end

  if not ok then
    return false, err
  end

  if redis_options["auth"] then
    ok, err = instance:auth(redis_options["auth"])
    if not ok then
      return false, err
    end
  end

  ngx.ctx.auto_ssl_redis_instance = instance
  return instance
end

auto_ssl = (require "resty.auto-ssl").new()

auto_ssl:set("redis", redis_options)

-- Certificates are stored in redis
auto_ssl:set("storage_adapter", "resty.auto-ssl.storage_adapters.redis")

-- This function determines whether the incoming domain
-- should automatically issue a new SSL certificate.
-- I need to set domain:blot.im to foo in the database so that
-- the allow_domain function works as expected even though
-- it's not technically a user's domain
auto_ssl:set("allow_domain", function(domain)

  local certstorage = auto_ssl.storage
  
  local fullchain_pem, privkey_pem = certstorage:get_cert(domain)

  -- If we have this cert in the memory cache
  -- then return it without checking redis to save time
  if fullchain_pem then
    return true
  end

  local redis_instance, instance_err = get_redis_instance(redis_options)

  if instance_err then
    return nil, instance_err
  end

  local res, err = redis_instance:get('domain:' .. domain)

  if res == ngx.null then
    return false
  end

  return true
end)

auto_ssl:init()
