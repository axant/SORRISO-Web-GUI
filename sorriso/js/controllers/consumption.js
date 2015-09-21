;
(function (win) {
    class ConsumptionController {
        constructor() {
            this.consumption_widget = new ConsumptionWidget();
            this.total_conumption = new ValueBoxWidget({el: 'total-consumption', data: {unit: 'Wh'}});
            this.devices_consumption = new ValueBoxWidget({el: 'devices-consumption', data: {unit: 'Wh'}});
            this.others_consumption = new ValueBoxWidget({el: 'others-consumption', data: {unit: 'Wh'}});
            this.instant_expense = new ValueBoxWidget({el: 'consumption-instant-expense', data: {unit: '€', minus:'/h'}});
            this.instant_expense_bar = new BarMeterWidget({el: 'consumption-instant-expense-bar'});
            this.weekly_expense = new ValueBoxWidget({el: 'consumption-weekly-expense', data: {unit: '€'}});
            this.weekly_expense_bar = new BarMeterWidget({el: 'consumption-weekly-expense-bar'});
            this.weekly_saving = new ValueBoxWidget({el: 'consumption-weekly-saving', data: {unit: '€'}});
            this.weekly_saving_bar = new BarMeterWidget({el: 'consumption-weekly-saving-bar'});
            this.weekly_chart = new TwoAreasChartWidget({el: 'consumption-weekly-graph', data: {
                area1: {name: 'Scorsa settimana', values: [], color: 'rgba(243, 120, 14, 0.7)'},
                area2: {name: 'Questa settimana', values: [], color: 'rgba(34, 8, 45, 0.7)'}
            }});

            this.get_data()
        }

        get_data() {
            sorriso.DAL.get_consumption_instant_data()
                .then(response => {
                    this.consumption_widget.set('value', response);
                    this.total_conumption.set('value', response.total.level);
                    this.devices_consumption.set('value', response.devices.level);
                    this.others_consumption.set('value', response.others.level);
                })
                .then(() => {
                    return sorriso.DAL.get_consumption_weekly_data();
                })
                .then(weekly_data => {
                    this.instant_expense.set('value', weekly_data.totals.expense.level);
                    this.weekly_expense.set('value', weekly_data.totals.weekly_expense.level);
                    this.weekly_saving.set('value', weekly_data.totals.weekly_saving.level);

                    this.instant_expense_bar.set('percentage', weekly_data.totals.expense.percentage);
                    this.weekly_expense_bar.set('percentage', weekly_data.totals.weekly_expense.percentage);
                    this.weekly_saving_bar.set('percentage', weekly_data.totals.weekly_saving.percentage);

                    this.weekly_chart.set('area1.values', weekly_data.daily.past);
                    this.weekly_chart.set('area2.values', weekly_data.daily.current);
                })
                .then(() => {
                    sorriso.loadCompleted();
                    setTimeout(() => { this.get_data() }, sorriso.caches.MEDIUM_TERM_EXPIRATION);
                });
        }
    }

    var ConsumptionWidget = LazyTemplateRactive.extend({
        templateId: 'consumption-widget-template',
        el: '#consumption-diagram',
        append: true,
        data: function() { return {
            value: {
                others: { percentage: 30 },
                devices: { percentage: 70 },
                total: { percentage: 90 }
            }
        } },
        decorators: {
            progress: function (node, percentage) {
                var options = {
                    strokeWidth: 10,
                    duration: 800,
                    easing: 'bounce',
                    svgStyle: {
                        transform: 'rotate(180deg)',
                        '-webkit-transform': 'rotate(180deg)'
                    }
                };

                var progress_circle = new ProgressBar.Circle(node, options);
                progress_circle.animate(percentage/200);

                return {
                    update: function(percentage) {
                        progress_circle.animate(percentage/200);
                    },
                    teardown: function() {
                        progress_circle.destroy();
                    }
                };
            }
        }
    });

    var BarMeterWidget = Ractive.extend({
        template: `
<div class="bar-meter-widget">
    {{#each range(1, level)}}
        <div class="bar-lvl-{{level - this + 1}}"></div>
    {{/each}}
</div>`,
        data: {
            percentage: 0,
            precision: 6,
            level: 0,
            range: function(low, high) {
                let range = [];
                for (let i=low; i<=high; i+=1) {
                    range.push(i);
                }
                return range;
            }
        },
        oninit: function() {
            var update_level = function() {
                let precision = this.get('precision');
                let percentage = this.get('percentage');

                let level = Math.ceil(precision / 100 * percentage);
                this.set('level', level);
            };

            this.observe('precision', update_level);
            this.observe('percentage', update_level);
        }
    });

    win.ConsumptionController = ConsumptionController
})(window);