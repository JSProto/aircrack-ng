define(['core/events', 'core/utils'], function(events, util) {
    var toArray = function(enu) {
        var arr = [];

        for(var i = 0, l = enu.length; i < l; i++)
        arr.push(enu[i]);

        return arr;
    };
    /**
     * Default error event listener to prevent uncaught exceptions.
     */

    var defaultError = function() {
        //
    };
    //

    var Stream = function(id, nsp, readable) {
        events.EventEmitter.call(this);
        this.id = id;
        this.namespace = nsp;
        this.disconnected = false;
        this.ackPackets = 0;
        this.acks = {};
        this.setFlags();
        this.parser = nsp.parser;
        this.readable = readable;
        this.on('error', defaultError);
    };
    // So will act like an event emitter
    util.inherits(Stream, events.EventEmitter);
    /**
     * Resets flags
     *
     * @api private
     */

    Stream.prototype.setFlags = function() {
        this.flags = {
            endpoint : this.namespace.name,
            room : ''
        };
        return this;
    };
    /**
     * Triggered on disconnect
     *
     * @api private
     */

    Stream.prototype.onDisconnect = function(reason) {
        if(!this.disconnected) {
            this.$emit('disconnect', reason);
            this.disconnected = true;
        }
    };
    /**
     * Triggered on onError
     *
     * @api private
     */

    Stream.prototype.onError = function(packet) {
        //console.log(packet)
        this.$emit('error', packet.reason);
    };
    /**
     * Triggered on onError
     *
     * @api private
     */

    Stream.prototype.onData = function(data) {

        if(data !== '') {
            // todo: we should only do decodePayload for xhr transports
            var msgs = this.parser.decodePayload(data);

            if(msgs && msgs.length) {
                for(var i = 0, l = msgs.length; i < l; i++) {
                    this.onPacket(msgs[i]);
                }
            }
        }

        return this;
    };
    Stream.prototype.onPacket = function(packet) {
        this.namespace.handlePacket(this, packet)
    };
    /**
     * Transmits a packet.
     *
     * @api private
     */

    Stream.prototype.packet = function(packet) {
        if(this.flags.broadcast) {
            console.log('broadcasting packet');
            this.except(this.id).packet(packet);
        } else {
            packet.endpoint = this.flags.endpoint;
            packet = this.parser.encodePacket(packet);
            this.write(packet)
        }

        this.setFlags();

        return this;
    };
    /**
     * Send a message.
     *
     * @api public
     */

    Stream.prototype.send = function(data, fn) {
        var packet = {
            type : this.flags.json ? 'json' : 'message',
            data : data
        };

        if(fn) {
            packet.id = ++this.ackPackets;
            packet.ack = true;
            this.acks[packet.id] = fn;
        }

        return this.packet(packet);
    };
    /**
     * Original emit function.
     *
     * @api private
     */

    Stream.prototype.$emit = events.EventEmitter.prototype.emit;

    /**
     * Emit override for custom events.
     *
     * @api public
     */

    Stream.prototype.emit = function(ev) {
        if(ev == 'newListener') {
            return this.$emit.apply(this, arguments);
        }

        var args = toArray(arguments).slice(1), lastArg = args[args.length - 1], packet = {
            type : 'event',
            name : ev
        };

        if('function' == typeof lastArg) {
            packet.id = ++this.ackPackets;
            packet.ack = lastArg.length ? 'data' : true;
            this.acks[packet.id] = lastArg;
            args = args.slice(0, args.length - 1);
        }

        packet.args = args;

        return this.packet(packet);
    };
    return Stream
})