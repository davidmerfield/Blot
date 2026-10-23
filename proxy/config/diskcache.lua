-- A response cache on disk that any number of OpenResty instances on the same
-- host can share, with no index. Prototype, behind the disk_cache build flag
-- (see reverse-proxy-cache.conf); proxy_cache and cacher.lua stay the default.
--
-- Layout, under the cache directory:
--
--   <a>/<bc>/<host>/<key>.meta         status, headers, the variants stored
--   <a>/<bc>/<host>/<key>.<id>         the body as Node sent it
--   <a>/<bc>/<host>/<key>.<id>.br      written after the fill, for
--   <a>/<bc>/<host>/<key>.<id>.gz      compressible types only
--   <a>/<bc>/<host>/.tmp/              fills and compressions in progress
--   <a>/<bc>/<host>.purged             time of the host's last purge
--   .trash/                            purged host directories, being removed
--
-- <key> is md5(cache key) and <a>/<bc> are the last characters of md5(host),
-- as nginx's levels=1:2. <id> names one fill, so a compression that finishes
-- after a refill can never be served with the new metadata.
--
-- A hit reads the .meta file, sets its headers and leaves the body to
-- try_files in the same location, which sends it with sendfile (an internal
-- redirect cost ~6us a hit); a compressed copy is sent as it is, so a hit
-- costs no compression. A miss streams Node's response into .tmp and publishes it
-- with rename, which is atomic, so another instance sees either the old entry
-- or the new one.
--
-- A purge writes <host>.purged, then renames the host directory into .trash.
-- Every writer checks <host>.purged after its last rename and deletes what it
-- published if a purge happened since it started, so a response fetched
-- before a purge cannot survive it.

local ffi = require("ffi")
local cjson = require("cjson.safe")
local resty_lock = require("resty.lock")
local ngx_pipe = require("ngx.pipe")

local diskcache = {}
diskcache.__index = diskcache

-- Statuses cached, as proxy_cache_valid does today
local CACHEABLE = { [200] = true, [301] = true, [302] = true, [400] = true, [404] = true }

-- Upstream headers that are not sent again on a hit. Content-Length, ETag
-- and Last-Modified come from the file being served instead.
local SKIP_HEADERS = {
    ["connection"] = true,
    ["keep-alive"] = true,
    ["transfer-encoding"] = true,
    ["content-length"] = true,
    ["date"] = true,
    ["set-cookie"] = true,
    ["etag"] = true,
    ["last-modified"] = true,
    ["accept-ranges"] = true,
    ["vary"] = true,
    -- set by this proxy, not Node
    ["blot-cache"] = true,
    ["blot-server"] = true,
    ["blot-upstream"] = true,
    ["x-content-type-options"] = true,
}

-- Types worth storing compressed: gzip_types and brotli_types in
-- static-file.conf, less the ones that hardly shrink
local COMPRESSIBLE = {
    ["text/html"] = true,
    ["text/css"] = true,
    ["text/plain"] = true,
    ["text/xml"] = true,
    ["text/javascript"] = true,
    ["text/markdown"] = true,
    ["text/calendar"] = true,
    ["text/vtt"] = true,
    ["application/javascript"] = true,
    ["application/x-javascript"] = true,
    ["application/json"] = true,
    ["application/ld+json"] = true,
    ["application/manifest+json"] = true,
    ["application/xml"] = true,
    ["application/xhtml+xml"] = true,
    ["application/rss+xml"] = true,
    ["application/atom+xml"] = true,
    ["application/rdf+xml"] = true,
    ["application/wasm"] = true,
    ["image/svg+xml"] = true,
    ["image/x-icon"] = true,
    ["image/vnd.microsoft.icon"] = true,
    ["font/ttf"] = true,
    ["font/otf"] = true,
    ["font/eot"] = true,
}

-- Smaller bodies are not compressed (gzip_min_length)
local MIN_COMPRESS = 256

-- How long a miss waits for another request filling the same key
local LOCK_TIMEOUT = 15

