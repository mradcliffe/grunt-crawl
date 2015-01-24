/*
 * grunt-crawl
 * https://github.com/mfradcliffe/grunt-crawl
 *
 * Copyright (c) 2014 Matthew Radcliffe
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    crawl: {
      localhost: {
        options: {
          baseUrl: "http://127.0.0.1:9000",
          depth: 2,
          content: true,
          contentDir: 'tmp/static',
          sitemap: true,
          sitemapDir: 'tmp'
        }
      },
      fragment: {
        options: {
          baseUrl: 'http://127.0.0.1:9000/angular/',
          depth: 3,
          content: true,
          contentDir: 'tmp/angular',
          sitemap: true,
          sitemapDir: 'tmp/angular',
          followFragment: true,
          fragmentPrefix: '!'
        }
      }
    },

    // Connect web server.
    connect: {
      server: {
        options: {
          hostname: '127.0.0.1',
          port: 9000,
          base: 'test',
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-connect');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'connect', 'crawl', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
