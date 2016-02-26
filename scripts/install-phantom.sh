#!/bin/sh

# phantomJS 1.9.8 has a critical bug that is only fixed in 2.0.0, and is thus
# incompotable with TravisCI.
mkdir travis-phantomjs
wget https://s3.amazonaws.com/travis-phantomjs/phantomjs-2.0.0-ubuntu-12.04.tar.bz2 -O $PWD/travis-phantomjs/phantomjs-2.0.0-ubuntu-12.04.tar.bz2
tar -xvf $PWD/travis-phantomjs/phantomjs-2.0.0-ubuntu-12.04.tar.bz2 -C $PWD/travis-phantomjs
export PATH=$PWD/travis-phantomjs:$PATH

echo "PhantomJS $PHANTOM installed."
