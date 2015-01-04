/**
 * webcrawler.js - PhantomJS based web crawler with support for #! routing.
 */

'use strict';

var phantom = require('node-phantom');
var URI = require('URIjs');
var URIFragment = require('URIjs/src/URI.fragmentURI');
var document;

function Crawler(url, depth) {
    var date = new Date();
    var self = this;

    this.url = url;
    this.depth = depth;
    this.crawledUrls = [];
    this.sitemapUrls = [];
    this.sitemap = null;
    this.options = {};
    this.currDate = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
    this.doneCrawling = false;
    this.urls = {};

    this.createPhantom = function(error, ph) {
        if (error) {
            ph.exit();
        }

        self.crawl(self.url, 0, ph);
    };
}

Crawler.prototype.startCrawling = function() {
    phantom.create(this.createPhantom);

    return this;
};

Crawler.prototype.stopCrawling = function() {
    if (this.ph !== undefined) {
        this.ph.exit();
    }

    return this;
};

Crawler.prototype.setUrl = function(url) {
    this.url = url;

    return this;
};

Crawler.prototype.setDepth = function(depth) {
    this.depth = depth;

    return this;
};

Crawler.prototype.setOptions = function(opts) {
    this.options = opts;

    return this;
};

Crawler.prototype.addUrl = function(url) {
    this.urls[url] = false;

    return this;
};

/**
 * Add a Url to the site map. See http://www.sitemaps.org/protocol.html.
 *
 * @param {string} url  - A valid URL.
 * @param {float} priority  - The priority of the url from 0.0 - 1.0.
 * @param {string} frequency  - The frequency to update: monthly.
 * @returns {Object} this
 */
Crawler.prototype.addUrlToSitemap = function(url, priority, frequency) {
    frequency = typeof frequency === 'undefined' ? 'monthly' : frequency;
    priority = typeof priority === 'undefined' ? 0.5 : priority;

    this.sitemapUrls.push({
        "loc": this.getAbsoluteUrl(url),
        "lastmod": this.currDate,
        "priority": priority,
        "changefreq": frequency
    });

    return this;
};

/**
 * Create an object that can be converted into sitemap.xml by data2xml.
 *
 * I looked at several options that all suck:
 *   - xmlserializer: HTML only..
 *   - xmldom: doesn't support namespaces currently.
 *   - JXON: annoying to read.
 *
 * @returns {Object} data2xml object - see https://github.com/chilts/data2xml.
 */
Crawler.prototype.createSitemap = function() {
    var url, n;
    var doc = {
        _attr: {xmlns: 'https://www.sitemaps.org/schemas/sitemap/0.9'},
        'url': []
    };

    if (this.sitemapUrls !== undefined && this.sitemapUrls.length !== null && this.sitemapUrls.length > 0) {
        for (n in this.sitemapUrls) {
            url = {
                'loc': this.sitemapUrls[n].loc,
                'lastmod': this.sitemapUrls[n].lastmod,
                'priority': this.sitemapUrls[n].priority,
                'changefreq': this.sitemapUrls[n].changefreq
            };
            doc.url.push(url);
        }
    }

    return doc;
};

/**
 * Get internal URLs on a given page.
 *
 * @param {Object} page Phantom.js page object.
 * @param {integer} depth Current crawl depth.
 * @returns {Object} this
 */
Crawler.prototype.getUrls = function(page, depth) {
    var delay, findUrls;
    var self = this;
    var intervalCount = 0;

//    findUrls = function() {
        page.evaluate(function() {
            var nav = document.querySelector('a');

            if (typeof nav !== 'undefined' || nav !== null) {
                return [].map.call(document.querySelectorAll('a'), function(link) {
                    return link.getAttribute('href');
                });
            }
        }, function(err, links) {
//            clearInterval(delay);

            // Filter links.
            links.filter(function(url) {
                if (self.urls[url]) {
                    return false;
                } else if (url === self.url) {
                    return false;
                } else if (self.options.followFragment && url === self.url + '#' + self.options.fragmentPrefix + '/') {
                    return false;
                } else if (self.isRelative(url) || self.isSameOrigin(self.url, url)) {
                    self.addUrl(url).crawl(url, depth + 1, self.ph);
                } else {
                    return false;
                }
            });
        });
/*
        intervalCount++;
        if (intervalCount > 10) {
            clearInterval(delay);
        }
    };

    delay = setInterval(findUrls, 100);
*/
    return this;
};

/**
 * Compares two URL strings to see if latter is the same origin as the former.
 *
 * @param {string} base A valid URL string.
 * @param {string} url A valid URL string to compare against base.
 * @returns {boolean} TRUE if url is the same origin as base.
 */
