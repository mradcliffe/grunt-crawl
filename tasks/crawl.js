/*
 * grunt-crawl
 * https://github.com/mfradcliffe/grunt-crawl
 *
 * Copyright (c) 2014 Matthew Radcliffe
 * Licensed under the MIT license.
 */

'use strict';

var Crawler = require('./webcrawler');
var convert = require('data2xml')();
var options;
var done;

module.exports = function(grunt) {

    grunt.registerMultiTask('crawl', 'Crawl a site with PhantomJS to generate sitemap.xml and static content.', function() {
        var crawler, wait, finishCrawl, sitemapxml;

        // Merge task-specific and/or target-specific options with these defaults.
        options = this.options({
            baseUrl: 'http://localhost:9000',
            content: true,
            contentDir: 'www/static',
            sitemap: false,
            sitemapDir: 'www',
            followFragment: false,
            fragmentPrefix: '!',
            readySelector: '.main-wrapper',
            depth: 4,
            viewportWidth: 1280,
            viewportHeight: 1024,
            waitDelay: 10000
        });

        done = this.async();

        try {
            crawler = new Crawler(options.baseUrl, options.depth);

            // Setup options onto crawler object.
            crawler.setOptions(options).startCrawling();

            finishCrawl = function() {
                // Do the file operations now.
                if (crawler.doneCrawling) {
                    clearInterval(wait);
                    crawler.stopCrawling();

                    if (crawler.crawledUrls.length !== null && crawler.crawledUrls.length > 0) {

                        crawler.crawledUrls.forEach(function(page) {
                            var relativeUrl = crawler.getRelativePath(page.url);
                            var absoluteUrl = crawler.getAbsoluteUrl(page.url);

                            // Save static content.
                            if (options.content) {
                                grunt.file.write(options.contentDir + relativeUrl, page.content);
                                grunt.log.ok(" - Content: " + options.contentDir + relativeUrl);
                            }

                            // Add to sitemap urls.
                            if (options.sitemap) {
                                crawler.addUrlToSitemap(absoluteUrl);
                            }
                        });

                        // Generate and save sitemap.
                        if (options.sitemap) {
                            crawler.sitemap = crawler.createSitemap();

                            sitemapxml = convert('urlset', crawler.sitemap);
                            grunt.file.write(options.sitemapDir + '/sitemap.xml', sitemapxml);
                            grunt.log.ok(' - Sitemap: ' + options.sitemapDir + '/sitemap.xml');
                        }
                    }

                    // Finish asynchronous task.
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
