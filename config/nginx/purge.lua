-- Delete nginx cached assets associated with a host using a PURGE request
--

-- iterate over files in the cache directory and any child directories
-- and remove the file if the first line of the file starts with 'KEY: http://$host' or 'KEY: https://$host'
-- todo: properly parse the host so we don't purge the wrong files, e.g.
-- example.com should not purge example.com.au
function purge_host(host)
    local handle = io.popen("find " .. ngx.var.lua_cache_directory .. " -type f")
    local file_paths = handle:lines()
    local purged_files = {}

    for file_path in file_paths do

        local file = io.open(file_path, "r")
        local first_line = file:read()

        file:close()

        local is_key = first_line:sub(1, 6):find("KEY: ", 1, true) ~= nil
        local uri = first_line:sub(7)

        -- parse the host from the uri, which looks like:
        -- http://127.0.0.1:8899/favicon.ico
        -- ensure we handle ports and cases where one domain starts with another, e.g.
        -- example.com and example.com.au
        local host_matches = uri:sub(1, 8 + #host) == "http://" .. host .. ":" or
                             uri:sub(1, 8 + #host) == "http://" .. host .. "/" or
                             uri:sub(1, 9 + #host) == "https://" .. host .. ":" or
                             uri:sub(1, 9 + #host) == "https://" .. host .. "/"
        
        if (is_key and host_matches) then

            -- remove the file but dont error if it doesnt exist
            os.remove(file_path)
            
            table.insert(purged_files, file_path)
        end
    end

    -- do we need to close handle? file? both?
    handle:close()

    return purged_files
end


if ngx ~= nil then
    local purged_files = purge_host(ngx.var.arg_host)

    local message = "Purged files for ".. ngx.var.arg_host .." from ".. ngx.var.lua_cache_directory .. " – ".. #purged_files .." files purged"
    
    for _, file_name in ipairs(purged_files) do
        message = message .. "\n" .. file_name
    end

    ngx.say(message)
    ngx.exit(ngx.OK)
end