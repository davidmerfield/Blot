const dns = require('dns');
const Express = require('express');
const config = require('config');
const { parse } = require('tldts');
const Blog = require('models/blog');
const moment = require('moment');
const ip = config.ip;
const host = config.host;

const Domain = Express.Router();

Domain.use((req, res, next) => {
    res.locals.breadcrumbs.add('Domain', '/domain');
    res.locals.customDomain = req.blog.pretty.domain || req.blog.domain || req.session[req.blog.id + ':domain'];
    res.locals.subdomain = parse(res.locals.customDomain).subdomain;
    res.locals.apexDomain = parse(res.locals.customDomain).domain;
    res.locals.lastChecked = moment(req.session[req.blog.id + ':lastChecked']).fromNow();
    res.locals.domainSuccess = !!req.blog.domain && req.session[req.blog.id + ':domain'] === undefined
    res.locals.host = config.host;
    res.locals.ip = ip;
    res.edit = {};
    res.locals.addresses = (req.session[req.blog.id + ':addresses'] || []).map(address => {
        return { address };
    });
    res.locals.nsAddresses = (req.session[req.blog.id + ':nsAddresses'] || []).map(address => {
        return { address };
    });

    next();
});

Domain.route('/')
    .get((req, res) => {
        res.render('settings/domain');
    })
    .post(require('dashboard/parse'), async (req, res) => {
    
    const domainInput = req.body.domain;
    const { hostname } = parse(domainInput);

    if (!hostname) {
        return res.message(res.locals.base + '/domain/custom', new Error('Please enter a domain.'));
    }

    // remove the existing domain if it is set
    if (req.blog.domain && req.blog.domain !== domain) {
        await updateDomain(req.blog.id, '');
    }

    // store the domain in the session
    req.session[req.blog.id + ':domain'] = hostname;
    req.session.save();

    try {
        const { success, addresses, nsAddresses } = await validateDomain(hostname, req.blog.handle);

        if (success) {
            // delete the domain and address from the session
            delete req.session[req.blog.id + ':addresses'];
            delete req.session[req.blog.id + ':domain'];
            req.session.save();

            await updateDomain(req.blog.id, hostname);
            res.message(res.locals.base + '/domain/custom', 'Domain updated.');
        } else {
            // store the address in the session
            req.session[req.blog.id + ':addresses'] = addresses;
            req.session[req.blog.id + ':nsAddresses'] = nsAddresses;
            req.session[req.blog.id + ':lastChecked'] = Date.now();
            req.session.save();

            res.redirect(res.locals.base + '/domain/custom');
        }
    } catch (error) {
        console.log(error);
        res.message(res.locals.base + '/domain/custom', error);
    }
});

Domain.route('/custom')
    .get((req, res) => {
        res.locals.edit = { custom: true };
        res.render('settings/domain');
    });

Domain
    .get('/subdomain', (req, res) => {
        res.locals.edit = { subdomain: true };
        res.render('settings/domain');
    });

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

// for every exception after the first, the exception should contain a property 'nsAddresses' that contains the nameserver addresses of the domain
async function validateDomain(hostname, handle) {
    let addresses;

    try {
        // Resolve the IP address of the domain
        addresses = await dns.promises.resolve4(hostname);

        if (!addresses || !addresses.length) {
            throw new Error('The hostname does not resolve to an IP address.');
        }

        if (addresses.length > 1 && addresses.indexOf(ip) === -1) {
            throw new Error('The hostname resolves to multiple IP addresses. Please remove the incorrect record.');
        }

        if (addresses.length === 1 && addresses[0] === ip) {
            return { success: true, addresses };
        }

        const endpoint = `http://${addresses[0]}/verify/domain-setup`;

        const requestOptions = {
            method: 'GET',
            headers: {
                'Host': hostname
            }
        };

        const res = await fetch(endpoint, requestOptions);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const body = await res.text();

        if (body !== handle) {
            throw new Error('The hostname does not resolve to this blog.');
        }

        return { success: true };

    } catch (error) {

        // resolve the CNAME record of the domain
        // and check it against the 'host' variable
        const cname = await dns.promises.resolveCname(hostname);

        if (cname) {
            if (cname !== host) {
                throw new Error('The hostname resolves to a CNAME record that does not match the blog.');
            }
        }


        let nsAddresses;

        try {
            nsAddresses = await dns.promises.resolveNs(parse(hostname).domain);
        } catch (error) {
            nsAddresses = [];
            console.log(error);
        }

        return { success: false, addresses, nsAddresses };
    }
}

