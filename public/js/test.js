FRAME5.on('ready', function() {
    FRAME5.hang.startPool()
    FRAME5.hang.subscribe('sys', function(data) {
        var from = data.from;
        var sentData = data.data;
        if(from.split(':').length == 2) {
            FRAME5.emit('sys:' + from, sentData)
        }

    })
})