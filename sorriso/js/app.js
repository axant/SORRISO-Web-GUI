;(function(win) {
    moment.locale('it');

    class Sorriso {
        constructor(debug) {
            this.debug = debug;
            this.weather = Weather;
            this.DAL = new DataAbstractionLayer();
            this.controllers = {
                'devices': DevicesController,
                'home': HomeController,
                'consumption': ConsumptionController,
                'history': HistoryController
            };
            this.controller = null;

            this.caches = {
                MEDIUM_TERM_EXPIRATION: 5*60*1000,
                LONG_TERM_EXPIRATION: 24*3600*1000
            };

            if (debug) {
                /* Debug mode refreshes caches more often */
                this.caches.MEDIUM_TERM_EXPIRATION = 10000;
                this.caches.LONG_TERM_EXPIRATION = 30000;
            }
        }

        log(tag, msg) {
            if (this.debug)
                console.log(tag + ' - ' + msg);
        }
        
        cache_is_expired(cachekey, cache_last_update) {
            return (cache_last_update === null ||
                moment().diff(cache_last_update) > this.caches[cachekey]);
        }

        run(page) {
            let ControllerClass = this.controllers[page];
            if (ControllerClass)
                this.controller = new ControllerClass();
            this.weather.init('#weather', this.debug);
        }

        loadCompleted() {
            $('#page-loader').hide();
        }
    }

    win.sorriso = new Sorriso(DEBUG);
})(window);