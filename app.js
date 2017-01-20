const express = require('express');
const http = require('http');
const ws = require('socket.io');

const methodOverride = require('method-override');
const bodyParser = require('body-parser');

const Airmon = require('./lib/airmon-ng');
const Airdump = require('./lib/airodump-ng');
const Airplay = require('./lib/aireplay-ng');
const Aircrack = require('./lib/aircrack-ng');
const Job = require('./lib/job');

let app = express();
let server = http.Server(app);

let io = ws(server);
let jobSocket = io.of('/ws/job');

let currentJob = null;
let currentJobStatus = null;


let logErrors = function(err, req, res, next) {
    console.error(err.stack);
    next(err);
};

let clientErrorHandler = function(err, req, res, next) {
    res.status(500);

    if (req.xhr) {
        if (req.accepts('html', 'json') == 'json') {
            res.json({
                error: err.message,
                stack: err.stack,
                ok: false
            });
        }
        else {
            res.send(err.message + '\n' + err.stack);
        }
    }
    else {
        next(err);
    }
};

let errorHandler = function(error, req, res, next) {
    let {message, stack} = error; // fix
    res.render('error', {error});
};

app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');


let startJob = function(ap, mac, interface, minIvs) {

    if (currentJob !== null) return false;

    let job = currentJob = new Job(ap, mac, interface, minIvs);

    job.once('kill', function() {
        currentJob = null;
        currentJobStatus = null;
    });

    job.on('status', function(info) {
        console.log('packets.data', info.networkInfo.packets.data,
            'arpInfo.pps', info.arpInfo.pps,
            'crackinfo.keys', info.crackinfo.keys,
            'arpInfo.pps', info.arpInfo.pps,
            'crackinfo.ivs', info.crackinfo.ivs);

        currentJobStatus = info;
        jobSocket.emit('status', ap, job.current.given, info, job);
    });

    job.on('step', function(step) {
        console.log(step);
        jobSocket.emit('step', step);
    });

    job.start(interface => console.log(interface));

    return job;
};

app.all('/', (req, res) => res.render('index'));

app.all('/list', (req, res) => res.render('list'));

app.get('/start', function(req, res) {
    let {apName, ourMac, iface, minIvs} = req.query;

    if (!(apName && ourMac && iface && minIvs)) {
        throw new Error('missing params req.query[apName, ourMac, iface, minIvs]');
    }

    let job = startJob(apName, ourMac, iface, parseInt(minIvs));

    if (job) {
        res.json(job);
    }
    else {
        throw new Error('cant start if running')
    }
});

app.get('/status', function(req, res) {
    if (currentJob) {
        res.json([currentJob, currentJobStatus]);
    }
    else {
        throw new Error('no current job running')
    }
});

app.get('/stop', function(req, res) {
    if (currentJob) {
        res.json([currentJob.emit('kill'), currentJobStatus]);
    }
    else {
        throw new Error('no current job running');
    }
});

server.listen(3000);
console.log('server started on port 3000');