const updateDomain = (blogID, domain) => {
    return new Promise((resolve, reject) => {
        Blog.set(blogID, { domain, forceSSL: false, redirectSubdomain: !!domain }, function (errors, changes) {
            if (errors) return reject(errors);
            resolve(changes);
        });
    });
}

// maps NS addresses to a DNS provider, e.g. vivienne.ns.cloudflare.com -> Cloudflare
// use parse to identify the domain and subdomain
// https://web.archive.org/web/20221130010105/https://support.intermedia.com/app/articles/detail/a_id/11354/type/KB
const nameserverProviders = [
    {
        domain: '123-reg.co.uk',
        name: '123-reg',
        id: '123reg',
        URL: 'https://www.123-reg.co.uk/'
    },
    {
        domain: 'bluehost.com',
        name: 'Bluehost',
        id: 'bluehost',
        URL: 'https://www.bluehost.com/'
    },
    {
        domain: 'dnsmadeeasy.com',
        name: 'DNS Made Easy',
        id: 'dnsmadeeasy',
        URL: 'https://www.dnsmadeeasy.com/'
    },
    {
        domain: 'domain.com',
        name: 'Domain.com',
        id: 'domaincom',
        URL: 'https://www.domain.com/'
    },
    {
        domain: 'name-services.com',
        name: 'eNom',
        id: 'enom',
        URL: 'https://www.enom.com/'
    },
    {
        domain: 'cloudflare.com',
        name: 'Cloudflare',
        id: 'cloudflare',
        URL: 'https://www.cloudflare.com/'
    },
    {
        domain: 'domaincontrol.com',
        name: 'GoDaddy',
        id: 'godaddy',
        URL: 'https://www.godaddy.com/'
    },
    {
        domain: 'googledomains.com',
        name: 'Google Domains',
        id: 'googledomains',
        URL: 'https://domains.google/'
    },
    {
        domain: 'hostmonster.com',
        name: 'HostMonster',
        id: 'hostmonster',
        URL: 'https://www.hostmonster.com/'
    },
    {
        domain: 'hover.com',
        name: 'Hover',
        id: 'hover',
        URL: 'https://www.hover.com/'
    },
    {
        domain: 'gandi.net',
        name: 'Gandi',
        id: 'gandi',
        URL: 'https://www.gandi.net/'
    },
    {
        domain: 'mediatemple.net',
        name: 'Media Temple',
        id: 'mediatemple',
        URL: 'https://mediatemple.net/'
    },
    {
        domain: 'rackspace.com',
        name: 'Rackspace',
        id: 'rackspace',
        URL: 'https://www.rackspace.com/'
    },
    {
        domain: 'register.com',
        name: 'Register.com',
        id: 'registercom',
        URL: 'https://www.register.com/'
    },
    {
        domain: 'registrar-servers.com',
        name: 'Namecheap',
        id: 'namecheap',
        URL: 'https://www.namecheap.com/'
    },
    {   
        domainRegEx: /awsdns-\d+.com/,
        name: 'Amazon Web Services',
        id: 'aws',
        URL: 'https://aws.amazon.com/'
    }
];


const identifyNameServers = (nsAddresses) => {
    const domains = nsAddresses.map(address => parse(address).domain);
    // attempt to match the domain name to a provider either by domain or domainMatch
    return nameserverProviders.find(provider => {

        if (provider.domain && domains.includes(provider.domain)) {
            return true;
        }

        if (provider.domainRegEx && domains.some(domain => provider.domainRegEx.test(domain))) {
            return true;
        }

        return false;
    });
}

module.exports = Domain;

