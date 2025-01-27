const dns = require('dns').promises;
const nock = require('nock');
const verify = require('../verify');
const config = require('config');

describe("domain verifier", function () {

    const ourIP = config.ip;
    const ourHost = config.host;

    beforeEach(() => {
        spyOn(dns, 'resolveCname').and.callThrough();
        spyOn(dns, 'resolve4').and.callThrough();
        spyOn(dns, 'resolveNs').and.callThrough();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it("should throw an error for hostnames without nameservers", async () => {
        const hostname = "fhdjkhfkdjhfkjdhjfkhdjkfdjk.com";
        const handle = "example";

        dns.resolveCname.and.returnValue(Promise.reject(new Error("ENOTFOUND")));
        dns.resolve4.and.returnValue(Promise.reject(new Error("ENOTFOUND")));
        dns.resolveNs.and.returnValue(Promise.resolve([]));

        try {
            await verify({ hostname, handle, ourIP, ourHost });
            throw new Error("expected an error");
        } catch (e) {
            expect(e.message).toBe("NO_NAMESERVERS");
            expect(e.nameservers).toEqual([]);
        }
    });

    it("should return true for hostnames with correct A record", async () => {
        const hostname = "correct-a-record.com";
        const handle = "example";

        dns.resolveCname.and.returnValue(Promise.reject(new Error("ENOTFOUND")));
        dns.resolve4.and.returnValue(Promise.resolve([ourIP]));
        dns.resolveNs.and.returnValue(Promise.resolve(['ns1.correct.com', 'ns2.correct.com']));

        const result = await verify({ hostname, handle, ourIP, ourHost });
        expect(result).toBe(true);
    });

    it("should throw an error for hostnames with multiple A records, one correct", async () => {
        const hostname = "multiple-a-records.com";
        const handle = "example";

        dns.resolveCname.and.returnValue(Promise.reject(new Error("ENOTFOUND")));
        dns.resolve4.and.returnValue(Promise.resolve([ourIP, '1.2.3.4']));
        dns.resolveNs.and.returnValue(Promise.resolve(['ns1.multiple.com', 'ns2.multiple.com']));

        try {
            await verify({ hostname, handle, ourIP, ourHost });
            throw new Error("expected an error");
        } catch (e) {
            expect(e.message).toBe("MULTIPLE_ADDRESS_BUT_ONE_IS_CORRECT");
            expect(e.recordToRemove).toEqual(['1.2.3.4']);
            expect(e.nameservers).toEqual(['ns1.multiple.com', 'ns2.multiple.com']);
        }
    });

    it("should throw an error for hostnames with incorrect CNAME record", async () => {
        const hostname = "incorrect-cname-record.com";
        const handle = "example";

        dns.resolveCname.and.returnValue(Promise.resolve(['incorrect.host.com']));
        dns.resolve4.and.returnValue(Promise.reject(new Error("ENOTFOUND")));
        dns.resolveNs.and.returnValue(Promise.resolve(['ns1.incorrect.com', 'ns2.incorrect.com']));

        try {
            await verify({ hostname, handle, ourIP, ourHost });
            throw new Error("expected an error");
        } catch (e) {
            expect(e.message).toBe("CNAME_RECORD_EXISTS_BUT_DOES_NOT_MATCH");
            expect(e.nameservers).toEqual(['ns1.incorrect.com', 'ns2.incorrect.com']);
        }
    });

    it("should return true for hostnames with correct handle verification", async () => {
        const hostname = "correct-handle.com";
        const handle = "example";

        dns.resolveCname.and.returnValue(Promise.reject(new Error("ENOTFOUND")));
        dns.resolve4.and.returnValue(Promise.resolve(['1.2.3.4']));
        dns.resolveNs.and.returnValue(Promise.resolve(['ns1.correct.com', 'ns2.correct.com']));

        nock(`http://1.2.3.4`)
            .get(`/verify/domain-setup`)
            .reply(200, handle, { 'Content-Type': 'text/plain' });

        const result = await verify({ hostname, handle, ourIP, ourHost });
        expect(result).toBe(true);
    });

    it("should throw an error for hostnames with incorrect handle verification", async () => {
        const hostname = "incorrect-handle.com";
        const handle = "example";

        dns.resolveCname.and.returnValue(Promise.reject(new Error("ENOTFOUND")));
        dns.resolve4.and.returnValue(Promise.resolve(['1.2.3.4']));
        dns.resolveNs.and.returnValue(Promise.resolve(['ns1.incorrect.com', 'ns2.incorrect.com']));

        nock(`http://1.2.3.4`)
            .get(`/verify/domain-setup`)
            .reply(200, 'wrong-handle', { 'Content-Type': 'text/plain' });

        try {
            await verify({ hostname, handle, ourIP, ourHost });
            throw new Error("expected an error");
        } catch (e) {
            expect(e.message).toBe("HANDLE_MISMATCH");
            expect(e.expected).toBe(handle);
            expect(e.received).toBe('wrong-handle');
            expect(e.nameservers).toEqual(['ns1.incorrect.com', 'ns2.incorrect.com']);
        }
    });

    it("should throw an error if HTTP request fails", async () => {
        const hostname = "request-fails.com";
        const handle = "example";

        dns.resolveCname.and.returnValue(Promise.reject(new Error("ENOTFOUND")));
        dns.resolve4.and.returnValue(Promise.resolve(['1.2.3.4']));
        dns.resolveNs.and.returnValue(Promise.resolve(['ns1.request-fails.com', 'ns2.request-fails.com']));

        nock(`http://1.2.3.4`)
            .get(`/verify/domain-setup`)
            .replyWithError("Network Error");

        try {
            await verify({ hostname, handle, ourIP, ourHost });
            throw new Error("expected an error");
        } catch (e) {
            expect(e.message).toContain("Network Error");
            expect(e.nameservers).toEqual(['ns1.request-fails.com', 'ns2.request-fails.com']);
        }
    });

});