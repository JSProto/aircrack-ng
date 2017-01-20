
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;

let testInjection = function(given, name, bssid, callBack) {
    exec('aireplay-ng -9 -e ' + name + ' -a ' + bssid + ' ' + given, function(error, stdout, stderr) {
        if(error !== null) {
            console.log('exec error: ' + error);
            callBack(error);
        }
        else {
            if (/there is an ESSID mismatch!/.test(stdout)) {
                callBack(new Error('there is an ESSID mismatch!'));
            }
            else if(/Injection is working!/.test(stdout)) {
                callBack(null);
            }
        }
    });
};

let testFakeAuth = function(given, name, bssid, ourMac, callBack) {
    let ls = spawn('aireplay-ng', ['-1', '0', '-e', name, '-a', bssid, '-h', ourMac, given]);

    ls.stdout.setEncoding('utf8');

    ls.stdout.on('data', function(data) {
        if (/wrong ESSID or WPA/.test(data)) {
            ls.kill();
            callBack(new Error('Denied (code 12), wrong ESSID or WPA ?'));
        }
        else if (/Association successful \:\-\)/.test(data)) {
            ls.kill();
            callBack(null);
        }
    });

    ls.stderr.setEncoding('utf8');
    ls.stderr.on('data', data => { });

    ls.on('exit', code => {
        // console.log('child process exited with code ' + code);
    });

    return () => ls.kill();
};

let fakeAuth = function(given, name, bssid, ourMac, callBack) {

    let ls = spawn('aireplay-ng', ['-1', '6000', '-o', '1', '-p', '10', '-e', name, '-a', bssid, '-h', ourMac, given]);

    let hasSent = false;
    let onData = function(data) {
        if (/wrong ESSID or WPA/.test(data)) {
            ls.kill()
            callBack(new Error('Denied (code 12), wrong ESSID or WPA ?'))
        }
        else if (/Association successful \:\-\)/.test(data)) {
            if (!hasSent) {
                hasSent = true;
                callBack(null);
            }
        }
    };

    ls.stdout.setEncoding('utf8');
    ls.stdout.on('data', onData);

    ls.on('exit', function(code) {
        //console.log('child process exited with code ' + code);
    });

    return () => ls.kill();
};

let arpReplay = function(given, bssid, ourMac, update, callBack) {
    let ls = spawn('aireplay-ng', ['-3', '-b', bssid, '-h', ourMac, given]);

    let reGot = /got (.*?) ARP/
    let reREad = /Read (.*?) packets/
    let reAcks = /and (.*?) ACKs/
    let reSent = /sent (.*?) packets/
    let rePps = /\.\.\.\((.*?) pps/

    let onData = function(data) {
        if(reGot.test(data)) {
            let info = {
                got: reGot.exec(data)[1],
                read: reREad.exec(data)[1],
                acks: reAcks.exec(data)[1],
                sent: reSent.exec(data)[1],
                pps: rePps.exec(data)[1]
            };

            update(info);

            setTimeout(() => ls.stdout.once('data', onData), 1000);
        }
        else {
            ls.stdout.once('data', onData);
        }
    }

    ls.stdout.setEncoding('utf8');
    ls.stdout.once('data', onData)

    ls.on('exit', function(code) {
        //console.log('child process exited with code ' + code);
    });

    return () => ls.kill();
};

module.exports = {
    arpReplay,
    fakeAuth,
    testFakeAuth,
    testInjection
}