function diskcache.new(options)
    return setmetatable({
        directory = options.directory,
        locks = options.locks,
        -- the internal location that serves stored bodies, ending in /
        location = options.location or "/__diskcache/",
        -- the compression queue's shared dict, and its length limit
        queue = options.queue,
        queue_max = options.queue_max or 10000,
    }, diskcache)
end

local function host_name(host)
    if #host <= 253 and host:match("^[%w%.%-]+$") then
        return host
    end

    return ngx.md5(host)
end

-- The host's directory relative to the cache directory, and its purge marker
local function host_path(host)
    local hash = ngx.md5(host)
    local shard = hash:sub(-1) .. "/" .. hash:sub(-3, -2) .. "/"
    local name = host_name(host)

    return shard .. name, shard .. name .. ".purged"
end

local function read_file(path)
    local file = io.open(path, "rb")

    if not file then
        return nil
    end

    local data = file:read("*a")
    file:close()

    return data
end

local function write_file(path, data)
    local file, err = io.open(path, "wb")

    if not file then
        return nil, err
    end

    local ok, write_err = file:write(data)
    file:close()

    if not ok then
        os.remove(path)
        return nil, write_err
    end

    return true
end

ffi.cdef([[int mkdir(const char *path, unsigned int mode);]])

-- mkdir -p without a child process: header filters cannot yield
local function mkdir_p(path)
    local partial = ""

    for part in path:gmatch("[^/]+") do
        partial = partial .. "/" .. part
        -- EEXIST is the common case and fine
        ffi.C.mkdir(partial, 493) -- 0755
    end
end

local function random_id()
    return string.format("%x%06x", ngx.now() * 1000, math.random(0, 0xffffff))
end

-- Time of the host's last purge, or 0
local function purged_at(self, marker)
    local data = read_file(self.directory .. "/" .. marker)

    return tonumber(data) or 0
end

-- Which stored copy suits the request's Accept-Encoding
local function pick_encoding(meta)
    local accept = ngx.var.http_accept_encoding

    if not accept or not meta.v then
        return nil
    end

    if meta.v.br and accept:find("br", 1, true) and not accept:find("br;q=0", 1, true) then
        return "br"
    end

    if meta.v.gz and accept:find("gzip", 1, true) and not accept:find("gzip;q=0", 1, true) then
        return "gz"
    end
end

local function send_headers(meta)
    for _, pair in ipairs(meta.h) do
        ngx.header[pair[1]] = pair[2]
    end
end

-- Serve the entry if there is one. Returns true when the request was handled.
-- A 200 is left for try_files to send (see reverse-proxy-cache.conf), or
-- with jump, sent from the internal locations.
local function serve_hit(self, dir, key, jump)
    local data = read_file(self.directory .. "/" .. dir .. "/" .. key .. ".meta")

    if not data then
        return false
    end

    local meta = cjson.decode(data)

    if not meta then
        return false
    end

    local body = dir .. "/" .. key .. "." .. meta.id

    if meta.s ~= 200 then
        -- redirects and error pages: small, and the static module only
        -- sends a 200, so print them. No body file means the sweeper
        -- removed the entry after its metadata was read: a miss.
        local content = read_file(self.directory .. "/" .. body)

        if not content then
            return false
        end

        ngx.header["Blot-Cache"] = "HIT"
        send_headers(meta)
        ngx.status = meta.s

        if #content > 0 and ngx.req.get_method() ~= "HEAD" then
            ngx.print(content)
        else
            ngx.send_headers()
        end

        return ngx.exit(ngx.HTTP_OK)
    end

    ngx.header["Blot-Cache"] = "HIT"
    send_headers(meta)

    local encoding = pick_encoding(meta)

    if meta.v and (meta.v.br or meta.v.gz) then
        ngx.header["Vary"] = "Accept-Encoding"
    end

    if encoding then
        -- the gzip and brotli filters leave a response with a
        -- Content-Encoding alone
        ngx.header["Content-Encoding"] = encoding == "br" and "br" or "gzip"
        body = body .. "." .. encoding
    end

    if jump then
        return ngx.exec(self.location .. (encoding and "encoded/" or "plain/") .. body)
    end

    ngx.var.diskcache_path = "/" .. body

    return true
