var http = require('http');
var fs = require('fs');
var util = require('util');
var events = require('events');
var url = require('url');
var path = require('path');
var parser = require('xml2json');
var spawn = require('child_process').spawn
var exec = require('child_process').exec

var getIfaces = function(callBack) {
    exec('airmon-ng', function(error, stdout, stderr) {


        if(error !== null) {
            console.log('exec error: ' + error);
            callBack(error)
        } else {
            var data = stdout.split('\t').join(' & ').split('\n');
            var ifaces = []
            for(var i = 0; i < data.length; i++) {
                var d = data[i];

                if(d === '') {
                    continue;
                } else if(d === 'Interface & Chipset &  & Driver') {
                    continue;
                } else {
                    var iface = {}
                    d = d.split(' & ');

                    iface.nik = d.shift();
                    d.shift();
                    iface.device = d.shift().trim();
                    iface.iface = d.shift().split(' - ');
                    ifaces.push(iface)
                }

            };
            callBack(null, ifaces)
        }


    });
}
var stopIfaces = function(nik, callBack) {
    exec('airmon-ng stop ' + nik, function(error, stdout, stderr) {
        if(error !== null) {
            console.log('exec error: ' + error);
            callBack(error)
        } else {
            var data = stdout.split('\t').join(' & ').split('\n');
            var ifaces = []
            var curentNik = {}
            for(var i = 0; i < data.length; i++) {
                var d = data[i];
                if(d === '') {
                    continue;
                } else if(d === 'Interface & Chipset &  & Driver') {
                    continue;
                } else {
                    var iface = {}
                    d = d.split(' & ');
                    iface.nik = d.shift();
                    d.shift();
                    iface.device = d.shift().trim();
                    iface.iface = d.shift().split(' - ');
                    if(nik === iface.nik) {
                        curentNik = iface
                        if(/removed/.test(iface.iface[1])) {
                            iface.stoped = true;
                            iface.iface[1] = iface.iface[1].split(' ')[0]
                        } else {

                            iface.stoped = false;
                        }

                    }
                    ifaces.push(iface)
                }

            };
            callBack(null, curentNik, ifaces)
        }
    });
}
var startIfaces = function(nik, callBack) {
    exec('airmon-ng start ' + nik, function(error, stdout, stderr) {
        if(error !== null) {
            console.log('exec error: ' + error);
            callBack(error)
        } else {
            var data = stdout.split('\t').join(' & ').split('\n');
            var ifaces = []
            var hasHitIfaces = false;
            var curentNik = {}
            for(var i = 0; i < data.length; i++) {
                var d = data[i];
                if(d === '') {
                    continue;
                } else if(d === 'Interface & Chipset &  & Driver') {
                    hasHitIfaces = true
                    continue;
                }
                if(hasHitIfaces) {
                    var iface = {}
                    d = d.split(' & ');
                    iface.nik = d.shift();
                    d.shift();
                    iface.device = d.shift().trim();
                    iface.iface = d.shift().split(' - ');
                    if(nik === iface.nik) {
                        iface.status = data[i + 1].split(' & ').join('');
                        curentNik = iface
                        iface.started = /enabled/.test(iface.status)
                        iface.given = /enabled on ([\w\-\.]+)/.exec(iface.status)[1]

                    }
                    ifaces.push(iface)
                }

            };
            callBack(null, curentNik, ifaces)
        }
    });
}
var startIfacesChan = function(nik, chan, callBack) {
    exec('airmon-ng start ' + nik + ' ' + chan, function(error, stdout, stderr) {
        if(error !== null) {
            console.log('exec error: ' + error);
            callBack(error)
        } else {
            var data = stdout.split('\t').join(' & ').split('\n');
            var ifaces = []
            var hasHitIfaces = false;
            var curentNik = {}
            for(var i = 0; i < data.length; i++) {
                var d = data[i];
                if(d === '') {
                    continue;
                } else if(d === 'Interface & Chipset &  & Driver') {
                    hasHitIfaces = true
                    continue;
                }
                if(hasHitIfaces) {
                    var iface = {}
                    d = d.split(' & ');
                    iface.nik = d.shift();
                    d.shift();
                    iface.device = d.shift().trim();
                    iface.iface = d.shift().split(' - ');
                    if(nik === iface.nik) {
                        iface.status = data[i + 1].split(' & ').join('');
                        curentNik = iface
                        iface.started = /enabled/.test(iface.status)
                        iface.given = /enabled on ([\w\-\.]+)/.exec(iface.status)[1]

                    }
                    ifaces.push(iface)
                }

            };
            callBack(null, curentNik, ifaces)
        }
    });
}
/***
 *
 *
 *
 */

module.exports = {
    startIfacesChan : startIfacesChan,
    startIfaces : startIfaces,
    stopIfaces : stopIfaces,
    getIfaces : getIfaces
}