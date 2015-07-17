/**
 * webcrawler.js - PhantomJS based web crawler with support for #! routing.
 */

'use strict';

var phantom = require('node-phantom'),
URI = require('URIjs'),
URIFragment = require('URIjs/src/URI.fragmentURI'),
document;

function Crawler(url, depth, options) {
    var self = this;

    this.baseUrl = url;
    this.depth = depth;
    this.options = options;
    this.urls = {};
    this.crawledUrls = [];
    this.sitemap = {};
    this.phantom = null;

    this.createPhantom = function(error, ph) {
        if (error) {
            ph.exit();

            throw 'Could not create phantom instance';
        }

        self.setPhantom(ph);
    };
}

/**
 * Start node-phantom.
 *
 * @returns {this}
 */
Crawler.prototype.startPhantom = function() {

    phantom.create(this.createPhantom);
    return this;
};

/**
 * Stop node-phantom.
 *
 * @returns {this{
 */
Crawler.prototype.stopPhantom = function() {

    this.phantom.exit();
    return this;
};

/**
 * Set the phantom object.
 *
 * @param {Object} ph - The node-phantom object.
 * @returns {this}
 */
Crawler.prototype.setPhantom = function(ph) {

    this.phantom = ph;
    return this;
};

/**
 * Add url to list of urls to crawl.
 *
 * @param {String} url - valid url
 * @param {Integer} depth - the depth of the url.
 * @returns {this}
 */
Crawler.prototype.addUrl = function(url, depth) {

    this.urls[url] = {
        crawled: false,
        crawling: false,
        url: url,
        depth: depth + 1,
        content: null
    };
    return this;
};

/**
 * Get the absolute url for a given url string.
 *
 * @param {String} url - valid url.
 * @returns {String} the absolute url for url.
 */
Crawler.prototype.getAbsoluteUrl = function(url) {

    var uri = URI(url);

    if (uri.is('absolute')) {
        return uri.toString();
    }

    return this.baseUrl + url;
};

/**
 * Get the next url to crawl.
 *
 * @returns {String} the next url to crawl or an empty string.
 */
Crawler.prototype.getNextUrl = function() {

    var n, url = '';

    for (n in this.urls) {
        if (!this.urls[n].crawled && !this.urls[n].crawling) {
            url = n;
            break;
        }
    }

    return url;
};

/**
 * Determine if there are any other urls to crawl.
 *
 * @returns {boolean} true if nothing left to crawl.
 */
Crawler.prototype.doneCrawling = function() {

  var n, done = true;

  for (n in this.urls) {
      if (!this.urls[n].crawled || this.urls[n].crawling) {
          done = false;
          break;
      }
  }

  return done;
};

/**
 * Return the file name to use for the provided url.
 *
 * @param {String} url - valid url.
 * @returns {String} A relative url with html suffix.
 */
Crawler.prototype.getStaticFilename = function(url) {

    var uri = URI(url);
    var furi = uri.fragment(this.options.followFragment);
    var name = uri.pathname(true);

    if (this.options.followFragment) {
        uri.fragmentPrefix(this.options.fragmentPrefix);
        name = furi.pathname(true);
    }

    if (uri.filename().length === 0) {
        if (this.baseUrl === url) {
            name = '/index.html';
        } else {
            name = name.replace(/\/?$/, '.html');
        }
    }

    return name;
};

/**
 * Filter method to filter urls.
 *
 * @param {String} url - An url to filter out.
 * @returns {boolean}
 */
Crawler.prototype.filterUrl = function(url) {

    var ret = true;
    var uri = URI(url);

    if (this.urls[url] !== undefined && this.urls[url].crawled) {
        // Exact match aleady in crawl list.
        ret = false;
    } else if (this.baseUrl === url) {
        // Exact match to base url.
        ret = false;
    } else if (this.options.followFragment && this.options.fragmentPrefix + '/' === uri.fragment()) {
        // Fragment routing base url.
        ret = false;
    } else if (this.isUrlRelative(uri) || this.isUrlSameOrigin(uri)) {
        // Relative urls or urls of the same origin
        ret = true;
    } else {
        ret = false;
    }

    // Exclude the path based on regular expression match for user-defined list
    // of patterns.
    if (ret && this.options.exclude.length) {
        ret = this.options.exclude.reduce(function(prev, path) {
            var regex = new RegExp(path, 'i');
            if (uri.path().match(regex) !== null) {
                prev = false;
            }
            return prev;
        }, true);
    }

    return ret;
};

