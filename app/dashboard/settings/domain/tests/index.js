const dns = require('dns').promises;
const fetch = require('node-fetch');
const verify = require('../verify');
const config = require('config');

xdescribe("domain verifier", function () {

    it("should throw an error for hostnames without nameservers", async () => {
        const hostname = "fhdjkhfkdjhfkjdhjfkhdjkfdjk.com";
        const handle = "example";
        const ourIP = config.ip;
        const ourHost = config.host;

        try {
            await verify({ hostname, handle, ourIP, ourHost });
            throw new Error("expected an error");
        } catch (e) {
            expect(e.message).toBe("NO_NAMESERVERS");
            expect(e.nameservers).toBeDefined();
        }
    });

    it("should return true for hostnames with correct A record", async () => {
        const hostname = "correct-a-record.com";
        const handle = "example";
        const ourIP = config.ip;
        const ourHost = config.host;

        // Mock DNS resolve
        spyOn(dns, 'resolve4').and.returnValue(Promise.resolve([ourIP]));
        spyOn(dns, 'resolveCname').and.returnValue(Promise.resolve([]));
        spyOn(dns, 'resolveNs').and.returnValue(Promise.resolve(['ns1.correct.com', 'ns2.correct.com']));

        const result = await verify({ hostname, handle, ourIP, ourHost });
        expect(result).toBe(true);
    });

    it("should throw an error for hostnames with multiple A records, one correct", async () => {
        const hostname = "multiple-a-records.com";
        const handle = "example";
        const ourIP = config.ip;
        const ourHost = config.host;

        // Mock DNS resolve
        spyOn(dns, 'resolve4').and.returnValue(Promise.resolve([ourIP, '1.2.3.4']));
        spyOn(dns, 'resolveCname').and.returnValue(Promise.resolve([]));
        spyOn(dns, 'resolveNs').and.returnValue(Promise.resolve(['ns1.multiple.com', 'ns2.multiple.com']));

        try {
            await verify({ hostname, handle, ourIP, ourHost });
            throw new Error("expected an error");
        } catch (e) {
            expect(e.message).toBe("MULTIPLE_ADDRESS_BUT_ONE_IS_CORRECT");
            expect(e.recordToRemove).toEqual(['1.2.3.4']);
            expect(e.nameservers).toBeDefined();
        }
    });

    it("should throw an error for hostnames with incorrect CNAME record", async () => {
        const hostname = "incorrect-cname-record.com";
        const handle = "example";
        const ourIP = config.ip;
        const ourHost = config.host;

        // Mock DNS resolve
        spyOn(dns, 'resolve4').and.returnValue(Promise.resolve([]));
        spyOn(dns, 'resolveCname').and.returnValue(Promise.resolve(['incorrect.host.com']));
        spyOn(dns, 'resolveNs').and.returnValue(Promise.resolve(['ns1.incorrect.com', 'ns2.incorrect.com']));

        try {
            await verify({ hostname, handle, ourIP, ourHost });
            throw new Error("expected an error");
        } catch (e) {
            expect(e.message).toBe("CNAME_RECORD_EXISTS_BUT_DOES_NOT_MATCH");
            expect(e.nameservers).toBeDefined();
        }
    });

    it("should return true for hostnames that return correct handle", async () => {
        const hostname = "correct-handle.com";
        const handle = "example";
        const ourIP = config.ip;
        const ourHost = config.host;

        // Mock DNS resolve
        spyOn(dns, 'resolve4').and.returnValue(Promise.resolve([]));
        spyOn(dns, 'resolveCname').and.returnValue(Promise.resolve([]));
        spyOn(dns, 'resolveNs').and.returnValue(Promise.resolve(['ns1.correct.com', 'ns2.correct.com']));

        // Mock HTTP request for node-fetch
        // for which .text() resolves to 'example'
        spyOn(fetch, 'default').and.returnValue(Promise.resolve({ text: () => Promise.resolve(handle) }));

        const result = await verify({ hostname, handle, ourIP, ourHost });

        expect(result).toBe(true);
    });

    it("should throw an error for hostnames that return incorrect handle", async () => {
        const hostname = "incorrect-handle.com";
        const handle = "example";
        const ourIP = config.ip;
        const ourHost = config.host;

        // Mock DNS resolve
        spyOn(dns, 'resolve4').and.returnValue(Promise.resolve([]));
        spyOn(dns, 'resolveCname').and.returnValue(Promise.resolve([]));
        spyOn(dns, 'resolveNs').and.returnValue(Promise.resolve(['ns1.incorrect.com', 'ns2.incorrect.com']));

        // Mock HTTP request
        spyOn(fetch, 'default').and.returnValue(Promise.resolve({ text: () => Promise.resolve('wrong-handle') }));

        try {
            await verify({ hostname, handle, ourIP, ourHost });
            throw new Error("expected an error");
        } catch (e) {
            expect(e.message).toBe("HANDLE_MISMATCH");
            expect(e.expected).toBe(handle);
            expect(e.received).toBe('wrong-handle');
            expect(e.nameservers).toBeDefined();
        }
    });

    it("should throw an error if HTTP request fails", async () => {
        const hostname = "request-fails.com";
        const handle = "example";
        const ourIP = config.ip;
        const ourHost = config.host;

        // Mock DNS resolve
        spyOn(dns, 'resolve4').and.returnValue(Promise.resolve([]));
        spyOn(dns, 'resolveCname').and.returnValue(Promise.resolve([]));
        spyOn(dns, 'resolveNs').and.returnValue(Promise.resolve(['ns1.request-fails.com', 'ns2.request-fails.com']));

        // Mock HTTP request to fail
        spyOn(fetch, 'default').and.returnValue(Promise.reject(new Error("Network Error")));

        try {
            await verify({ hostname, handle, ourIP, ourHost });
            throw new Error("expected an error");
        } catch (e) {
            expect(e.message).toBe("HANDLE_VERIFICATION_REQUEST_FAILED");
            expect(e.message).toContain("Network Error");
            expect(e.nameservers).toBeDefined();
        }
    });

});
