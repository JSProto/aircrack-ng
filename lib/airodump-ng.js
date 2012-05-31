var http = require('http');
var fs = require('fs');
var util = require('util');
var events = require('events');
var url = require('url');
var path = require('path');
var parser = require('xml2json');
var spawn = require('child_process').spawn
var exec = require('child_process').exec
var uuid = require('../lib/utils').uuid


var dumpAll = function(dir, given, update, errCallBack) {
    var file = dir + '/sadsad' + uuid()

    var ls = spawn('airodump-ng', ['-o', 'netxml,pcap', '-w', file, given]);


    var infoFile = file + '-01.kismet.netxml'
    var hasCalledErr = false;
    var isDead = false;
    fs.watchFile(infoFile, function(curr, prev) {
        if(isDead) {
            return;
        }
        fs.readFile(infoFile, function(err, data) {

            if(err)
                throw err;
            try {
                var json = JSON.parse(parser.toJson(data.toString('utf8')));
            } catch(err) {
                return;
            }
            if(json['detection-run']) {
                if(isDead) {
                    return;
                }
                update(json['detection-run']);
            }
        });
    });
    ls.stderr.setEncoding('utf8');
    ls.stderr.on('data', function(data) {
        if(isDead) {
            return;
        }
        if(/No such device/.test(data)) {
            errCallBack(new Error('Bad device name its not called ' + given))
        }

    });
    ls.on('exit', function(code) {
        fs.unwatchFile(infoFile)
        console.log('child process exited with code ' + code);
    });
    return function() {
        fs.unwatchFile(infoFile)
        isDead = true
        ls.kill()
    }
}
var dumpBssid = function(dir, given, bssid, chan, update, errCallBack) {
    var file = dir + '/sadsad' + uuid()

    var ls = spawn('airodump-ng', ['-o', 'netxml,pcap', '-c', chan, '--bssid', bssid, '-w', file, given]);


    var infoFile = file + '-01.kismet.netxml'
    var hasCalledErr = false;

    fs.watchFile(infoFile, function(curr, prev) {
        fs.readFile(infoFile, function(err, data) {
            if(err)
                throw err;
            try {
                var json = JSON.parse(parser.toJson(data.toString('utf8')));
            } catch(err) {
                return;
            }
            if(json['detection-run']) {
                update(json['detection-run']);
            }
        });
    });
    ls.stderr.setEncoding('utf8');
    ls.stderr.on('data', function(data) {
        if(/No such device/.test(data)) {
            errCallBack(new Error('Bad device name its not called ' + given))
        }

    });
    ls.on('exit', function(code) {
        fs.unwatchFile(infoFile)
        console.log('child process exited with code ' + code);
    });
    return [
    function() {
        fs.unwatchFile(infoFile)
        isDead = true
        ls.kill()
    }, file]

}


module.exports = {
    dumpAll : dumpAll,
    dumpBssid : dumpBssid
}