end

-- access_by_lua in the cached location: serve a hit, otherwise try_files
-- passes the request to @diskcache_fill
function diskcache.access(self)
    local method = ngx.req.get_method()

    if method ~= "GET" and method ~= "HEAD" then
        return
    end

    local dir = host_path(ngx.var.host)

    serve_hit(self, dir, ngx.md5(ngx.var.cache_key))
end

-- access_by_lua in @diskcache_fill: wait for a fill of the same key in
-- progress and serve that, or let the request through to Node and record it
function diskcache.fill(self)
    -- HEAD has no body to store
    if ngx.req.get_method() ~= "GET" then
        ngx.ctx.diskcache = { skip = true }
        return
    end

    local dir, marker = host_path(ngx.var.host)
    local key = ngx.md5(ngx.var.cache_key)
    local lock = resty_lock:new(self.locks, { exptime = 60, timeout = LOCK_TIMEOUT })
    local elapsed = lock and lock:lock(dir .. "/" .. key)

    if elapsed and elapsed > 0 then
        -- another request in this instance filled it while we waited
        lock:unlock()

        if serve_hit(self, dir, key, true) then
            return
        end

        elapsed = lock:lock(dir .. "/" .. key)
    end

    -- An error_page redirect (an intercepted 500, or nginx's own 502 when
    -- Node is down) clears ngx.ctx before log_by_lua runs, but keeps
    -- variables, so the lock is named here for diskcache:release()
    if elapsed then
        ngx.var.diskcache_lock = dir .. "/" .. key
    end

    ngx.ctx.diskcache = {
        dir = dir,
        marker = marker,
        key = key,
        started = ngx.now(),
    }
end

-- header_filter_by_lua: decide whether the response from Node is stored
function diskcache.header_filter(self)
    local fill = ngx.ctx.diskcache

    if not fill then
        return
    end

    -- add_header in reverse-proxy-base.conf leaves Blot-Cache out, since
    -- $upstream_cache_status is empty without proxy_cache
    ngx.header["Blot-Cache"] = "MISS"

    if fill.skip then
        return
    end

    local status = ngx.status

    -- ngx.var.upstream_status is unset when nginx answered itself (an
    -- intercepted error page)
    if not CACHEABLE[status] or ngx.var.upstream_status == nil then
        fill.skip = true
        return
    end

    local headers = {}

    for name, value in pairs(ngx.resp.get_headers(100, true)) do
        if not SKIP_HEADERS[name:lower()] then
            if type(value) == "table" then
                for _, v in ipairs(value) do
                    table.insert(headers, { name, v })
                end
            else
                table.insert(headers, { name, value })
            end
        end
    end

    local directory = self.directory .. "/" .. fill.dir

    fill.id = random_id()
    fill.tmp = directory .. "/.tmp/" .. fill.key .. "." .. fill.id
    fill.length = tonumber(ngx.header["Content-Length"])
    fill.type = (ngx.header["Content-Type"] or ""):match("^[^;%s]+")
    fill.meta = { s = status, h = headers, id = fill.id, k = ngx.var.cache_key, t = fill.started }

    local file = io.open(fill.tmp, "wb")

    if not file then
        mkdir_p(directory .. "/.tmp")
        file = io.open(fill.tmp, "wb")
    end

    if not file then
        ngx.log(ngx.ERR, "diskcache: cannot write ", fill.tmp)
        fill.skip = true
        return
    end

    fill.file = file
    fill.size = 0
end

