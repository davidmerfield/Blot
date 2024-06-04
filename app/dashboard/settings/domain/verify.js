
// There are a few ways to point a domain to a blog on Blot
// You can create:
// A record pointing to 'ip'
// CNAME record pointing to 'host'
// ALIAS record pointing to 'host'
// Use Cloudflare or some other proxy service to forward requests to 'host'
// The goal of this function is to determine if the domain is correctly set up along any of these lines.

// If the domain is not set up correctly, we want to identify any issues and provide guidance on how to fix them.
// e.g. if there is an A record pointing to the wrong IP address, we want to tell the user to remove it.
// or if the domain is not pointing to the blog, we want to tell the user to update the CNAME record.
// We want to query the domain's nameservers to identify the DNS provider and then provide a link to the provider's
//  documentation on how to update the DNS records.

// This function should return true if any one of the following conditions are met:
// hostname resolves with an A record to the correct IP address (config.ip)
// hostname resolves with a CNAME record to the correct host (config.host)
// hostname returns the handle of the blog in the response body for a GET request to http://hostname/verify/domain-setup

// This function should raise an exception if:
// hostname's nameservers do not resolve
// hostname does not resolve to an IP address
// hostname resolves to a CNAME record that does not match config.host
// hostname resolves to different IP address(es) AND does not respond with the handle of the blog for a GET request to http://hostname/verify/domain-setup

// for every exception after the first, the exception should contain a property 'nameservers' that contains the nameserver addresses of the domain

const dns = require('dns').promises;
const fetch = require('node-fetch');

async function validate({hostname, handle, ourIP, ourHost}) {
    
    const [cnameHost, aRecordIPs, nameservers] = await Promise.all([
        // wrap dns.resolveCname in a promise which never throws, just returns null if it fails
        dns.resolveCname(hostname).then(cnames => cnames[0] || null).catch(() => null),
        dns.resolve4(hostname).catch(() => []),
        dns.resolveNs(hostname).catch(() => [])
    ]);

    if (nameservers.length === 0) {
        let e = new Error('NO_NAMESERVERS');
        e.nameservers = nameservers;
        throw e;
    }

    if (aRecordIPs.length === 1 && aRecordIPs[0] === ourIP) {
        return true;
    }

    if (aRecordIPs.includes(ourIP) && aRecordIPs.length > 1) {
        let e = new Error('MULTIPLE_ADDRESS_BUT_ONE_IS_CORRECT');
        e.recordToRemove = aRecordIPs.filter(a => a !== ourIP);
        e.nameservers = nameservers;
        throw e;
    }

    if (cnameHost && cnameHost !== ourHost) {
        let e = new Error('CNAME_RECORD_EXISTS_BUT_DOES_NOT_MATCH');
        e.nameservers = nameservers;
        throw e;
    }

    try {

        console.log('HERE', 'hostname', hostname, 'handle', handle, 'ourIP', ourIP, 'ourHost', ourHost);
        console.log('cnameHost', cnameHost, 'aRecordIPs', aRecordIPs, 'nameservers', nameservers);
        const response = await fetch(`http://${hostname}/verify/domain-setup`);
        console.log('here', text, handle);
        const text = await response.text();

        if (text === handle) {
            return true;
        } else {
            let e = new Error('HANDLE_MISMATCH');
            e.expected = handle;
            e.received = text;
            e.nameservers = nameservers;
            throw e;
        }
    } catch (err) {
        if (err.response) {
            let e = new Error('HANDLE_VERIFICATION_FAILED');
            e.status = err.response.status;
            e.nameservers = nameservers;
            throw e;
        } else {
            let e = new Error('HANDLE_VERIFICATION_REQUEST_FAILED');
            e.message = err.message;
            e.nameservers = nameservers;
            throw e;
        }
    }

    if (aRecordIPs.length === 0) {
        let e = new Error('NO_A_RECORD');
        e.nameservers = nameservers;
        throw e;
    }

    let e = new Error('UNKNOWN_ERROR');
    e.nameservers = nameservers;
    throw e;
}

module.exports = validate;