define([], function() {
    var Browser = {};

    return (function() {

        var ua = navigator.userAgent.toLowerCase();
        var platform = navigator.platform.toLowerCase();
        var UA = ua.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/) || [null, 'unknown', 0], mode = UA[1] == 'ie' && document.documentMode;

        this.name = (UA[1] == 'version') ? UA[3] : UA[1];
        this.version = mode || parseFloat((UA[1] == 'opera' && UA[4]) ? UA[4] : UA[2]);
        this.Platform = {
            name : ua.match(/ip(?:ad|od|hone)/) ? 'ios' : (ua.match(/(?:webos|android)/) || platform.match(/mac|win|linux/) || ['other'])[0]
        };
        this.Features = {
            xpath : !!(document.evaluate),
            air : !!(window.runtime),
            query : !!(document.querySelector),
            json : !!(window.JSON),
            webSocket : !!(window.WebSocket),
            Worker : !!(window.Worker),
            localStorage : !!(window.localStorage),
            openDatabase : !!(window.openDatabase)
        };
        this.Plugins = {};

        this[this.name] = true;
        this[this.name + parseInt(this.version, 10)] = true;
        this.Platform[this.Platform.name] = true;
        var version = (function() {
            try {
                return navigator.plugins['Shockwave Flash'].description;
            } catch (e) {
                try {
                    return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
                } catch (es) {
                    return false;
                }
            }
        })()
        this.Plugins.Flash = {
            version : Number(version[0] || '0.' + version[1]) || 0,
            build : Number(version[2]) || 0
        };
        this.Features.xhr = !!(function() {

            try {
                return new XMLHttpRequest();
            } catch (e) {
                try {
                    return new ActiveXObject('MSXML2.XMLHTTP');
                } catch (e) {
                    try {
                        return new ActiveXObject('Microsoft.XMLHTTP');
                    } catch (e) {
                        return false;
                    }
                }
            }

        })();

        return this;
    }).call(Browser)
})