-- body_filter_by_lua: stream the body into the temporary file, whatever its
-- size. Writes go to the page cache, so they do not wait on the disk.
function diskcache.body_filter(self)
    local fill = ngx.ctx.diskcache

    if not fill or fill.skip or not fill.file then
        return
    end

    local chunk, eof = ngx.arg[1], ngx.arg[2]

    if chunk and #chunk > 0 then
        local ok = fill.file:write(chunk)

        if not ok then
            fill.failed = true
            fill.file:close()
            fill.file = nil
            os.remove(fill.tmp)
            return
        end

        fill.size = fill.size + #chunk
    end

    if eof then
        fill.complete = true
    end
end

local function discard_if_purged(self, fill, paths)
    if purged_at(self, fill.marker) >= fill.started then
        for _, path in ipairs(paths) do
            os.remove(path)
        end
        return true
    end
end

-- Whether an entry's body is worth storing compressed
local function compressible(meta, size)
    if size < MIN_COMPRESS then
        return false
    end

    for _, pair in ipairs(meta.h) do
        if pair[1]:lower() == "content-type" then
            return COMPRESSIBLE[pair[2]:match("^[^;%s]+")] == true
        end
    end

    return false
end

local function file_size(path)
    local file = io.open(path, "rb")

    if not file then
        return nil
    end

    local size = file:seek("end")
    file:close()

    return size
end

-- Point an entry's metadata at its stored copies (v), if it still names the
-- same fill: the key may have been purged and filled again meanwhile. A
-- refill landing between the read and the rename loses its metadata, which
-- is a miss, not a stale page; a purge in that gap is caught by the check
-- after the rename.
local function update_variants(self, job, id, variants)
    local base = self.directory .. "/" .. job
    local meta = cjson.decode(read_file(base .. ".meta") or "")

    if not meta or meta.id ~= id then
        return
    end

    meta.v = variants

    local tmp = base:match("^(.*)/") .. "/.tmp/" .. job:match("[^/]+$") .. "." .. id .. ".meta"

    if not write_file(tmp, cjson.encode(meta)) then
        return
    end

    if not os.rename(tmp, base .. ".meta") then
        os.remove(tmp)
        return
    end

    -- <dir>.purged, beside the host directory
    if purged_at(self, job:match("^(.*)/") .. ".purged") >= meta.t then
        os.remove(base .. ".meta")
    end
end

-- Store gzip and brotli copies of an entry's body, then point its metadata
-- at them. job is the entry's path under the cache directory without
-- .meta: <a>/<bc>/<host>/<key>. Called by the compressors worker 0 runs.
local function compress(self, job)
    local base = self.directory .. "/" .. job
    local meta = cjson.decode(read_file(base .. ".meta") or "")

    -- purged, evicted, or done already
    if not meta or meta.v then
        return
    end

    local body = base .. "." .. meta.id
    local size = file_size(body)

    if not size then
        return
    end

    if not compressible(meta, size) then
        -- an entry from before v was written at fill time, which the
        -- sweeper queued: record that it has no copies to make
        return update_variants(self, job, meta.id, {})
    end

    local tmp = base:match("^(.*)/") .. "/.tmp/" .. job:match("[^/]+$") .. "." .. meta.id

    -- niced, so serving wins when the CPU is busy
    local commands = {
        br = { "nice", "-n", "10", "brotli", "-q", "11", "-f", "-o", tmp .. ".br", body },
        gz = { "nice", "-n", "10", "sh", "-c", 'gzip -9 -n -c "$1" > "$2"', "sh", body, tmp .. ".gz" },
    }

    for _, encoding in ipairs({ "br", "gz" }) do
        local proc = ngx_pipe.spawn(commands[encoding])
        local ok = false

        if proc then
            -- brotli 11 on a large page takes seconds
            proc:set_timeouts(nil, nil, nil, 300000)
            ok = proc:wait() and os.rename(tmp .. "." .. encoding, body .. "." .. encoding)
        end

        if not ok then
            if proc then
                proc:kill(9)
            end
            os.remove(tmp .. ".br")
            os.remove(tmp .. ".gz")
            ngx.log(ngx.ERR, "diskcache: could not compress ", body)
            return
        end
    end

    update_variants(self, job, meta.id, { br = true, gz = true })
