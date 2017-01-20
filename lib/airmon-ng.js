
const exec = require('child_process').exec;

let reMode = /(\w+) mode vif (\w+) (?:on|for) \[(\w+)\](\w+)(?: on \[(\w+)\](\w+))?/;

let parseIfacesFromStdOut = function (stdout) {
    let data = stdout.split(/\t+/).join(' & ').split('\n');
    let hasHitIfaces = false;

    let rows = data.filter((row) => {
        if (row === '') return false;
        if (row === 'PHY & Interface & Driver & Chipset') {
            hasHitIfaces = true;
            return false;
        }

        return hasHitIfaces && true;
    }).map((row)=>{
        let [phy, iface, driver, chipset] = row.split(' & ');
        return phy ? {phy, iface, driver, chipset} : row;
    });

    let ifaces = rows.filter(row => !!row.phy);

    rows.filter(row => !row.phy).map((row) => {
        let [status, mode, action, phy, iface, phy2, iface2] = reMode.exec(row) || [];
        return {mode, action, phy, iface, given: iface2, status};
    }).forEach((row) => {
        if (!row.mode) return;

        ifaces.forEach(iface => {
            if (iface.phy === row.phy) {
                if (row.action == 'enabled') {
                    iface.mode = row.mode;
                }

                if (row.mode == 'monitor') {
                    iface.action = row.action;

                    if (row.action == 'enabled' && row.given) {
                        iface.given = row.given;
                    }

                    iface.status = row.status;
                }
            }
        });
    });

    return ifaces;
};

let resultProcessor = function(interface, callBack){
    return function(error, stdout, stderr) {
        if(error !== null) {
            console.log('exec error: ' + error);
            callBack(error);
        }
        else {
            let ifaces = parseIfacesFromStdOut(stdout);
            let currentInterface = ifaces.filter(iface => interface === iface.iface).pop() || {};

            callBack(null, ifaces, currentInterface);
        }
    };
};


let getIfaces = function(callBack) {
    exec('airmon-ng', resultProcessor(null, callBack));
};

let stopIfaces = function(interface, callBack) {
    exec('airmon-ng stop ' + interface, resultProcessor(interface, callBack));
};

let startIfaces = function(interface, callBack) {
    exec('airmon-ng start ' + interface, resultProcessor(interface, callBack));
};

let startIfacesChan = function(interface, chan, callBack) {
    exec('airmon-ng start ' + interface + ' ' + chan, resultProcessor(interface, callBack));
};

module.exports = {
    startIfacesChan,
    startIfaces,
    stopIfaces,
    getIfaces
};


// let tmp = function(callBack) {
//     exec('cat ./dump/airmon.dump', resultProcessor(null, callBack));
// };

// tmp(function(error, ifaces) {
//     console.log(ifaces);
// });
