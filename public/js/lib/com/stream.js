define(['parser/index', 'core/utils'], function(parser, utils) {
    var Stream = parser.Stream;

    var ComStream = function() {
        Stream.apply(this, arguments)
        this.buff = [];
    }

    utils.inherits(ComStream, Stream);

    ComStream.prototype.write = function(packet) {
        this.buff.push(packet);
        return this;
    }
    ComStream.prototype.next = function(fn) {
        fn(this.buff);
    }
    return ComStream;
})