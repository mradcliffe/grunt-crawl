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
  crawl: {
    live: {
      options: {
        baseUrl: "http://example.com",
        content: true,
        contentDir: "www/static",
        depth: 4,
        viewportWidth: 1280,
        viewportHeight: 1024,
        waitDelay: 10000,
        exclude: []
      }
    }
  }
});
```

### Options

#### options.baseUrl
Type: `String`
Default value: `'http://localhost:9000/'`

The base URL of your web site to crawl. A trailing `/` should be included.

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

#### options.sitemapDir
Type: `String`
Default value: `www`

The directory path to write `sitemap.xml`.

#### options.followFragment
Type: `Boolean`
Default value: `false`

A boolean value where `true` will crawl fragment routes as well.

#### options.fragmentPrefix
Type: `String`
Default value: `!`

The fragment prefix to use for fragment routing. `!` will look for routes similar to `#!/`. See below for more details.

#### options.readySelector
Type: `Boolean`|`String`
Default value: `false`

An optional argument to specify a selector to search for `data-status` attribute on each web page. The `data-status` attribute should be set to `"ready"`.

#### options.depth
Type: `Integer`
Default value: `4`

The depth limit for the web crawler. Anything greater than 5 may exceed the default waitDelay option.

#### options.viewportWidth
Type: `Integer`
Default value: `1280`

The width that PhantomJS will use for its viewport.

#### options.viewportHeight
Type: `Integer`
Default value: `1024`

The height that PhantomJS will use for its viewport.

#### options.waitDelay
Type: `Integer`
Default value: `10000`

An interval in seconds to wait for crawling to finish. Useful for larger sites with lots to crawl, particularly Angular sites with complex and dynamic content binding.

#### options.exclude
Type: `Array`
Default value: `[]`

Define relative URI patterns to exclude from being crawled. This is useful for ignoring file downloads.

### Usage Examples

- Any same origin url will be crawled once including:
   - relative (e.g. `about.html`)
   - absolute urls (e.g. `http://example.com/about.html`)
   - fragment-routing urls (e.g. `http://example.com/#!/about`)

#### Data Status / Ready Selector

The general idea behind this is that if your site requires Javascript to fill-in content or other data, then a crawler must wait until the page has finished loading. Thus your site should set the `data-status` attribute to `ready` for the selector defined in `options.readySelector`.

##### An AngularJS example:

Inside app.run:
```js
$rootScope.ready = function() {
  var $scope = _getTopScope();
  $scope.status = 'ready';
  if (!$scope.$$phase) $scope.$apply();
}

$rootScope.loading = function() {
  var $scope = _getTopScope();
  $scope.status = 'loading';
  if (!$scope.$$phase) $scope.$apply();
}
```

In controller:
```js
$scope.ready();
```

In index.html:
```html
<div ng-view class="main-wrapper" data-status="{{status}}"></div>
```

#### Sitemap

```js
grunt.initConfig({
  "crawl": {
    "sitemap": {
      "sitemap": true,
      "sitemapDir": "www"
    }
  }
}
```

- Todo: provide a way to prioritize routes. All priorities set the same. Possibly auto-adjust by depth?
- Todo: provide a better last modification time. Currently all urls will have last modifications updated at the same time.

#### Fragment Routing

AngularJS and other Javascript apps that depend on fragment routing are supported. Fragment-based routes will be saved as static content, if enabled, with the content file having the `.html` suffix.

```js
grunt.initConfig({
  "crawl": {
    "myapp": {
      "followFragment": true,
      "fragmentPrefix": "!"
    }
  }
}
```

Rewrite rules for fragment route to static content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On

  # Search Engine rewrite
  RewriteCond %{QUERY_STRING} ^_escaped_fragment_=/?$
  RewriteRule ^.*$ /static/index.html [NC,L]

  RewriteCond %{REQUEST_URI} index\.html$
  RewriteCond %{QUERY_STRING} ^_escaped_fragment_=/([a-zA-Z0-9\/_\-]+)$
  RewriteRule ^(.*)$ /static/%1.html [NC,L]
</IfModule>
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

* [![Build Status](https://travis-ci.org/mradcliffe/grunt-crawl.svg?branch=master)](https://travis-ci.org/mradcliffe/grunt-crawl)

## Release History
_(Nothing yet)_
