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


var crackWep = function(file, mac, update, found, error) {
    var infoFile = file + '-01.cap'

    var ls = spawn('aircrack-ng', ['-K', '-b', mac, infoFile]);

    ls.stdout.setEncoding('utf8');


    ls.stdout.on('data', function(data) {
        if(data.split('Tested')[1]) {
            update({
                'keys' : data.split('Tested')[1].split(' keys ')[0],
                'ivs' : data.split('got ')[1].split(' IVs')[0]
            })
        }
        if(data.split('KEY FOUND! ')[1]) {
            ls.kill()
            found(data.split('KEY FOUND! [')[1].split(' ]')[0])
        }

    });
    ls.stderr.setEncoding('utf8');


    ls.stderr.on('data', function(data) {
        throw data
    });

    ls.on('exit', function(code) {
    });
    return function() {
        ls.kill()

    }
}


module.exports = {
    crackWep : crackWep
}