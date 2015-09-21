;
(function (win) {
    class HomeController {
        constructor() {
            this.energy_flow = new EnergyFlowWidget();
            this.lucciola_widget = new HomeWidget({data:{
                id: 'lucciola',
                name: 'STORAGE LUCCIOLA',
                icon: 'home/storage.png',
                progress_type: 'Line'
            }});
            this.consumption_widget = new HomeWidget({data: {
                id: 'house-consumption',
                name: 'CONSUMI',
                icon: 'home/consumi.png'
            }});
            this.production_widget = new HomeWidget({data: {
                id: 'solar-production',
                name: 'PRODUZIONE FOTOVOLTAICO',
                icon: 'home/produzione.png'
            }});
            this.energy_widget = new HomeWidget({data: {
                id: 'sold-energy',
                name:' ENERGIA CEDUTA ALLA RETE',
                icon: 'home/energia.png'
            }});
            this.weekly_consumption = new ValueBoxWidget({el: 'home-weekly-consume', data: {unit: '%'}});
            this.weekly_expense = new ValueBoxWidget({el: 'home-weekly-expense', data: {unit: '€'}});
            this.weekly_chart = new TwoAreasChartWidget({el: 'home-solar-graph', data: {
                area1: {name: 'Previsione', values: [], color: 'rgba(243, 120, 14, 0.7)'},
                area2: {name: 'Produzione effettiva', values:[], color: 'rgba(34, 8, 45, 0.7)'}
            }});

            this.news_widget = new NewsWidget();

            this.get_instant_data();
            this.start_updating_news();
        }

        start_updating_news() {
            sorriso.DAL.listen_for_news(news_entry => {
                this.news_widget.splice('news', 0, 0, news_entry);
            });
        }

        get_instant_data() {
            sorriso.DAL.get_pvmeter_data()
                .then(response => {
                    this.consumption_widget.set('value', response.consumption);
                    this.production_widget.set('value', response.production);
                    this.lucciola_widget.set('value', response.lucciola);
                    this.energy_widget.set('value', response.energy);
                })
                .then(() => {
                    return sorriso.DAL.get_weekly_consume().then(resp => {
                        this.weekly_consumption.set('value', resp.value);
                    });
                })
                .then(() => {
                    return sorriso.DAL.get_weekly_expense().then(resp => {
                        this.weekly_expense.set('value', resp.value);
                    });
                })
                .then(() => {
                    return sorriso.DAL.get_weekly_prevision_comparison().then(resp => {
                        this.weekly_chart.set('area1.values', resp.prevision);
                        this.weekly_chart.set('area2.values', resp.actual);
                    });
                })
                .then(() => {
                    return sorriso.DAL.get_energy_flow().then(resp => {
                        this.energy_flow.set('lucciola_draining', resp.lucciola_draining);
                        this.energy_flow.set('producing_energy', resp.producing_energy);
                        this.energy_flow.set('lucciola_recharging', resp.lucciola_recharging);
                        this.energy_flow.set('direct_consumption', resp.direct_consumption);
                        this.energy_flow.set('consuming_energy', resp.consuming_energy);
                    });
                })
                .then(() => {
                    sorriso.loadCompleted();
                    setTimeout(() => { this.get_instant_data() }, sorriso.caches.MEDIUM_TERM_EXPIRATION);
                })
        }
    }

    var NewsWidget = LazyTemplateRactive.extend({
        templateId: 'home-news-template',
        el: '#home-news',
        append: true,
        data: function() { return {
            news: [],
            format_date: function(d) {
               return moment(d).format('L');
            }
        } }
    });

    var EnergyFlowWidget = LazyTemplateRactive.extend({
        templateId: 'home-energyflow-template',
        el: '#home-diagram',
        append: true,
        data: {
            id: "home-energyflow",
            lucciola_draining: false,
            producing_energy: false,
            lucciola_recharging: false,
            direct_consumption: false,
            consuming_energy: false
        }
    });

    var HomeWidget = LazyTemplateRactive.extend({
        templateId: 'home-widget-template',
        el: '#home-diagram',
        append: true,
        data: function() { return {
            id: null,
            icon: null,
            name: null,
            progress_type: 'Circle',
            value: {level: null, unit: null, percentage: 0}
        } },
        decorators: {
            progress: function (node, percentage, progress_type) {
                var ProgressType = ProgressBar[progress_type];
                var options = {
                    color: '#FFA100',
                    strokeWidth: 7,
                    duration: 800,
                    easing: 'bounce'
                };

                if (progress_type === 'Circle')
                    options.svgStyle = { transform: 'rotate(180deg)',
                                         '-webkit-transform': 'rotate(180deg)'};
                else if (progress_type === 'Line')
                    options.svgStyle = { transform: 'rotate(270deg)',
                                         '-webkit-transform': 'rotate(270deg)'};

                var progress_circle = new ProgressType(node, options);
                progress_circle.animate(percentage/100);

                return {
                    update: function(percentage) {
                        progress_circle.animate(percentage/100);
                    },
                    teardown: function() {
                        progress_circle.destroy();
                    }
                };
            }
        }
    });

    win.HomeController = HomeController
})(window);