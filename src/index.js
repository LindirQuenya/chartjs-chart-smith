'use strict';

import Chart from 'chart.js';
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
				if (d.label_polar !== true) {
					return dataset.label + ': ' + d.f + ": " +
						d.x.toFixed(4) + (d.y < 0 ? '-' : '+') + Math.abs(d.y).toFixed(4) + 'j';
				} else {
					const mag = 20 * Math.log10(Math.hypot(d.x, d.y));
					const phi_d = (180/Math.PI) * Math.atan2(d.y, d.x);
					return dataset.label + ': ' + d.f + ": " + mag.toFixed(4) + 'dB\u{2220}' + phi_d.toFixed(4) + '\u{00B0}';
				}
			}
		}
	}
};
Chart.scaleService.registerScaleType('smith', Scale, defaults);
