/**
 * @file
 * webcrawler.test.js
 */

describe("Crawler", function() {

    var chai = require("chai"),
        chaiAsPromised = require("chai-as-promised"),
        assert = chai.assert,
        Crawler;

    beforeEach(function() {
        Crawler = require("../tasks/webcrawler");

        chai.use(chaiAsPromised);
    });

    describe("#()", function() {

        var crawler;

        beforeEach(function() {

            crawler = new Crawler('http://localhost:9000');
        });

        it("should return a valid object", function() {

            assert.ok(undefined !== crawler);
        });

        it("should have a phantom property", function() {

            assert.hasOwnProperty(crawler.phantom);
        });

        it("should be configured with a URL", function() {

            assert.equal("http://localhost:9000", crawler.baseUrl);
        });

        it("should have a setPhantom function", function() {

            assert.ok(typeof crawler.setPhantom === 'function');
        });
    });

    describe("startPhantom()", function() {

        it("should return a promise to start phantom", function() {

            var crawler = new Crawler('http://localhost:9000');

            return assert.isFulfilled(crawler.startPhantom());
        });
    });

    describe("stopPhantom()", function() {

        it("should stop phantom browser", function() {

            var crawler = new Crawler('http://localhost:9000');

            crawler.startPhantom().then(function() {
                crawler.stopPhantom();

                assert.ok(null === crawler.phantom);
            });
        });

    });

    describe("addUrl()", function() {

        it("should add urls to be crawled", function() {

            var crawler = new Crawler("http://localhost:9000");
            crawler.addUrl('/people', 1);
            assert.deepEqual({
                '/people': {
                    crawled: false,
                    crawling: false,
                    url: '/people',
                    depth: 2,
                    content: null
                }
            }, crawler.urls);
        });
    });

    describe("getNextUrl()", function() {

        it("should return an empty array when all URLs crawled");

        it("should return the next URL that has not been crawled");

        it("should return the next URL that is not being crawled");
    });

    describe("getAbsoluteUrl()", function() {

        it("should return the same url if input is absolute", function() {

            var crawler = new Crawler('http://localhost:9000');
            assert.equal("http://example.com/", crawler.getAbsoluteUrl("http://example.com"));
        });

        it("should return the base url + the relative url", function() {

            var crawler = new Crawler('http://localhost:9000');
            assert.equal("http://localhost:9000/person", crawler.getAbsoluteUrl("/person"));
        });
    });

    describe("filterUrl()", function() {

        var options = {
            followFragment: false,
            fragmentprefix: '!',
            exclude: []
        };

        it ("should not filter out relative URLs", function() {

            var crawler = new Crawler('http://localhost:9000', 2, options);
            assert.ok(crawler.filterUrl('/people'));
            assert.ok(crawler.filterUrl('http://localhost:9000/people'));
        });

        it("should filter out external URLs", function() {

            var crawler = new Crawler('http://localhost:9000', 2, options);
            assert.notOk(crawler.filterUrl('http://example.com'));
        });

        it("should filter out the base URL or '/'", function() {

            var crawler = new Crawler('http://localhost:9000', 2, options);
            assert.notOk(crawler.filterUrl('http://localhost:9000'));
        });

        it("should handle fragment routes as relative URLs", function() {
            var crawler;

            options.followFragment = true;

            crawler = new Crawler('http://localhost:9000', 2, options);
            assert.notOk(crawler.filterUrl('#!/'));
            assert.ok(crawler.filterUrl('#!/people'));
            assert.ok(crawler.filterUrl('#!/people/sam'));
        });

        it("should filter out explicitly excluded URLs", function() {
            var crawler;

            options.exclude = ['/people', '/people/sam'];
            options.followFragment = false;

            crawler = new Crawler('http://localhost:9000', 2, options);
            assert.notOk(crawler.filterUrl('/people'));
            assert.notOk(crawler.filterUrl('/people/sam'));
            assert.ok(crawler.filterUrl('/about'), '/about');
        });

        // TODO: There may not be a URL that fits this pattern.
        it("should filter out in all other cases");
    });
});