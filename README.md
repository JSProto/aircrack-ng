Web UI for Aircrack-ng
=============

Very buggy but will crack wep keys.

Install
-------

So you will ne a few things installed. Listed here:

* [Aircrack-ng](http://www.aircrack-ng.org/) -- Ubuntu/Debian: `sudo apt-get install aircrack-ng` Fedora/RPM: `sudo yum install aircrack-ng`
* [Node.js](http://nodejs.org/) -- Node.js for the server


Installing node.js
------------

Ok I'm going to show you how to install Node.js


### Ubuntu/Debian

Install the Dependencies

    sudo apt-get -y install build-essential g++ libssl-dev
    sudo apt-get -y install g++ curl libssl-dev apache2-utils
    sudo apt-get -y install git-core


### Fedora

Install the Dependencies

    sudo yum install g++ curl libssl-dev apache2-utils
    sudo yum install git-core

Compile Node.js

    mkdir /tmp/nodejs
    cd /tmp/nodejs
    wget http://nodejs.org/dist/v0.6.6/node-v0.6.6.tar.gz
    tar -zxvf node-v0.6.2.tar.gz
    cd node-v0.6.2
    ./configure
    make
    
and then

    sudo make install



Installing Aircrack-ng Web UI
------------

    cd ~/
    git clone git@github.com:FLYBYME/aircrack-ng.git
    cd aircrack-ng
    cd test
    sudo node app

now go to [localhost:3000](http://localhost:3000/)

and your done.