end

-- Queue an entry for compress(). Returns false if the queue is full; the
-- entry is then compressed on the fly until the sweeper queues it again.
local function enqueue(self, job)
    local queue = ngx.shared[self.queue]

    if queue:llen("jobs") >= self.queue_max then
        return false
    end

    -- already waiting
    if not queue:add("queued:" .. job, true, 86400) then
        return true
    end

    if not queue:rpush("jobs", job) then
        queue:delete("queued:" .. job)
        return false
    end

    return true
end

-- One of worker 0's compressors: takes entries off the queue until the
-- worker exits. The queue is a shared dict, so it survives a reload and the
-- new worker 0 carries on with it.
local function compressor(premature, self)
    if premature then
        return
    end

    local queue = ngx.shared[self.queue]

    while not ngx.worker.exiting() do
        local job = queue:lpop("jobs")

        if job then
            queue:delete("queued:" .. job)

            local ok, err = pcall(compress, self, job)

            if not ok then
                ngx.log(ngx.ERR, "diskcache: compressing ", job, ": ", err)
            end
        else
            ngx.sleep(0.25)
        end
    end
end

-- Release the fill lock this request holds, if any. Called from log_by_lua
-- in @diskcache_fill and, for a request an error_page redirected elsewhere,
-- from the log_by_lua every other location inherits from http.conf.
function diskcache.release(self)
    local key = ngx.var.diskcache_lock

    if key and key ~= "" then
        ngx.shared[self.locks]:delete(key)
        ngx.var.diskcache_lock = ""
    end
end

-- log_by_lua: publish a complete fill, release the lock, queue compression
function diskcache.log(self)
    local fill = ngx.ctx.diskcache

    if not fill then
        return
    end

    -- published or not, requests waiting on the lock then go ahead: they
    -- find the entry or fetch it themselves
    local function done()
        self:release()
    end

    if fill.skip or not fill.file then
        return done()
    end

    fill.file:close()
    fill.file = nil

    local directory = self.directory .. "/" .. fill.dir
    local body = directory .. "/" .. fill.key .. "." .. fill.id
    local meta_path = directory .. "/" .. fill.key .. ".meta"

    -- a response cut short (Node or the client went away) is not stored
    local truncated = not fill.complete or fill.failed
        or (fill.length and fill.length ~= fill.size)
        -- the last upstream tried, after a retry ("502, 200")
        or (ngx.var.upstream_status or ""):match("(%d+)$") ~= tostring(ngx.status)

    if truncated then
        os.remove(fill.tmp)
        return done()
    end

    -- the body first, then the metadata that points at it
    if not os.rename(fill.tmp, body) then
        os.remove(fill.tmp)
        return done()
    end

    -- v lists the stored copies: none yet, or none to make, which tells
    -- the sweeper's backfill to leave the entry alone
    fill.compress = fill.size >= MIN_COMPRESS and COMPRESSIBLE[fill.type] == true

    if not fill.compress then
        fill.meta.v = {}
    end

    local tmp_meta = fill.tmp .. ".meta"

    if not write_file(tmp_meta, cjson.encode(fill.meta)) or not os.rename(tmp_meta, meta_path) then
        os.remove(tmp_meta)
        os.remove(body)
        return done()
    end

    -- the previous fill's body and copies are left for the sweeper

    done()

    if discard_if_purged(self, fill, { meta_path, body }) then
        return
    end

    if fill.compress and not enqueue(self, fill.dir .. "/" .. fill.key) then
        ngx.log(ngx.WARN, "diskcache: compression queue full, ", fill.dir, "/", fill.key, " waits for the sweeper")
    end
end

