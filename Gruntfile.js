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
        'tests/*.test.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp', 'test/angular/js']
    },

    copy: {
      angular: {
        files: [
          {expand: true, cwd: 'node_modules/angular', src: ['*.js'], dest: 'test/angular/js', filter: 'isFile'},
          {expand: true, cwd: 'node_modules/angular-route', src: ['*.js'], dest: 'test/angular/js', filter: 'isFile'}
        ]
      }
    },

    // Configuration to be run (and then tested).
    crawl: {
      localhost: {
        options: {
          baseUrl: "http://127.0.0.1:9000",
          depth: 2,
          content: true,
          contentDir: 'tmp/static',
          render: true,
          renderDir: 'tmp/capture',
          sitemap: true,
          sitemapDir: 'tmp',
          exclude: ["ignore.html"]
        }
      },
      fragment: {
        options: {
          baseUrl: 'http://127.0.0.1:9000/angular/',
          content: true,
          contentDir: 'tmp/angular',
          sitemap: true,
          sitemapDir: 'tmp/angular',
          readySelector: '.main-wrapper',
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

    // Functional tests.
    nodeunit: {
      tests: ['test/*_test.js']
    },

    // Unit tests.
    mochaTest: {
        test: {
            options: {
                reporter: 'spec',
                quiet: false,
                clearRequireCache: false
            },
            src: ['tests/*.test.js']
        }
    },

    // Code coverage.
    plato: {
      options: {
        jshint: false,
        complexity: {
          ignoreerrors: true,
        }
      },
      coverage: {
        files: {
          'tmp/coverage': ['tasks/**/*.js']
        }
      }
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-plato');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  // grunt.registerTask('test', ['clean', 'connect', 'crawl:localhost', 'copy', 'crawl:fragment', 'nodeunit:tests', 'plato']);
  grunt.registerTask('test', ['clean', 'mochaTest', 'plato']);

  grunt.registerTask('coverage', 'Generate coverage report.', function() {
    var data, n;

    // Parse the JSON history file created by plato.
    if (grunt.file.exists('tmp/coverage/report.json')) {
      data = grunt.file.readJSON('tmp/coverage/report.json');

      grunt.log.subhead("Complexity");
      data.reports.forEach(function(curr) {
        grunt.log.oklns(curr.info.file + ': ' + curr.complexity.aggregate.cyclomatic);
      });
    } else {
      grunt.log.error('Unable to generate code coverage report because "tmp/coverage/report.json" is missing.');
    }
  });

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
