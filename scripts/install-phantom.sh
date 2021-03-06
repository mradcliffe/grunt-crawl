#!/bin/sh

# phantomJS 2.0.0 needs to replace phantom 1.9.x on travis environment.
# PHANTOM is build variable set in travisci for grunt-crawl.
if [ "$PHANTOM" = "2.0.0" ]; then
	mkdir travis-phantomjs
	wget https://s3.amazonaws.com/travis-phantomjs/phantomjs-2.0.0-ubuntu-12.04.tar.bz2 -O $PWD/travis-phantomjs/phantomjs-2.0.0-ubuntu-12.04.tar.bz2
	tar -xvf $PWD/travis-phantomjs/phantomjs-2.0.0-ubuntu-12.04.tar.bz2 -C $PWD/travis-phantomjs
	export PATH=$PWD/travis-phantomjs:$PATH
fi

echo "PhantomJS $PHANTOM installed."
