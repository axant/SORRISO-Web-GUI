Ractive.DEBUG = DEBUG;

var LazyTemplateRactive = Ractive.extend({
    onconstruct: function(options) {
        /* This is just to lazily load template only when we are in home page */
        if (document.getElementById(this.templateId) !== null)
            options.template = `#${this.templateId}`;
    }
});


var ValueBoxWidget = Ractive.extend({
    template: '<span class="valuebox-value">{{value}}</span><span class="valuebox-unit">{{unit}}</span><span class="valuebox-minus">{{minus}}</span>',
    data: {
        value: '-',
        unit: '?',
        minus: ''
    }
});


var TwoAreasChartWidget = Ractive.extend({
        template: `
    <div decorator="areachart:{{area1.color}},{{area1.name}},{{area1.values}},{{area2.color}},{{area2.name}},{{area2.values}}"></div>
    <div class="chart-legend">
        <div><span style="background-color: {{area1.color}};">&nbsp;</span>{{area1.name}}</div>
        <div><span style="background-color: {{area2.color}};">&nbsp;</span>{{area2.name}}</div>
    </div>
        `,
        data: function() { return {
            area1: {
                name: '',
                values: [],
                color: 'red'
            },
            area2: {
                name: '',
                values: [],
                color: 'green'
            }
        } },
        decorators: {
            areachart: function(node, area1_color, area1_name, area1, area2_color, area2_name, area2) {
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
                            max: 100,
                            padding: { top: 1 },
                            tick: {
                                values: [0, 100]
                            }
                        },
                        x: {
                            tick: {
                                values: []
                            }
                        }
                    }
                });

                return {
                    update: function(__1, __2, area1, __3, __4, area2) {
                        let chart_types = {};
                        chart_types[area1_name] = 'area-spline';
                        chart_types[area2_name] = 'area-spline';

                        let area1_values = [area1_name].concat(area1);
                        let area2_values = [area2_name].concat(area2);

                        chart.load({
                            columns: [
                                area1_values,
                                area2_values
                            ],
                            unload: [area1_name, area2_name]
                        })
                    },
                    teardown: function() { chart.destroy(); }
                }
            }
        }
    });
