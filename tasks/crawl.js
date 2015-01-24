/*
 * grunt-crawl
 * https://github.com/mfradcliffe/grunt-crawl
 *
 * Copyright (c) 2014 Matthew Radcliffe
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    var Crawler = require('./webcrawler'),
    convert = require('data2xml')();

    grunt.registerMultiTask('crawl', 'Crawl a site with PhantomJS to generate sitemap.xml and static content.', function() {
        var done, crawler, wait, finishCrawl;

        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            baseUrl: 'http://localhost:9000',
            content: true,
            contentDir: 'www/static',
            sitemap: false,
            sitemapDir: 'www',
            followFragment: false,
            fragmentPrefix: '!',
            readySelector: false,
            exclude: [],
            depth: 4,
            viewportWidth: 1280,
            viewportHeight: 1024,
            waitDelay: 5000
        });

        done = this.async();

        try {
            crawler = new Crawler(options.baseUrl, options.depth, options);

            // Configure the crawler options, first url, and node-phantom.
            crawler
                .addUrl(options.baseUrl, 0)
                .startPhantom();

            finishCrawl = function() {

                var n, absoluteUrl, filePath, nextUrl;
                var sitemap = {
                    _attr: {xmlns: 'https://www.sitemaps.org/schemas/sitemap/0.9'},
                    url: []
                };

                if (!crawler.doneCrawling()) {
                    // Crawl the next url.
                    nextUrl = crawler.getNextUrl();
                    if (nextUrl.length) {
                        crawler.crawl(nextUrl);
                    } else {
                        console.log('   ...Waiting on current url...');
                    }
                } else {

                    for (n in crawler.urls) {
                        absoluteUrl = crawler.getAbsoluteUrl(n);
                        filePath = crawler.getStaticFilename(n);

                        // Write out static content for file.
                        if (options.content) {
                            grunt.file.write(options.contentDir + filePath, crawler.urls[n].content);
                        }

                        // Add to site map JSON.
                        if (options.sitemap) {
                            sitemap.url.push({
                                'loc': absoluteUrl,
                                'lastmod': grunt.template.today('yyyy-mm-dd'),
                                'priority': (1 / crawler.urls[n].depth).toFixed(1),
                                'changefreq': 'weekly'
                            });
                        }
                    }

                    // Write out sitemap.
                    if (options.sitemap) {
                        grunt.file.write(options.sitemapDir + '/sitemap.xml', convert('urlset', sitemap));
                    }

                    crawler.stopPhantom();
                    clearInterval(wait);
                    done(true);
                }

            };

            wait = setInterval(finishCrawl, options.waitDelay);
        } catch (e) {
            grunt.log.error(e);
            done(false);
        }
  });
};
