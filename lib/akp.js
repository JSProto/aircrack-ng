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


var Association = module.exports = function(b, h) {

    events.EventEmitter.call(this);
    this.b = b;
    this.h = h;

}
/**
 * Inherits from EventEmitter
 */
util.inherits(Association, events.EventEmitter);

Association.prototype.start = function(apkSocket) {
    //-10.kismet.netxml
    var self = this;

    var ls = this.ls = spawn('aireplay-ng', ['-3', '-b', this.b, '-h', this.h, 'wlan0']);

    ls.stdout.setEncoding('utf8');


    ls.stdout.on('data', function(data) {
        if(!~data.indexOf(' ARP requests), sent ')) {
            self.emit('ARP')

        }
        console.log(data)
        apkSocket.emit('message', {
            from : 'stdout',
            data : data
        })
    });
    ls.stderr.setEncoding('utf8');


    ls.stderr.on('data', function(data) {
        self.emit('data', data)
        console.log(data)
        apkSocket.emit('message', {
            from : 'stderr',
            data : data
        })
    });

    ls.on('exit', function(code) {
        console.log('child process exited with code ' + code);
        self.emit('end')
    });
}
Association.prototype.stop = function() {
    if(this.ls) {
        this.ls.kill('SIGHUP');
    }
}
Association.prototype.stats = function() {
    return this.info
}