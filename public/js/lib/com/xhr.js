define(['core/browser', 'core/events'], function(browser, events) {
    var Emitter = events.EventEmitter;
    return function(options) {

        var request = new Emitter();

        if(!options.url) {

            setTimeout(function() {
                request.emit('error', new Error('options.url is needed.'))
            }, 1)
            return request;
        }

        var req = new XMLHttpRequest();
        request.xhr = req
        var method = options.method || 'get';
        var url = options.url;
        var type = options.type || '';
        var async = ( typeof options.async != 'undefined' ? options.async : true);

        var params = (options.data && method.toLowerCase() === 'post' && type === 'json') ? (function() {

            try {
                return JSON.stringify(options.data)
            } catch(err) {
                return JSON.stringify({})
            }
        })() : options.data ? options.data : null;
        //console.log(params)
        var headers = options.headers || {};
        req.queryString = params;
        req.open(method, url, async);
        // Set "X-Requested-With" header
        req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        if(method.toLowerCase() == 'post')
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        for(key in headers) {
            if(headers.hasOwnProperty(key)) {
                req.setRequestHeader(key, headers[key]);
            }
        }

        function hdl() {
            if(req.readyState == 4) {

                if((/^[20]/).test(req.status)) {
                    request.responseText = req.responseText;
                    request.status = req.status;

                    request.emit('response', req.responseText, req)
                }
                if((/^[45]/).test(req.status))
                    request.emit('error', req.responseText, req)
            }
        }

        if(async) {
            req.onreadystatechange = hdl;
        }
        req.send(params);

        if(!async)
            hdl();
        return request;
    }
})