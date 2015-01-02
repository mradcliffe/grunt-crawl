# grunt-crawl

> PhantomJS-based web crawler with support for sitemap, static content, and fragment routing.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-crawl --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-crawl');
```

## The "crawl" task

### Overview
In your project's Gruntfile, add a section named `crawl` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  "crawl": {
    "options": {
      "baseUrl": "http://example.com",
      "content": true,
      "contentDir": "www/static",
      "readySelector": ".main-wrapper",
      "depth": 4,
      "viewportWidth": 1280,
      "viewportHeight": 1024
    },
    "angular": {
      "followFragment": true,
      "fragmentPrefix": "!",
    },
    "sitemap": {
      "sitemap": true,
      "sitemapDir": "www"
    }
  },
});
```

### Options

#### options.baseUrl
Type: `String`
Default value: `'http://localhost:9000'`

The base URL of your web site to crawl.

#### options.content
Type: `Boolean`
Default value: `true`

A boolean value where `true` will save static content for each page.

#### options.contentDir
Type: `String`
Default value: `www/static`

The directory path to save static content when content saving is enabled.

#### options.sitemap
Type: `Boolean`
Default value: `false`

A boolean value where `true` will create a sitemap.xml for your site.

### options.sitemapDir
Type: `String`
Default value: `www`

The directory path to write `sitemap.xml`.

### options.readySelector
Type: `String`
Default value: `.main-wrapper`

The selector to search for `data-status` attribute on each web page. The `data-status` attribute should be set to `"ready"`. This option is required although for static pages you can set the attribute manually to ready.

### options.depth
Type: `Integer`
Default value: `2`

The depth limit for the web crawler. Anything greater than 5 may exceed the current interval setting in the task.

### options.viewportWidth
Type: `Integer`
Default value: `1280`

The width that PhantomJS will use for its viewport.

### options.viewportHeight
Type: `Integer`
Default value: `1024`

The height that PhantomJS will use for its viewport.

### Usage Examples

#### Static Content

- @todo

#### Sitemap

- @todo

#### Fragment Routing

- @todo

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
