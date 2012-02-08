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
var spawn = require('child_process').spawn;
var uuid = require('../lib/utils').uuid;
var Airmon = require('./airmon-ng');
var Airdump = require('./airodump-ng');
var Airplay = require('./aireplay-ng');
var Aircrack = require('./aircrack-ng');

//


var Job = module.exports = function(apName, ourMac, iface, minIvs) {

    events.EventEmitter.call(this)
    this.tmpDir = __dirname + '/dump';
    this.apName = apName;
    this.ourMac = ourMac;
    this.iface = iface;
    this.minIvs = minIvs;
    this.bssid = null;
}
/**
 * Inherits from EventEmitter
 */
util.inherits(Job, events.EventEmitter);

Job.prototype.startAirmon = function(callBack) {
    var job = this;
    var ifaceName = this.iface

    Airmon.getIfaces(function(err, ifaces) {
        if(err)
            return job.emit('error', err);


        var current = null


        for(var i = 0; i < ifaces.length; i++) {
            if(ifaces[i].nik === ifaceName) {
                current = ifaces[i]
                break;
            }
        };


        var loop = function(f) {
            var d = f.shift();
            if(!d) {
                Airmon.startIfaces(ifaceName, function(err, curentNik, ifaces) {
                    if(err)
                        return job.emit('error', err);


                    callBack(curentNik)
                })
            } else {
                if(d && d.iface[1] === current.iface[1]) {
                    Airmon.stopIfaces(d.nik, function(err, curentNik, ifaces) {
                        if(err)
                            return job.emit('error', err);

                        loop(f)
                    })
                }
            }


        }
        loop(ifaces)
    })
}
Job.prototype.stopAirmon = function(callBack) {
    var job = this;

    Airmon.stopIfaces(this.iface, function(err, curentNik, ifaces) {
        if(err)
            return job.emit('error', err);


    })
}
Job.prototype.getAirmon = function(callBack) {
    var job = this;

    Airmon.getIfaces(function(err, ifaces) {
        if(err)
            return job.emit('error', err);
        callBack(ifaces)

    })
}
/***
 *
 *
 */
Job.prototype.startDump = function(callBack) {
    var job = this;

    var kill = this.currentDump = Airdump.dumpBssid(this.tmpDir, job.current.nik, job.bssid, job.channel, function(data) {

        var networks = data['wireless-network']

        callBack(networks)

    }, function(err) {

        kill()
    })
    var file = kill[1]
    kill = this.currentDump = kill[0]
    job.once('kill', kill)
    return file
}
/***
 *
 *
 */
Job.prototype.getInfo = function(callBack) {
    var job = this;
    var kill = Airdump.dumpAll(this.tmpDir, job.current.given, function(data) {


        var networks = data['wireless-network']

        for(var i = 0, j = networks.length; i < j; i++) {
            var network = networks[i]
            if(network.SSID.essid.$t === job.apName) {
                kill()
                callBack(network)
                return;
            }
        };
        //console.log(data)
    }, function(err) {

    })
}
/***
 *
 *
 */
Job.prototype.testInjection = function(callBack) {
    var job = this;
    console.log(job.current.given, this.apName, this.bssid)
    Airplay.testInjection(job.current.given, this.apName, this.bssid, function(err) {
        if(err) {
            throw err;
        }
        callBack()
    })
}
/***
 *
 *
 */
Job.prototype.testFakeAuth = function(callBack) {
    var job = this;
    Airplay.testFakeAuth(job.current.given, this.apName, this.bssid, this.ourMac, function(err) {
        if(err) {
            throw err;
        }
        callBack()
    })
}
/***
 *
 *
 */
Job.prototype.fakeAuth = function(callBack) {
    var job = this;
    return Airplay.fakeAuth(job.current.given, this.apName, this.bssid, this.ourMac, function(err) {
        if(err) {
            throw err;
        }
        callBack()
    })
}
/***
 *
 *
 */
Job.prototype.arpReplay = function(callBack) {
    var job = this;
    //given, bssid, ourMac, update
    var hasSent = false;

    return Airplay.arpReplay(job.current.given, this.bssid, this.ourMac, function(info) {
        job.arpInfo = info
        if(!hasSent) {
            hasSent = true;

            callBack()
        }
    }, function(err) {
        if(err) {
            throw err;
        }
    })
}
/***
 *
 *
 */
Job.prototype.startArp = function(callBack) {
    var job = this;
    this.testInjection(function() {
        job.emit('step', 'testInjection')
        job.testFakeAuth(function() {
            job.emit('step', 'testFakeAuth')
            var killFake = job.fakeAuth(function() {
                job.emit('step', 'fakeAuth')
                var killReplay = job.arpReplay(function() {
                    job.emit('step', 'arpReplay')
                    callBack(killFake, killReplay)
                    job.once('kill', function() {
                        killFake()
                        killReplay()
                    })
                })
            })
        })
    })
}
/***
 *
 *
 */

Job.prototype.start = function(callBack) {
    var job = this;
    var isCracking = false;
    var isKilled = true;
    job.once('kill', function() {
        isKilled = false;
    })
    job.startAirmon(function(iface) {
        if(!isKilled)
            return;

        job.emit('step', 'startAirmon')
        job.current = iface;
        job.getInfo(function(networkInfo) {
            if(!isKilled)
                return;
            job.emit('step', 'getInfo')
            job.bssid = networkInfo.BSSID
            job.channel = networkInfo.channel
            Airmon.stopIfaces(job.current.nik, function(err, curentNik, ifaces) {
                if(!isKilled)
                    return;
                job.emit('step', 'stopIfaces')
                if(err)
                    return job.emit('error', err);

                Airmon.startIfacesChan(job.current.nik, job.channel, function(err, curentNik, ifaces) {
                    if(!isKilled)
                        return;
                    job.emit('step', 'startIfacesChan')
                    if(err)
                        return job.emit('error', err);
                    job.startArp(function(killFake, killReplay) {
                        if(!isKilled)
                            return;
                        job.emit('step', 'startArp')
                        var crackinfo = {
                            'keys' : 0,
                            'ivs' : 0
                        }
                        var file = job.startDump(function(networkInfo) {
                            if(!isCracking && job.minIvs < networkInfo.packets.data) {
                                isCracking = true;
                                var killCrack = Aircrack.crackWep(file, job.bssid, function(i) {
                                    if(!isKilled)
                                        return;
                                    crackinfo = i
                                }, function(key) {
                                    console.log('found key ' + key)
                                    job.emit('kill')
                                }, function() {
                                    job.emit('kill')

                                })
                                job.once('kill', function() {
                                    killCrack()
                                })
                                process.once('SIGINT', function() {
                                    job.emit('kill')
                                });
                            }
                            if(!isKilled)
                                return;
                            job.emit('status', {
                                networkInfo : networkInfo,
                                arpInfo : job.arpInfo,
                                crackinfo : crackinfo
                            })
                        })
                    })
                })
            })
        })
    })
}
/***
 *
 *
 */