Crawler.prototype.isSameOrigin = function (base, url) {
    var baseUrl = URI(base);
    var linkUrl = URI(url);

    return baseUrl.normalizeProtocol().protocol() === linkUrl.normalizeProtocol().protocol() &&
           baseUrl.normalizeHostname().host() === linkUrl.normalizeHostname().host();
};

/**
 * Check if a URL string is relative or a hashbang.
 *
 * @param {string} url A valid URL string.
 * @returns {boolean} TRUE if URL is relative.
 */
Crawler.prototype.isRelative = function(url) {
    var linkUrl = URI(url);
    var furi = linkUrl.fragment(this.options.followFragment);

    if (linkUrl.is('relative')) {
        // Only use fragments when defined.
        if (this.options.followFragment) {
            linkUrl.fragmentPrefix(this.options.fragmentPrefix);

            if (furi.pathname() !== '/') {
                return true;
            }
        } else if (linkUrl.pathname() !== '') {
            return true;
        }
    }

    return false;
};

/**
 * Get the absolute URL to crawl.
 *
 * @param {string} url A valid URI including relative or fragment path.
 * @returns {string} A valid URL string.
 */
Crawler.prototype.getAbsoluteUrl = function(url) {
    var linkUrl = URI(url);

    if (linkUrl.is('absolute')) {
        return linkUrl.toString();
    }

    return this.url + url;
};

/**
 * Get the relative path of a Url.
 *
 * @param {string} url A valid URI including relative or fragment path.
 * @returns {string} A relative path to use as file name.
 */
Crawler.prototype.getRelativePath = function(url) {
    var linkUrl = URI(url);
    var furi, path;

    path = linkUrl.pathname(true);

    if (this.options.followFragment) {
        linkUrl.fragmentPrefix(this.options.fragmentPrefix);
        furi = linkUrl.fragment(true);
        path = furi.pathname(true);
    }

    // Add file suffix for path names and directories.
    if (linkUrl.filename() === "") {
        if (url === this.url) {
            path = 'index.html';
        } else {
            path = path.replace(/\/?$/, '.html');
        }
    }

    return path;
};

/**
 * Load the provided url if it is below or equal to the depth limit. And then
 * check for additional urls to recursively crawl.
 *
 * @param {string} url The url to crawl.
 * @param {integer} depth The current depth.
 * @param {Object} ph phantom object created by node-phantom.
 * @returns {Object} this
 */
Crawler.prototype.crawl = function (url, depth, ph) {
    var self = this;
    this.ph = ph;

    if (this.depth >= depth && (self.urls[url] === undefined || !self.urls[url])) {
        self.urls[url] = true;

        this.ph.createPage(function(error, page) {
            var absoluteUrl = self.getAbsoluteUrl(url);
            console.log('Crawling: ' + absoluteUrl);

            page.viewportSize = {
              width: self.options.viewportWidth,
              height: self.options.viewportHeight
            };

            page.onConsoleMessage = function(msg) {
              console.log(msg);
            };

            if (error) {
                console.log('            ....error occurred.');
                return;
            }

            return page.open(absoluteUrl, function(error, status) {
                var wait, onLoad;
                var count = 0;

                if ('fail' !== status) {

                    onLoad = function() {
                        page.evaluate(function(s) {
                            var body = document.querySelector(s);
                            if (body.getAttribute('data-status') === 'ready') {
                                return document.documentElement && document.documentElement.outerHTML ? document.documentElement.outerHTML : "";
                            }
                        }, function(err, documentHtml) {
                            var delay, waitForChildren;

                            // Clear interval.
                            clearInterval(wait);

                            if (self.options.content && documentHtml === null) {
                                return;
                            }

                            // Add content to crawled urls.
                            self.crawledUrls.push({
                                "url": url,
                                "content": self.options.content ? documentHtml : null
                            });

                            // Crawl through current page's children.
                            self.getUrls(page, depth);

                            if (depth === 0) {
                                waitForChildren = function() {
                                    var i, done = true;

                                    for (i in self.urls) {
                                        if (!self.urls[i]) {
                                            done = false;
                                        }
                                    }

                                    if (done) {
                                        clearInterval(delay);
                                        self.doneCrawling = true;
                                    }
                                };

                                delay = setInterval(waitForChildren, 1000);
                            }
                        }, self.options.readySelector);

                        count++;
                        if (count > 10) {
                            clearInterval(wait);
                        }
                    };

                    wait = setInterval(onLoad, 1000);
                } else {
                    console.log('           ...failed to load page.');
                    return;
                }

                if (error) {
                    console.log('           ...failed to load page.');
                    return;
                }
            });
        });
    } else if (depth === 0) {
        console.log('           ...finished crawling.');
        self.doneCrawling = true;
    }

    return this;
};

module.exports = Crawler;
