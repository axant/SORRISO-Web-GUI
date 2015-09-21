;
(function (win) {
    var _debug = false;
    var _target = null;

    var update = function () {
        log('Updating...');
        $.simpleWeather({
            location: 'Torino, TO',
            woeid: '',
            unit: 'c',
            success: function (weather) {
                log('Updated ' + weather.temp);
                var html  = '<i class="weather-icon-' + weather.code + '"></i> ';
                    html += '<div class="weather-data">';
                    html +=   '<span class="weather-data-temp">' + weather.temp + '&deg;' + '</span>';
                    html +=   '<span class="weather-data-date">' + moment().format('L') + '</span>';
                    html += '</div>';
                $(_target).html(html);
            },
            error: function (error) {
                log('Error ' + error);
            }
        });
    };

    var log = function(msg) {
        if (_debug)
            console.log('Weather - ' + msg);
    };

    win.Weather = {
        init: function (target, debug) {
            if (_target)
                return;

            log('Init');
            _target = target;
            _debug = debug;

            update();
            setInterval(update, 60*5*1000);
        }
    };
})(window);