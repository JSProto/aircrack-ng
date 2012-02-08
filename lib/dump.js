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


var Dump = module.exports = function(dir, chan) {

    events.EventEmitter.call(this);
    this.dir = dir;
    this.chan = chan;
    this.info = {};

}
/**
 * Inherits from EventEmitter
 */
util.inherits(Dump, events.EventEmitter);

Dump.prototype.start = function(apSocket) {
    //-10.kismet.netxml
    var id = this.id = utils.uuid()
    var self = this;
    var ls = this.ls = spawn('airodump-ng', ['-c', '6', '-o', 'netxml,pcap', '-w', this.dir + '/' + id, 'mon0']);
    var infoFile = this.infoFile = this.dir + '/' + id + '-01.kismet.netxml'
    var isRunning = false;
    fs.watchFile(infoFile, function(curr, prev) {
        fs.readFile(infoFile, function(err, data) {
            if(err)
                throw err;


            try {
                var json = JSON.parse(parser.toJson(data.toString('utf8')));

            } catch(err) {
            }

            if(json && json['detection-run']) {
                if(!isRunning) {
                    self.emit('crack', id)
                    isRunning = true
                }
                json.id = id;
                self.info = json
                var aps = json['detection-run']['wireless-network'];
                var data = []

                for(var i = 0; i < aps.length; i++) {
                    var a = aps[i];
                    if(a) {
                        data.push({
                            type : a.type,
                            'first-time' : a['first-time'],
                            'last-time' : a['first-time'],
                            encryption : a['SSID']['encryption'],
                            essid : a['SSID']['essid']['$t'],
                            channel : a['channel'],
                            'data-packets' : a['packets']['data'],
                            'total-packets' : a['packets']['total'],
                            datasize : a['datasize'],
                            BSSID : a['BSSID']
                        }, function() {

                        })
                    }
                };
                self.emit('info', self.info = data)

            }
        });
    });

    ls.stdout.setEncoding('utf8');


    ls.stdout.on('data', function(data) {
        apSocket['volatile'].emit('message', {
            from : 'stdout',
            data : data
        })

    });
    ls.stderr.setEncoding('utf8');


    ls.stderr.on('data', function(data) {
        self.emit('data', data);
        apSocket['volatile'].emit('message', {
            from : 'stderr',
            data : data
        })
    });

    ls.on('exit', function(code) {
        console.log('child process exited with code ' + code);
        self.emit('end')
    });
}
Dump.prototype.stop = function() {
    if(this.ls) {
        this.ls.kill('SIGHUP');
        fs.unwatchFile(this.infoFile)
    }
}
Dump.prototype.stats = function() {
    return this.info
}
return;
dump.on('info', function(info) {
    dumpInfo = info['detection-run']
    if(info['detection-run']) {
        var aps = info['detection-run']['wireless-network'];


        for(var i = 0; i < aps.length; i++) {
            var a = aps[i];
            if(a) {
                apSocket.emit('message', {
                    type : a.type,
                    'first-time' : a['first-time'],
                    'last-time' : a['first-time'],
                    encryption : a['SSID']['encryption'],
                    essid : a['SSID']['essid']['$t'],
                    channel : a['channel'],
                    'data-packets' : a['packets']['data'],
                    'total-packets' : a['packets']['total'],
                    datasize : a['datasize'],
                    BSSID : a['BSSID']
                })
                createAp({
                    type : a.type,
                    'first-time' : a['first-time'],
                    'last-time' : a['first-time'],
                    encryption : a['SSID']['encryption'],
                    essid : a['SSID']['essid']['$t'],
                    channel : a['channel'],
                    'data-packets' : a['packets']['data'],
                    'total-packets' : a['packets']['total'],
                    datasize : a['datasize'],
                    BSSID : a['BSSID']
                }, function() {

                })
            }
        };
    }
})