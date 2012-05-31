FRAME5.on('ready', function() {

    var cb = function(data) {
        console.log(data)
        $('#torrent-count').text(data.data.length)

        //active
    }
    FRAME5.xhr({
        url : '/torrents'
    }).on('end', cb).on('error', cb);

    var random = new TimeSeries();

    var line1 = new TimeSeries();
    var line2 = new TimeSeries();

    // Add a random value to each line every second

    // Add to SmoothieChart
    var activeCb = function(data) {
        random.append(new Date().getTime(), data.data.length);

        var upSpeed = 0;
        var dpwnSpeed = 0;
        for(var i = 0; i < data.data.length; i++) {
            if(data.data[i].server === '208.53.183.73:8080') {
                dpwnSpeed += data.data[i].downspeed
                upSpeed += data.data[i].upspeed
            }
        };
        line1.append(new Date().getTime(), (dpwnSpeed / 1024 ).toFixed(2));
        line2.append(new Date().getTime(), (upSpeed / 1024 ).toFixed(2));
        $("#down-laod-progressbar").progressbar({
            value : ((dpwnSpeed / 1024) / 500 * 100)
        });
        $("#up-laod-progressbar").progressbar({
            value : ((upSpeed / 1024) / 1000 * 100)
        });
        $('#speed-up').text('' + (upSpeed / 1024 ).toFixed(2) + 'KB/s')
        $('#speed-down').text('' + (dpwnSpeed / 1024 ).toFixed(2) + 'KB/s')
    }
    FRAME5.hang = new FRAME5.Hang
    FRAME5.hang.subscribe('active', function(data) {
        var from = data.from;
        var sentData = data.data;
        console.log(sentData)
        if(from === '208.53.183.73:8080') {
            activeCb({
                data : sentData
            })
        }

    })
    function createCount() {
        var chart = new SmoothieChart();
        chart.addTimeSeries(random, {
            strokeStyle : 'rgba(0, 255, 0, 1)',
            fillStyle : 'rgba(0, 255, 0, 0.2)',
            lineWidth : 4
        });
        chart.streamTo(document.getElementById("active-chart"), 5000);
    }

    function createTimeline() {
        var chart = new SmoothieChart();
        chart.addTimeSeries(line1, {
            strokeStyle : 'rgb(0, 255, 0)',
            fillStyle : 'rgba(0, 255, 0, 0.4)',
            lineWidth : 3
        });
        chart.addTimeSeries(line2, {
            strokeStyle : 'rgb(255, 0, 255)',
            fillStyle : 'rgba(255, 0, 255, 0.3)',
            lineWidth : 3
        });
        chart.streamTo(document.getElementById("speed-chart"), 5000);
    }

    createCount()
    createTimeline()
    FRAME5.hang.startPool()
})