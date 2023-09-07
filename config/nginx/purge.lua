-- Delete nginx cached assets associated with a host using a PURGE request
--

function file_exists(filepath)
    local f = io.open(filepath, "r")
    if f~=nil then io.close(f) return true else return false end
end

function purge(filepath)
    if (file_exists(filepath)) then
            os.remove(filepath)
    end
end

if ngx ~= nil then
    -- local purged_files = purge_host(ngx.var.arg_host)
    local proxy_cache_keys_by_host = ngx.shared.proxy_cache_keys_by_host

    local message = "purging..."

    -- extract a list of hosts from ngx.var.args which looks something like: "host=127.0.0.1&host=example.com"
    local hosts = {}

    for host in string.gmatch(ngx.var.args, "host=([^&]+)") do
        table.insert(hosts, host)
    end

    for _, host in ipairs(hosts) do
        local cached_filename = proxy_cache_keys_by_host:lpop(host)
        local number_of_cache_keys = tostring(proxy_cache_keys_by_host:llen(host))

        message = message .. "\n host: " .. host .. " number_of_cache_keys: " .. number_of_cache_keys

        while cached_filename do
            proxy_cache_keys_by_host:delete(cached_filename)
            local cache_file_path = ngx.var.lua_cache_directory .. "/" .. cached_filename
            
            purge(cache_file_path)

            -- message = message .. "\n purged: " .. cache_file_path
            cached_filename = proxy_cache_keys_by_host:lpop(host)            
        end


    end

    ngx.say(message)
    ngx.exit(ngx.OK)
end