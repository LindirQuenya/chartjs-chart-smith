'use strict';

import Chart from 'chart.js2';
import Controller from './controller';
import Scale, {defaults} from './scale';

// Register the Controller and Scale
Chart.controllers.smith = Controller;
Chart.defaults.smith = {
	aspectRatio: 1,
	scale: {
		type: 'smith',
	},
	tooltips: {
		callbacks: {
			title: () => null,
			label: (bodyItem, data) => {
				const dataset = data.datasets[bodyItem.datasetIndex];
				const d = dataset.data[bodyItem.index];
				const digits = dataset.display_precision ?? 4;
				if (dataset.label_polar !== true) {
					return dataset.label + ': ' + d.f + ": " +
						d.x.toFixed(digits) + (d.y < 0 ? '-' : '+') + Math.abs(d.y).toFixed(digits) + 'j';
				} else {
					const mag = 20 * Math.log10(Math.hypot(d.x, d.y));
					const phi_d = (180/Math.PI) * Math.atan2(d.y, d.x);
					return dataset.label + ': ' + d.f + ": " + mag.toFixed(digits) + 'dB\u{2220}' + phi_d.toFixed(digits) + '\u{00B0}';
				}
			}
		}
	}
};
Chart.scaleService.registerScaleType('smith', Scale, defaults);
