
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