-- The /purge endpoint, ?host=a&host=b as cacher.lua's
function diskcache.purge(self)
    local args = ngx.var.args

    if not args then
        ngx.say("please pass host to purge as an argument")
        return ngx.exit(ngx.OK)
    end

    local message = {}
    local trash = self.directory .. "/.trash"

    for host in args:gmatch("host=([^&]+)") do
        local dir, marker = host_path(host)
        local stamp = string.format("%.3f", ngx.now())

        -- the marker first, so a fill that publishes after the rename below
        -- finds it
        -- the shard directory may not exist yet, with a fill of this host
        -- in flight that must still find the marker
        mkdir_p(self.directory .. "/" .. marker:match("^(.*)/"))

        local tmp_marker = self.directory .. "/" .. marker .. "." .. random_id()
        local ok = write_file(tmp_marker, stamp)
            and os.rename(tmp_marker, self.directory .. "/" .. marker)

        if not ok then
            os.remove(tmp_marker)
            ngx.log(ngx.ERR, "diskcache: could not write the purge marker for ", host)
            table.insert(message, host .. ": failed")
        else
            local target = trash .. "/" .. host_name(host) .. "." .. random_id()
            local moved = os.rename(self.directory .. "/" .. dir, target)

            if not moved then
                mkdir_p(trash)
                moved = os.rename(self.directory .. "/" .. dir, target)
            end

            table.insert(message, host .. ": " .. (moved and "purged" or "0"))
        end
    end

    -- the trash is emptied in the background
    ngx.timer.at(0, function()
        local proc = ngx_pipe.spawn({ "find", trash, "-mindepth", "1", "-maxdepth", "1", "-exec", "rm", "-rf", "{}", "+" })
        if proc then
            proc:set_timeouts(nil, nil, nil, 600000)
            proc:wait()
        end
    end)

    if #message == 0 then
        ngx.say("no hosts were purged")
    else
        ngx.say(table.concat(message, "\n"))
    end

    return ngx.exit(ngx.OK)
end

-- Called from init_worker_by_lua. Worker 0 runs the compressors and, every
-- options.interval seconds, the sweeper (proxy/evict.sh). Each container
-- sharing the cache runs one sweeper; the script's flock lets one sweep at a
-- time. The sweeper prints "queue <entry>" for entries whose compressed
-- copies were never made (the queue lives in memory, so a restart loses
-- it), and they are queued again here.
function diskcache.start(self, options)
    if ngx.worker.id() ~= 0 then
        return
    end

    for _ = 1, options.compressors or 2 do
        ngx.timer.at(0, compressor, self)
    end

    if not options.sweeper then
        return
    end

    local command = {
        options.sweeper,
        self.directory,
        tostring(options.max_bytes),
        tostring(options.max_filesystem_percent or 90),
    }

    local function sweep(premature)
        if premature then
            return
        end

        local proc, err = ngx_pipe.spawn(command)

        if not proc then
            ngx.log(ngx.ERR, "diskcache: could not start the sweeper: ", err)
            return
        end

        -- a sweep of a large cache can take minutes; well under an interval
        local timeout = options.interval * 1000
        proc:set_timeouts(nil, timeout, timeout, timeout)

        local queued, full = 0, 0

        while true do
            local line, read_err = proc:stdout_read_line()

            if not line then
                if read_err ~= "closed" then
                    proc:kill(9)
                    ngx.log(ngx.ERR, "diskcache: reading the sweeper failed: ", read_err)
                    return
                end
                break
            end

            local job = line:match("^queue (.+)$")

            if job then
                if enqueue(self, job) then
                    queued = queued + 1
                else
                    full = full + 1
                end
            else
                ngx.log(ngx.NOTICE, "diskcache: ", line, " queued=", queued, " queue_full=", full)
            end
        end

        local stderr = proc:stderr_read_all() or ""
        local ok, reason, status = proc:wait()

        if not ok then
            ngx.log(ngx.ERR, "diskcache: sweeper ", tostring(reason), " ", tostring(status), ": ", stderr:sub(1, 500))
        end
    end

    ngx.timer.every(options.interval, sweep)
end

return diskcache
