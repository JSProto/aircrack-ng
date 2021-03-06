
jQuery(function($) {

    $.ajaxSetup({
        error: function(jqXHR, status, thrownError) {
            let response = jqXHR.responseText;

            try {
                response = $.parseJSON(response);
                console.error(response.error);
                console.log(response.stack);
            } catch (e) {
                console.log(response);
            }
        }
    });

    var socket = io.connect('http://' + location.hostname + ':' + location.port + '/ws/job');

    var onStatus = function(apName, iface, info, job) {
        console.log(info, job)
        $('#packet-data').html('<strong>IVs: </strong>' + info.networkInfo.packets.data)
        $('#arp-pps').html('<strong>Packet/s: </strong>' + info.arpInfo.pps)
        $('#crack-keys').html('<strong>Tested Keys: </strong>' + info.crackinfo.keys)
        $('#crack-ivs').html('<strong>Crack IVs: </strong>' + info.crackinfo.ivs)


        $('#current-ap-name').html('<strong>Current AP Name: </strong>' + apName)
        $('#current-ap-chan').html('<strong>Current AP Channel: </strong>' + info.networkInfo.channel)
        $('#current-ap-bssid').html('<strong>Current AP BSSID: </strong>' + info.networkInfo.BSSID)
        $('#current-ap-encryption').html('<strong>Current AP Encryption: </strong>' + info.networkInfo.SSID.encryption)

        $('#current-iface').html('<strong>Current iFace: </strong>' + iface)
        $('#current-iface-given').html('<strong>Current Given iFace: </strong>' + job.current.given)
        $('#current-iface-nik').html('<strong>Current Device: </strong>' + job.current.nik)

        $('#airmon-status-start').html('<strong>airmon-ng Status Msg: </strong>' + job.current.status)
    };

    socket.on('status', onStatus);

    socket.on('step', function(step) {
        console.log(step);
        $('#steps').append('<p>' + step + '</p>');
    });

    $('.start-job-form').submit(function() {

        var url = $.param({
            apName: $('.start-job-form #ap-name').val(),
            iface: $('.start-job-form #iface').val(),
            ourMac: $('.start-job-form #mac-of-iface').val(),
            minIvs: 15000
        });

        $.getJSON('/start?' + url).done(data => {
            $('.start-job').hide();
            $('.status-job').show();

            console.info(data);
        });

        return false;
    });
});
