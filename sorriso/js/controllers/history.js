;
(function (win) {
    class HistoryController {
        constructor() {
            this.production_history = new ProductionHistoryChart({
                el: '#ractive-production-widget'
            });

            this.storage_history = new StorageHistoryChart({
                el: '#ractive-storage-widget'
            });
            let week_begin = moment().startOf('week').toDate();
            console.log('WHAT??', week_begin);
            let today = moment().startOf('day').toDate();
            this.get_history(week_begin, today);
            this.from_calendar = $('#from-calendar');
            this.from_calendar.datepicker({
                language: 'it',
                endDate: moment(today).subtract(1, 'days').toDate()
            }).on('changeDate', (e) => {
                let end_date = this.to_calendar.datepicker('getDate');
                if (moment(e['date']).isAfter(end_date) || moment(e['date']).isSame(end_date)) {
                    console.log('sopprima');
                    this.to_calendar.datepicker('setDate', moment(e['date']).add(1, 'days').toDate());
                }
            });
            this.to_calendar = $('#to-calendar');
            this.to_calendar.datepicker({
                language: 'it',
                endDate: today
            }).on('changeDate', (e) => {
                let start_date = this.from_calendar.datepicker('getDate');
                if (moment(e['date']).isBefore(start_date) || moment(e['date']).isSame(start_date)) {
                    console.log('sopprima');
                    this.from_calendar.datepicker('setDate', moment(e['date']).subtract(1, 'days').toDate());
                }
            });
            console.log("today", today);
            console.log("week_begin", week_begin);
            this.to_calendar.datepicker('setDate', today);
            this.from_calendar.datepicker('setDate', week_begin);


            document.getElementById("refresh-button").addEventListener("click", () => {
                let start_date = this.from_calendar.datepicker('getDate');
                let end_date = this.to_calendar.datepicker('getDate');
                this.get_history(start_date, end_date);
            });
        }

        get_history(start_date, end_date) {
            sorriso.DAL.get_history(start_date, end_date)
                .then(production_history => {
                    this.production_history.set('area2.values', production_history['production']);
                    this.production_history.set('area1.values', production_history['consumption']);
                    this.production_history.set('recap', production_history['recap']);
                });
            sorriso.DAL.get_lucciola_history(start_date, end_date)
                .then(storage_history => {
                    this.storage_history.set('values', storage_history);
                });
            win.sorriso.loadCompleted();
        }
    }

    var ProductionHistoryChart = LazyTemplateRactive.extend({
        template: `
    <div decorator="chart:{{area1.color}},{{area1.name}},{{area1.values}},{{area2.color}},{{area2.name}},{{area2.values}}"></div>
    <div class="chart-legend">
        <div><span style="background-color: {{area1.color}};">&nbsp;</span>{{area1.name}}</div>
        <div><span style="background-color: {{area2.color}};">&nbsp;</span>{{area2.name}}</div>
    </div>
        `,
        data: function () {
            return {
                area1: {name: 'Consumo', values: [], color: 'rgba(243, 120, 14, 0.7)'},
                area2: {name: 'Produzione', values: [], color: 'rgba(34, 8, 45, 0.7)'},
                recap: []
            }
        },
        decorators: {
            chart: function (node, area1_color, area1_name, area1, area2_color, area2_name, area2) {
                var widget = this;

                let chart_types = {};
                chart_types[area1_name] = 'area-spline';
                chart_types[area2_name] = 'area-spline';

                let area1_values = [area1_name].concat(area1);
                let area2_values = [area2_name].concat(area2);

                var chart = c3.generate({
                    bindto: node,
                    data: {
                        columns: [
                            area1_values,
                            area2_values
                        ],
                        types: chart_types
                    },
                    color: {
                        pattern: [area1_color, area2_color]
                    },
                    legend: {
                        show: false
                    },
                    axis: {
                        y: {
                            max: 3000,
                            padding: {top: 1},
                            tick: {
                                values: [0]
                            }
                        },
                        x: {
                            tick: {
                                format: function (v) {
                                    return '';
                                }
                            }
                        }
                    },
                    tooltip: {
                        contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
                            let recap = widget.get('recap');
                            let vals = recap[d[0].index];
                            return `<table class="ttip-info">
                                <tr><td>Produzione</td><td>${vals.production} <span class="ttip-unit">Wh</span></td></tr>
                                <tr><td>Consumo</td><td>${vals.consumption} <span class="ttip-unit">Wh</span></td></tr>
                                <tr><td>Autoconsumo</td><td>${vals.selfusage} <span class="ttip-unit">%</span></td></tr>
                            </table>`;
                        }
                    }
                });

                return {
                    update: function (__1, __2, area1, __3, __4, area2) {
                        let area1_values = [area1_name].concat(area1);
                        let area2_values = [area2_name].concat(area2);

                        chart.load({
                            columns: [
                                area1_values,
                                area2_values
                            ]
                        });
                    },
                    teardown: function () {
                        chart.destroy();
                    }
                }
            }
        }
    });
    var StorageHistoryChart = LazyTemplateRactive.extend({
        template: `
        <div class="history-chart-hover-container">
                <div class="history-chart battery-chart"
                     decorator="chart:{{values}}">
                </div>
                <div class="history-chart-hover">
                    <div class="history-chart-hover-overlay"></div>
                    <div class="history-chart-hover-line-container">
                        <div class="history-chart-hover-line"></div>
                    </div>
                </div>
            </div>
        `,
        data: function () {
            return {
                values: []
            }
        },
        decorators: {
            chart: function (node, values) {
                values = ['values'].concat(values);
                var chart = c3.generate({
                    bindto: node,
                    data: {
                        columns: [values],
                        type: 'spline'
                    },
                    legend: {
                        show: false
                    },
                    interaction: {
                        enabled: false
                    },
                    color: {pattern: ['rgba(34, 8, 45, 1.0)']},
                    axis: {
                        y: {
                            max: 100,
                            min: 0,
                            padding: {
                                top: 30,
                                bottom: 30
                            },
                            tick: {
                                values: [0, 50, 100],
                                format: function (v) {
                                    return v + '%';
                                }
                            }
                        },
                        x: {
                            show: false
                        }
                    }
                });
                return {
                    update: function (values) {
                        values = ['values'].concat(values);
                        chart.load({
                            columns: [values],
                            unload: ['values']
                        })
                    },
                    teardown: function () {
                        chart.destroy();
                    }
                };
            }
        }
    });
    win.HistoryController = HistoryController;

})(window);