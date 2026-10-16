-- Serves the wildcard certificate (BLOT_HOST and *.BLOT_HOST) from Redis, so a
-- renewal that writes the new certificate there takes effect without anyone
-- reloading the proxy.
--
-- Redis holds two keys (written by whatever renews the certificate):
--   blot:openresty:ssl:pem   the full chain, PEM
--   blot:openresty:ssl:key   the private key, PEM
--
-- The static `ssl_certificate` file stays configured (nginx needs it to start)
-- and is the fallback: serve() changes nothing when there is no usable copy in
-- Redis, so the handshake carries on with the file.
--
-- Each handshake asks the shared dict first. Redis is read only when the copy
-- there is older than the TTL (a few minutes), by one worker at a time. If
-- that read fails, the previous Redis copy is served when there is one (it is
-- newer than the file), and for a few seconds nobody tries again, so an
-- outage costs one failed connect per backoff window, not one per handshake.
--
-- Used from proxy/config/wildcard-cert.conf and set up in init.conf.

local ssl = require "ngx.ssl"
local redis = require "resty.redis"

local _M = {}
local mt = { __index = _M }

local CERT_KEY = "blot:openresty:ssl:pem"
local PRIV_KEY = "blot:openresty:ssl:key"

-- Keys in the shared dict. der_cert and der_key never expire on their own (the
-- dict drops the least recently used entries if it is ever full); "fresh" is
-- the marker that they were read from Redis within the TTL, "down" that the
-- last read failed, and "lock" that a worker is reading now.
local FRESH = "fresh"
local DOWN = "down"
local LOCK = "lock"
local DER_CERT = "der_cert"
local DER_KEY = "der_key"

function _M.new(options)
  return setmetatable({
    dict = options.dict,
    host = options.host,
    port = options.port or 6379,
    ttl = options.ttl or 300,
    backoff = options.backoff or 10,
    timeout = options.timeout or 500,
  }, mt)
end

-- Returns the PEM chain and key. When it cannot, returns nil, why, and true if
-- Redis answered but has no (or an empty) certificate or key.
function _M:read_redis()
  local red = redis:new()
  red:set_timeouts(self.timeout, self.timeout, self.timeout)

  local ok, err = red:connect(self.host, self.port)
  if not ok then
    return nil, "cannot connect to redis: " .. tostring(err)
  end

  local res, get_err = red:mget(CERT_KEY, PRIV_KEY)
  if not res then
    -- A connection that errored or timed out is never pooled
    red:close()
    return nil, "cannot read the certificate from redis: " .. tostring(get_err)
  end

  local pooled, pool_err = red:set_keepalive(10000, 4)
  if not pooled then
    ngx.log(ngx.WARN, "wildcard cert: set_keepalive: ", pool_err)
    red:close()
  end

  local pem, key = res[1], res[2]
  if pem == ngx.null or key == ngx.null or pem == "" or key == "" then
    return nil, "no certificate or key in redis", true
  end

  return pem, key
end

-- Checks that the PEM parses and returns its DER form (which is what is
-- cached, and what each handshake sets), or nil and why.
local function parse(pem, key)
  local cert, cert_err = ssl.parse_pem_cert(pem)
  if not cert then
    return nil, "the certificate does not parse: " .. tostring(cert_err)
  end

  local priv, key_err = ssl.parse_pem_priv_key(key)
  if not priv then
    return nil, "the private key does not parse: " .. tostring(key_err)
  end

  local der_cert, der_cert_err = ssl.cert_pem_to_der(pem)
  if not der_cert then
    return nil, "the certificate does not convert: " .. tostring(der_cert_err)
  end

  local der_key, der_key_err = ssl.priv_key_pem_to_der(key)
  if not der_key then
    return nil, "the private key does not convert: " .. tostring(der_key_err)
  end

  return der_cert, der_key
end

-- Reads Redis and updates the shared dict. Only the worker holding the lock
-- calls this, and it is the only place that logs about Redis, so there is one
-- log line per backoff window.
function _M:refresh()
  local dict = self.dict

  local pem, key, missing = self:read_redis()
  local reason = key
  local der_cert, der_key

  if pem then
    der_cert, der_key = parse(pem, key)
    if not der_cert then
      reason = der_key
    end
  end

  if der_cert then
    dict:set(DER_CERT, der_cert)
    dict:set(DER_KEY, der_key)
    dict:set(FRESH, true, self.ttl)
    dict:delete(DOWN)
    return
  end

  dict:set(DOWN, true, self.backoff)

  if missing then
    -- Redis answered and has no wildcard certificate: do not keep serving an
    -- old copy of one, use the file
    dict:delete(DER_CERT)
    dict:delete(DER_KEY)
    ngx.log(ngx.WARN, "wildcard cert: ", reason, "; serving the certificate file")
  elseif dict:get(DER_CERT) then
    ngx.log(ngx.ERR, "wildcard cert: ", reason, "; serving the last copy read from redis")
  else
    ngx.log(ngx.ERR, "wildcard cert: ", reason, "; serving the certificate file")
  end
end

-- ssl_certificate_by_lua: swap in the certificate from Redis if there is one.
function _M:serve()
  local dict = self.dict

  if not dict:get(FRESH) and not dict:get(DOWN) then
    -- One worker reads Redis; the others carry on with what is cached
    if dict:add(LOCK, true, 5) then
      local ok, err = pcall(self.refresh, self)
      dict:delete(LOCK)
      if not ok then
        dict:set(DOWN, true, self.backoff)
        ngx.log(ngx.ERR, "wildcard cert: ", err, "; serving the certificate file")
      end
    end
  end

  local der_cert = dict:get(DER_CERT)
  local der_key = dict:get(DER_KEY)
  if not der_cert or not der_key then
    return
  end

  -- From here the static certificate is dropped, so a failure to set the
  -- cached one is worth knowing about: the handshake will fail.
  local ok, err = ssl.clear_certs()
  if not ok then
    ngx.log(ngx.ERR, "wildcard cert: clear_certs: ", err)
    return
  end

  ok, err = ssl.set_der_cert(der_cert)
  if not ok then
    ngx.log(ngx.ERR, "wildcard cert: set_der_cert: ", err)
    return
  end

  ok, err = ssl.set_der_priv_key(der_key)
  if not ok then
    ngx.log(ngx.ERR, "wildcard cert: set_der_priv_key: ", err)
    return
  end
end

return _M
