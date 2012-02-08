var Dump = require('./lib/dump');
var Crack = require('./lib/crack');
var Association = require('./lib/association');
var Akp = require('./lib/akp');
var express = require('express');
var ws = require('socket.io');
var util = require('util');
//

var Airmon = require('./tests/airmon-ng');
var Airdump = require('./tests/airodump-ng');
var Airplay = require('./tests/aireplay-ng');
var Aircrack = require('./tests/aircrack-ng');
var Job = require('./tests/job');
//
var currentJob = null;
var currentJobStatus = null;
//


var app = express.createServer();

app.sendError = function(err, res) {
    app._request++;
    res.writeHead(405, app.resHeaders);
    res.end(JSON.stringify({
        error : err.message,
        stack : err.stack,
        ok : false
    }))
}
app.sendRes = function(data, res) {
    app._request++;
    res.writeHead(200, app.resHeaders);
    if(!data.hasOwnProperty('ok')) {
        data.ok = true;
    }

    res.end(JSON.stringify(data))
}
var io = ws.listen(app);

io.set('log level', 0)


var jobSocket = io.of('/ws/job');

app.configure(function() {
    app.use(express.static(__dirname + '/public'));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.resHeaders = {
        'Content-Type' : 'application/json'
    }
});
var startJob = function(apName, ourMac, iface, minIvs) {

    if(currentJob !== null) {
        return false;
    }

    var job = currentJob = new Job(apName, ourMac, iface, minIvs);

    job.once('kill', function() {
        currentJob = null;
        currentJobStatus = null;

    })
    job.on('status', function(info) {
        console.log('packets.data', info.networkInfo.packets.data, 'arpInfo.pps', info.arpInfo.pps, 'crackinfo.keys', info.crackinfo.keys, 'arpInfo.pps', info.arpInfo.pps, 'crackinfo.ivs', info.crackinfo.ivs);
        currentJobStatus = info
        jobSocket.emit('status', apName, job.current.given, info, job)
    })
    job.on('step', function(step) {
        console.log(step)
        jobSocket.emit('step', step)
    })


    job.start(function(iface) {
        console.log(iface)
    })
    return job
}
app.get('/start', function(req, res) {
    if(!(req.query.apName && req.query.ourMac && req.query.iface && req.query.minIvs)) {

        app.sendError(new Error('missing params req.query.apName && req.query.ourMac && req.query.iface && req.query.minIvs'), res)
    }

    var job = startJob(req.query.apName, req.query.ourMac, req.query.iface, parseInt(req.query.minIvs))
    if(job) {

        app.sendRes(job, res)
    } else
        app.sendError(new Error('cant start if running'), res)
})
app.get('/status', function(req, res) {
    if(!currentJob) {

        app.sendError(new Error('no current job running'), res)
    } else
        app.sendRes([currentJob, currentJobStatus], res)
})
app.get('/stop', function(req, res) {
    if(!currentJob) {

        app.sendError(new Error('no current job running'), res)
    } else {
        app.sendRes([currentJob.emit('kill'), currentJobStatus], res)
    }
})

app.listen(3000)