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


var testInjection = function(given, name, bssid, callBack) {
    exec('aireplay-ng -9 -e ' + name + ' -a ' + bssid + ' ' + given, function(error, stdout, stderr) {
        if(error !== null) {
            console.log('exec error: ' + error);
            callBack(error)
        } else {
            if(/there is an ESSID mismatch!/.test(stdout)) {
                callBack(new Error('there is an ESSID mismatch!'))
            } else if(/Injection is working!/.test(stdout)) {

                callBack(null)
            }
        }
    });
}
var testFakeAuth = function(given, name, bssid, ourMac, callBack) {
    var ls = spawn('aireplay-ng', ['-1', '0', '-e', name, '-a', bssid, '-h', ourMac, given]);

    ls.stdout.setEncoding('utf8');

    var kill = function() {
        ls.kill()
    }
    ls.stdout.on('data', function(data) {
        if(/wrong ESSID or WPA/.test(data)) {
            ls.kill()
            callBack(new Error('Denied (code 12), wrong ESSID or WPA ?'))
        } else if(/Association successful \:\-\)/.test(data)) {
            ls.kill()
            callBack(null)
        }
    });
    ls.stderr.setEncoding('utf8');


    ls.stderr.on('data', function(data) {

    });

    ls.on('exit', function(code) {
        // console.log('child process exited with code ' + code);
    });
    return function() {
        ls.kill()

    }
}
var fakeAuth = function(given, name, bssid, ourMac, callBack) {
    var ls = spawn('aireplay-ng', ['-1', '6000', '-o', '1', '-p', '10', '-e', name, '-a', bssid, '-h', ourMac, given]);

    var hasSent = false;
    ls.stdout.setEncoding('utf8');
    ls.stdout.on('data', function(data) {
        if(/wrong ESSID or WPA/.test(data)) {
            ls.kill()
            callBack(new Error('Denied (code 12), wrong ESSID or WPA ?'))
        } else if(/Association successful \:\-\)/.test(data)) {
            if(!hasSent) {
                hasSent = true
                callBack(null)
            }

        }
    });
    ls.on('exit', function(code) {
        //console.log('child process exited with code ' + code);
    });
    return function() {
        ls.kill()

    }
}
var arpReplay = function(given, bssid, ourMac, update, callBack) {
    var ls = spawn('aireplay-ng', ['-3', '-b', bssid, '-h', ourMac, given]);
    //
    var regGot = /got (.*?) ARP/
    var regREad = /Read (.*?) packets/
    var regAcks = /and (.*?) ACKs/
    var regSent = /sent (.*?) packets/
    var regPps = /\.\.\.\((.*?) pps/
    //
    var hasSent = false;
    ls.stdout.setEncoding('utf8');

    var toggle = true;


    var onData = function(data) {
        if(regGot.test(data)) {
            var info = {
                got : regGot.exec(data)[1],
                read : regREad.exec(data)[1],
                acks : regAcks.exec(data)[1],
                sent : regSent.exec(data)[1],
                pps : regPps.exec(data)[1]
            }
            update(info)
            setTimeout(function() {

                ls.stdout.once('data', onData)
            }, 1000)
        } else
            ls.stdout.once('data', onData)
    }
    ls.stdout.once('data', onData)
    ls.on('exit', function(code) {
        //console.log('child process exited with code ' + code);
    });
    return function() {
        ls.kill()

    }
}
/***
 *
 *
 *
 */

module.exports = {
    arpReplay : arpReplay,
    fakeAuth : fakeAuth,
    testFakeAuth : testFakeAuth,
    testInjection : testInjection
}