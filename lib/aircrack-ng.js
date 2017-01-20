
const spawn = require('child_process').spawn;

let crackWep = function(file, mac, update, found, error) {

    let infoFile = file + '-01.cap';
    let ls = spawn('aircrack-ng', ['-K', '-b', mac, infoFile]);

    ls.on('exit', code => {});

    ls.stdout.setEncoding('utf8');
    ls.stderr.setEncoding('utf8');

    ls.stderr.on('data', data => {throw data});
    ls.stdout.on('data', function(data) {
        if(data.split('Tested')[1]) {
            update({
                'keys': data.split('Tested')[1].split(' keys ')[0],
                'ivs': data.split('got ')[1].split(' IVs')[0]
            })
        }

        if(data.split('KEY FOUND! ')[1]) {
            ls.kill();
            found(data.split('KEY FOUND! [')[1].split(' ]')[0]);
        }
    });

    return () => ls.kill();
}

module.exports = {crackWep};