/**
 * Check if a given URI object is relative. Fragment and an empty route will
 * pass with URI.js method of determining relativeness, but in this case it
 * should only be considered relative if fragment routing is enabled.
 *
 * @param {URI} uri - A URI object.
 * @returns {Boolean} true if the uri is relative.
 */
Crawler.prototype.isUrlRelative = function(uri) {

    var ret = false;
    var furi = uri.fragment(this.options.followFragment);

    if (uri.is('relative')) {
        if (this.options.followFragment) {
            uri.fragmentPrefix(this.options.fragmentPrefix);

            ret = furi.pathname().length > 0 && furi.pathname() !== '/';
        } else if (uri.path().length > 0) {
            ret = true;
        }
    }

    return ret;
};

/**
 * Checks if the given URI is of the same origin as the baseUrl.
 *
 * @param {URI} uri A URI.js object.
 * @returns {Boolean} TRUE if url is the same origin as base.
 */
Crawler.prototype.isUrlSameOrigin = function (uri) {
    var baseUri = URI(this.baseUrl);

    return baseUri.normalizeProtocol().protocol() === uri.normalizeProtocol().protocol() &&
        baseUri.normalizeHostname().host() === uri.normalizeHostname().host();
};

/**
 * Render a snapshot of the page with phantom.
 *
 * @param {Object} page The page object.
 * @param {String} path The relative path of the file to snapshot.
 */
Crawler.prototype.createSnapshot = function (page, path) {
    // Only render if options set.
    if (this.options.render && undefined !== page) {
        page.render(this.options.renderDir + "/" + this.getStaticFilename(path) + ".png");
    }
};

/**
 * Crawl a url.
 *
 * @param {String} url - The absolute or relative url to crawl.
 */
Crawler.prototype.crawl = function(url) {

    var self = this;
    var currDepth = this.urls[url].depth;

    if (this.urls[url] !== undefined &&
        currDepth <= this.depth &&
        !this.urls[url].crawled) {

        console.log('Crawling ' + url + ' ...');
        this.urls[url].crawling = true;

        this.phantom.createPage(function(error, page) {

            var absoluteUrl = self.getAbsoluteUrl(url);

            if (error) {
                console.log('   ...failed to create node-phantom page.');
                return false;
            }

            page.viewportSize = {
                width: self.options.viewPortWidth,
                height: self.options.viewPortHeight
            };

            page.onConsoleMessage = function(msg) {
                console.log('    ...' + msg);
            };

            page.open(absoluteUrl, function(status) {

                var wait, waitForPage;

                if ('fail' === status) {
                    console.log('   ...failed to open page with phantom.');
                    return;
                }

                // Evaluate the page for dynamically loaded content and links.
                waitForPage = function() {
                    page.evaluate(function(s) {
                        var body;
                        var html;

                        if (s === false) {
                            html = document.documentElement && document.documentElement.outerHTML ? document.documentElement.outerHTML : "";
                        } else {
                            body = document.querySelector(s);

                            if ('ready' === body.getAttribute('data-status')) {
                                html = document.documentElement && document.documentElement.outerHTML ? document.documentElement.outerHTML : "";
                            }
                        }
                        return html;
                    }, function(error, documentHtml) {

                        var delay, waitForLinks;

                        // Document has not loaded completely yet.
                        if (documentHtml === null || error) {
                            return;
                        }

                        // Add content to url list.
                        self.urls[url].content = documentHtml;

                        // Create a snapshot.
                        self.createSnapshot(page, url);

                        clearInterval(wait);

                        // Get links from the page as well.
                        waitForLinks = function() {
                            page.evaluate(function() {

                                var nav = document.querySelector('a');

                                if (nav !== undefined) {
                                    return [].map.call(document.querySelectorAll('a'), function(link) {
                                        return link.getAttribute('href');
                                    });
                                }
                            }, function(error, links) {

                                clearTimeout(delay);

                                // No links found or error.
                                if (links === null || error) {
                                    return;
                                }

                                // Filter the urls and add each to the crawl list.
                                links.filter(self.filterUrl, self).forEach(function(curr) {
                                    if (currDepth < this.depth) {
                                        this.addUrl(curr, currDepth);
                                    }
                                }, self);

                                page.close(function() {
                                    console.log('   ...finished crawling.');
                                });
                            });
                        };

                        delay = setTimeout(waitForLinks, 1000);
                    }, self.options.readySelector);
                };

                wait = setInterval(waitForPage, 3000);

            });
        });
    }

    this.urls[url].crawling = false;
    this.urls[url].crawled = true;
};

module.exports = Crawler;
