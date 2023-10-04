package.path = package.path .. ";{{{config_directory}}}/?.lua"

local md5 = require "md5"

if ngx ~= nil then
    local proxy_cache_keys_by_host = ngx.shared.proxy_cache_keys_by_host

    local host = ngx.var.host
    local request_uri = ngx.var.request_uri
    local scheme = ngx.var.scheme

    local cache_key = scheme .. "://" .. host .. request_uri
    local cache_key_md5 = md5.sumhexa(cache_key)

    -- the cache file path is in the following format:
    -- $x/$y/$cache_key_md5
    -- where x is the last character of the cache_key_md5
    -- and y are the two characters before that
    local cache_file_path = cache_key_md5:sub(-1) .. "/" .. cache_key_md5:sub(-3,-2) .. "/" .. cache_key_md5

    -- ngx.log(ngx.ERR, "ADDING cache_file_path: " .. cache_file_path)
   
    local already_stored = proxy_cache_keys_by_host:get(cache_file_path)

    if (already_stored == nil) then
        proxy_cache_keys_by_host:rpush(host, cache_file_path)
        proxy_cache_keys_by_host:set(cache_file_path, true)
    end
end
