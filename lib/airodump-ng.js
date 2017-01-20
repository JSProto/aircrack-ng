
const uuid = require('uuid');
const fs = require('fs');
const path = require('path');
const parser = require('xml2json');
const spawn = require('child_process').spawn;
const EventEmitter = require('events');

let reFix = /&#x\s+0;/g;

let convertXml2Json = function(data) {
    data = data.toString('utf8').replace(reFix, '*');
    return JSON.parse(parser.toJson(data));
};

class Airodump extends EventEmitter {

    constructor (args) {
        super();

        this.isDead = false;
        this.file = Airodump.DIR + '/tmp-' + uuid();;
        this.xmlFile = this.file + '-01.kismet.netxml';

        this.args = ['-o', 'netxml,pcap', '-w', this.file].concat(args);
        this.spawn = spawn('airodump-ng', this.args);

        this._watch();

        this.once('kill', () => {
            this._unwatch();
            this.isDead = true;
        });
    }

    _unwatch(){
        fs.unwatchFile(this.xmlFile);
    }

    _watch(){

        let errorCounter = 0;

        fs.watchFile(this.xmlFile, (curr, prev) => {
            if (this.isDead) return;

            fs.readFile(this.xmlFile, (err, data) => {
                if (err) {
                    errorCounter++;
                    if (errorCounter > 10) {
                        return this.emit('error', error, errorCounter);
                    }
                }

                if (this.isDead) return;

                try {
                    let json = convertXml2Json(data);
                        json = json['detection-run'];

                    if (json) {
                        this.emit('update', json['wireless-network'], this.file);
                    }
                }
                catch (e) {
                    errorCounter++;
                }

            });
        });

        this.spawn.stderr.setEncoding('utf8');
        this.spawn.stderr.on('data', data => {
            if (this.isDead) return;
            if (/No such device/.test(data)) {
                this.emit('error', new Error('airodump: Bad device name its not called ' + this.args[this.args.length-1]));
            }
        });

        this.spawn.on('exit', code => {
            this._unwatch();
            console.log('airodump: child process exited with code ' + code);
        });

        this.once('kill', () => this.spawn.kill());
    }

    kill() {
        console.log('kill job');
        this.emit('kill');
    }
}

Airodump.DIR = path.normalize(path.join(__dirname, '/../dump'));

Airodump.dumpAll = function(interface) {
    return new Airodump([interface]);
};

Airodump.dumpBssid = function(interface, bssid, channel) {
    return new Airodump(['-c', channel, '--bssid', bssid, interface]);
};

module.exports = Airodump;
