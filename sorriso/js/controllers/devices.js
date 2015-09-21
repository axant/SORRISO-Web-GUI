;
(function (win) {
    class DevicesController {
        constructor() {
            this.devices = new DevicesContainer({el: '#ractive-widget'});
            this.get_devices();
            document.getElementById("refresh-devices").addEventListener("click", () => {
                this.get_devices()
            });
            this.devices_history_cache = {
                last_update: null,
                entries: {}
            };
        }

        get_devices() {
            sorriso.DAL.get_devices_with_consumption()
                .then(devices => {
                    let cache = this.devices_history_cache;
                    let cache_last_update = this.devices_history_cache.last_update;

                    return Promise.all(function *() {
                        if (sorriso.cache_is_expired('LONG_TERM_EXPIRATION', cache_last_update)) {
                            for (let device of devices) {
                                yield sorriso.DAL.get_device_sevendays_history(device)
                                    .then((device_history) => {
                                        cache.last_update = moment();
                                        cache.entries[device.device['dal.device.UID']] = device_history;
                                        device.history = device_history;
                                        return device;
                                    });
                            }
                        }
                        else {
                            for (let device of devices) {
                                device.history = cache.entries[device.device['dal.device.UID']];
                                yield device;
                            }
                        }
                    }());
                })
                .then(devices => {
                    this.devices.set('devices', devices);
                    win.sorriso.loadCompleted();
                    setTimeout(() => {
                        this.get_devices()
                    }, sorriso.caches.MEDIUM_TERM_EXPIRATION);
                });
        }
    }

    win.DevicesController = DevicesController;

    var MasterDeviceTemplate = LazyTemplateRactive.extend({
        data: function() { return {
            history_view: false,
            name_editing: false,
            location_editing: false,
            editing_name: "",
            editing_location: "",
            values: [],
            history_icon: (history_view) => {
                return history_view ? "img/devices/home.png" : "img/devices/history.png"
            },
            history_button: (history_view) => {
                return history_view ? "img/devices/back-arrow.png" : "img/devices/arrow.png"
            }
        } },
        oninit: function (options) {
            this.observe('device.name', (newValue, oldValue, keypath) => {
                this.set('editing_name', newValue);
            });
            this.on('save_name_editing', () => {
                this.set('name_editing', false);
                this.set('device.name', this.get('editing_name'));
            });
            this.observe('device.location', (newValue, oldValue, keypath) => {
                this.set('editing_location', newValue);
            });
            this.on('save_location_editing', () => {
                this.set('location_editing', false);
                this.set('device.location', this.get('editing_location'));
            });
        },
        decorators: {
            status: function (node, status) {
                $(node).bootstrapSwitch({
                    size: "small",
                    state: status
                });
                return {
                    update: function (status) {
                        $(node).bootstrapSwitch("state", status);
                    },
                    teardown: function () {
                        $(node).bootstrapSwitch("destroy");
                    }
                };
            },
            progress: function (node, percentage, progress_type) {
                var ProgressType = ProgressBar[progress_type];
                var options = {
                    color: '#FFA100',
                    strokeWidth: 7,
                    duration: 800,
                    easing: 'bounce'
                };

                if (progress_type === 'Circle')
                    options.svgStyle = {
                        transform: 'rotate(180deg)',
                        '-webkit-transform': 'rotate(180deg)'
                    };
                else if (progress_type === 'Line')
                    options.svgStyle = {
                        transform: 'rotate(270deg)',
                        '-webkit-transform': 'rotate(270deg)'
                    };

                var progress_circle = new ProgressType(node, options);
                progress_circle.animate(percentage / 100);

                return {
                    update: function (percentage) {
                        progress_circle.animate(percentage / 100);
                    },
                    teardown: function () {
                        progress_circle.destroy();
                    }
                };
            },
            chart: function (node, type, values, color) {
                values = ['values', 0].concat(values);
                let xaxis = {
                    tick: {
                        values: []
                    }
                };

                let yaxis_tick = {
                    values: [0, 100]
                };

                /* Breaks HEIGHT when visibile */
                if (type === 'spline') {
                    xaxis.show = false;
                    yaxis_tick.values = [0, 50, 100];
                    yaxis_tick.format = function(v) { return v+'%'; }
                }

                var chart = c3.generate({
                    bindto: node,
                    data: {
                        columns: [values],
                        type: type
                    },
                    legend: {
                        show: false
                    },
                    color: {pattern: [color]},
                    axis: {
                        y: {
                            max: 100,
                            min: 0,
                            padding: {
                                top: 1,
                                bottom: 0
                            },
                            tick: yaxis_tick
                        },
                        x: xaxis
                    }
                });
                return {
                    update: function (percentage) {
                    },
                    teardown: function () {
                        chart.destroy();
                    }
                };
            }
        }
    });


    var SmartPlugWidget = MasterDeviceTemplate.extend({
        templateId: 'smart-plug-widget-template'
    });
    var CounterWidget = MasterDeviceTemplate.extend({
        templateId: 'counter-widget-template'
    });
    var BatteryWidget = MasterDeviceTemplate.extend({
        templateId: 'battery-widget-template'
    });
    var OtherDeviceWidget = MasterDeviceTemplate.extend({
        templateId: 'other-device-widget-template'
    });

    var DevicesContainer = LazyTemplateRactive.extend({
        templateId: 'devices-container-template',
        components: {
            SmartPlugWidget: SmartPlugWidget,
            CounterWidget: CounterWidget,
            BatteryWidget: BatteryWidget,
            OtherDeviceWidget: OtherDeviceWidget
        }
    });


})(window);