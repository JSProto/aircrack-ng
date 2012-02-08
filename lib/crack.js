/****
 *
 *
 *
 */
var http = require('http');
var fs = require('fs');
var util = require('util');
var events = require('events');
var url = require('url');
var path = require('path');
var parser = require('xml2json');
var spawn = require('child_process').spawn
var utils = require('./utils')

//


var Crack = module.exports = function(dir, id) {

    events.EventEmitter.call(this);
    this.dir = dir;
    this.id = id;
    this.info = {};

}
/**
 * Inherits from EventEmitter
 */
util.inherits(Crack, events.EventEmitter);

Crack.prototype.start = function(mac) {
    //-10.kismet.netxml
    var id = this.id;
    var self = this;
    var infoFile = this.infoFile = this.dir + '/' + id + '-01.cap'

    var ls = this.ls =spawn('aircrack-ng', ['-K', '-b', mac, this.dir + '/' + id + '-01.cap']);

    ls.stdout.setEncoding('utf8');


    ls.stdout.on('data', function(data) {
        if(data.split('Tested')[1]) {
            self.emit('keys', data.split('Tested')[1].split(' keys ')[0])
            self.emit('ivs', data.split('got ')[1].split(' IVs')[0])
        }
        if(data.split('KEY FOUND! ')[1]) {

            self.emit('found', data.split('KEY FOUND! [')[1].split(' ]')[0])
        }
        console.log(data)

    });
    ls.stderr.setEncoding('utf8');


    ls.stderr.on('data', function(data) {
        self.emit('data', data)
        console.log(data)

    });

    ls.on('exit', function(code) {
        console.log('child process exited with code ' + code);
        self.emit('end')
    });
}
Crack.prototype.stop = function() {
    if(this.ls) {
        this.ls.kill('SIGHUP');
    }
}
Crack.prototype.stats = function() {
    return this.info
}