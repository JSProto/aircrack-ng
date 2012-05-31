define(['parser/index', 'com/stream', 'com/xhr', 'core/utils', 'core/events'], function(parser, ComStream, xhr, utils, events) {

    var MAX_POST_SIZE = 1024 * 1024 * 1024

    var Com = function(host) {
        events.EventEmitter.call(this)
        this.ns = new parser.NameSpace('')
        this.url = 'http://' + host + '/com'
        this.stream = new ComStream(utils.uuid(), this.ns, true);
        this.transport = new events.EventEmitter()

        this._initns()
        this._initstream()
    };

    utils.inherits(Com, events.EventEmitter);
    Com.prototype.send = function(data, fn) {

        return this.stream.send(data, fn)

    }
    Com.prototype._next = function(fn) {

        return this.stream.next(fn)

    }
    Com.prototype._initns = function() {
        var ns = this.ns;

        ns.on('error', function() {

        })
    }
    Com.prototype._initstream = function() {
        var stream = this.stream;

        stream.on('error', function() {

        }).on('connect', function() {

        }).on('disconnect', function() {

        }).on('message', function() {

        }).on('json', function() {

        }).on('ack', function() {

        }).on('connect_failed', function() {

        }).on('error', function() {

        });
        this.transport.on('data', stream.onData.bind(stream))
    }
    Com.prototype._lazy = function(key) {
        var sendBuff = [];
        var stream = this.stream;
        var self = this;
        var url = this.url
        var poll = function(data, cb) {
            console.log(stream.parser.encodePayload(data))
            xhr({
                url : url + '/com/lazy',
                headers : {
                    'uuid' : key
                },
                data : stream.parser.encodePayload(data),
                method : 'post'
            }).on('response', function(data, req) {
                cb(null, data, req)
            }).on('error', function(data, req) {
                cb(data, null, req)
            });
        }
        var pollCb = function(msgs, callBack) {
            return function(err, data, req) {
                if(err) {
                    return poll(msgs, pollCb(msgs))

                } else {
                    callBack()
                    self.transport.emit('data', data)
                    self._lazy(req.getResponseHeader('uuid') || '')
                }

            }
        }
        var loopPackets = function(streamBuff) {
            if(streamBuff.length > 0) {

                console.log(streamBuff)
                poll(streamBuff, pollCb(streamBuff, function() {

                }))
                stream.buff = [];
            } else {
                stream.packet({
                    type : 'heartbeat'
                });
                self._next(loopPackets)
            }
        }
        if(key === '') {
            xhr({
                url : url + '/token',
                data : '',
                method : 'post'
            }).on('response', function(data, req) {
                self._lazy(req.getResponseHeader('uuid') || '')
            });
        } else {
            this._next(loopPackets)
        }

    }
    return Com
})