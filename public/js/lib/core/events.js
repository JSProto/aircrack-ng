define(function() {
    /**************
     *
     * Emitter.js
     *
     */
    var Emitter = function() {
        this.listiners = {};
        this.maxListeners = 15
    };
    Emitter.prototype.emit = function() {
        if(1 <= arguments.length) {
            var a = Array.prototype.slice.call(arguments), b = a.shift();
            this.listiners.hasOwnProperty(b) && this.listiners[b].forEach(function(b) {
                setTimeout(function() {
                    b.apply(this, a)
                }, 0)
            })
        }
    };
    Emitter.prototype.setMaxListeners = function(a) {
        if(1 <= a && 100 >= a)
            this.maxListeners = a;
        return this
    };
    Emitter.prototype.once = function(a, b) {
        function c() {
            d.removeListener(a, c);
            b.apply(this, arguments)
        }

        if("function" !== typeof b)
            throw Error(".once only takes instances of Function");
        var d = this;
        c.listener = b;
        d.on(a, c);
        return this
    };
    Emitter.prototype.on = function(a, b) {
        if("string" === typeof a && "function" === typeof b) {
            if(this.listiners.hasOwnProperty(a)) {
                if(this.listiners[a].length >= this.maxListeners)
                    throw "To mant listiners been attached.";
            } else
                this.listiners[a] = [];
            this.listiners[a].push(b)
        }
        return this
    };
    Emitter.prototype.listListeners = function(a) {
        if("string" === typeof a)
            return this.listiners.hasOwnProperty(a) ? this.listiners[a] : []
    };
    Emitter.prototype.removeListener = function(a, b) {
        if(this.listiners.hasOwnProperty(a)) {
            for(var c = this.listiners[a], d = c.length - 1; 0 <= d; d--)
            if(c[d] === b) {
                c.splice(d, 1);
                break
            }0 === c.length &&
            delete this.listiners[a]
        }
        return this
    };
    return {
        EventEmitter : Emitter
    };
})