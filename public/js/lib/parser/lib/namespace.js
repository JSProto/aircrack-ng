/**
 * Module dependencies.
 */

define(['parser/lib/parser', 'parser/lib/stream', 'core/events', 'core/utils'], function(Parser, Stream, events, util) {

    var toArray = function(enu) {
        var arr = [];

        for(var i = 0, l = enu.length; i < l; i++)
        arr.push(enu[i]);

        return arr;
    };
    /**
     * Constructor.
     *
     * @api public.
     */

    function StreamNamespace(name) {
        events.EventEmitter.call(this);
        this.name = name || '';
        this.streams = {};
        this.auth = false;
        this.setFlags();

        this.parser = new Parser();
    };

    // So will act like an event emitter
    util.inherits(StreamNamespace, events.EventEmitter);

    /**
     * Copies emit since we override it.
     *
     * @api private
     */

    StreamNamespace.prototype.$emit = events.EventEmitter.prototype.emit;

    /**
     * JSON message flag.
     *
     * @api public
     */

    StreamNamespace.prototype.__defineGetter__('json', function() {
        this.flags.json = true;
        return this;
    });
    /**
     * Volatile message flag.
     *
     * @api public
     */

    StreamNamespace.prototype.__defineGetter__('volatile', function() {
        this.flags['volatile'] = true;

        return this;
    });
    /**
     * Adds a session id we should prevent relaying messages to (flag).
     *
     * @api public
     */

    StreamNamespace.prototype.except = function(id) {
        this.flags.exceptions.push(id);
        return this;
    };
    /**
     * Sets the default flags.
     *
     * @api private
     */

    StreamNamespace.prototype.setFlags = function() {
        this.flags = {
            endpoint : this.name,
            exceptions : []
        };
        return this;
    };
    /**
     * Emits to everyone (override).
     *
     * @api public
     */

    StreamNamespace.prototype.emit = function(name) {
        if(name == 'newListener') {
            return this.$emit.apply(this, arguments);
        }

        return this.packet({
            type : 'event',
            name : name,
            args : toArray(arguments).slice(1)
        });
    };
    /**
     * Handles a packet.
     *
     * @api private
     */

    StreamNamespace.prototype.handlePacket = function(stream, packet) {
        //var stream = this.stream(sessid)
        var dataAck = packet.ack == 'data'
        var self = this;

        switch (packet.type) {
            case 'connect':
                stream.$emit('connect', packet);
                break;

            case 'disconnect':
                if(stream.name === '') {
                    stream.onDisconnect(packet.reason || 'booted');
                } else {
                    stream.$emit('disconnect', packet.reason);
                }
                break;

            case 'message':
            case 'json':
                var params = ['message', packet.data];

                if(packet.ack == 'data') {
                    params.push(ack);
                } else if(packet.ack) {
                    stream.packet({
                        type : 'ack',
                        ackId : packet.id
                    });
                }
                stream.$emit.apply(stream, params);
                break;

            case 'event':
                if(-~['connect', 'disconnect', 'message', 'json', 'event', 'ack', 'error'].indexOf(packet.name)) {
                    console.log('ignoring blacklisted event `' + packet.name + '`');
                } else {
                    var params = [packet.name].concat(packet.args);

                    if(dataAck) {
                        params.push(ack);
                    }

                    stream.$emit.apply(stream, params);
                }
                break;

            case 'ack':
                if(stream.acks[packet.ackId]) {
                    stream.acks[packet.ackId].apply(stream, packet.args);
                    delete stream.acks[packet.ackId];
                }
                break;

            case 'error':
                if(packet.advice) {
                    stream.onError(packet);
                } else {
                    if(packet.reason == 'unauthorized') {
                        stream.$emit('connect_failed', packet.reason);
                    } else {
                        stream.$emit('error', packet.reason);
                    }
                }
                break;
        }
    };
    return StreamNamespace;
})