import {Chart, LineController} from 'chart.js';

const helpers = Chart.helpers;
const resolve = helpers.resolve;
const valueOrDefault = helpers.valueOrDefault;

export default class SmithController extends LineController {
	static id = 'smith';
	// Not needed since there is only a single scale
	// eslint-disable-next-line class-methods-use-this, no-empty-function
	linkScales() {}
	update(mode) {
		return;
		const meta = this._cachedMeta;
		const {dataset: line, data: points = [], _dataset} = meta;
		// @ts-ignore
		const animationsDisabled = this.chart._animationsDisabled;
		let {start, count} = _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);

		this._drawStart = start;
		this._drawCount = count;

		if (_scaleRangesChanged(meta)) {
			start = 0;
			count = points.length;
		}

		// Update Line
		line._chart = this.chart;
		line._datasetIndex = this.index;
		line._decimated = !!_dataset._decimated;
		line.points = points;

		const options = this.resolveDatasetElementOptions(mode);
		if (!this.options.showLine) {
			options.borderWidth = 0;
		}
		options.segment = this.options.segment;
		this.updateElement(line, undefined, {
			animated: !animationsDisabled,
			options
		}, mode);

		// Update Points
		this.updateElements(points, start, count, mode);
	}

	updateElements(points, start, count, mode) {
		const reset = mode === 'reset';
		const {iScale, vScale, _stacked, _dataset} = this._cachedMeta;
		const {sharedOptions, includeOptions} = this._getSharedOptions(start, mode);
		const iAxis = iScale.axis;
		const vAxis = vScale.axis;
		const {spanGaps, segment} = this.options;
		const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
		const directUpdate = this.chart._animationsDisabled || reset || mode === 'none';
		const end = start + count;
		const pointsCount = points.length;
		let prevParsed = start > 0 && this.getParsed(start - 1);

		for (let i = 0; i < pointsCount; ++i) {
			const point = points[i];
			const properties = directUpdate ? point : {};

			if (i < start || i >= end) {
				properties.skip = true;
				continue;
			}

			const parsed = this.getParsed(i);
			const nullData = isNullOrUndef(parsed[vAxis]);
			const iPixel = properties[iAxis] = iScale.getPixelForValue(parsed[iAxis], i);
			const vPixel = properties[vAxis] = reset || nullData ? vScale.getBasePixel() : vScale.getPixelForValue(_stacked ? this.applyStack(vScale, parsed, _stacked) : parsed[vAxis], i);

			properties.skip = isNaN(iPixel) || isNaN(vPixel) || nullData;
			properties.stop = i > 0 && (Math.abs(parsed[iAxis] - prevParsed[iAxis])) > maxGapLength;
			if (segment) {
				properties.parsed = parsed;
				properties.raw = _dataset.data[i];
			}

			if (includeOptions) {
				properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? 'active' : mode);
			}

			if (!directUpdate) {
				this.updateElement(point, i, properties, mode);
			}

			prevParsed = parsed;
		}
	}
	updateElement_single(point, index, mode) {
		const me = this;
		const meta = me.getMeta();
		const custom = point.custom || {};
		const datasetIndex = me.index;
		const yScale = me.getScaleForId(meta.yAxisID);
		const xScale = me.getScaleForId(meta.xAxisID);
		const lineModel = meta.dataset._model;

		const options = me._resolvePointOptions(point, index);
		const {x, y} = me.calculatePointPosition(index);

		// Utility
		point._xScale = xScale;
		point._yScale = yScale;
		point._options = options;
		point._datasetIndex = datasetIndex;
		point._index = index;

		// Desired view properties
		this.updateElement(point, index, {
			x,
			y,
			skip: custom.skip || isNaN(x) || isNaN(y),
			// Appearance
			radius: options.radius,
			pointStyle: options.pointStyle,
			rotation: options.rotation,
			backgroundColor: options.backgroundColor,
			borderColor: options.borderColor,
			borderWidth: options.borderWidth,
			tension: valueOrDefault(custom.tension, lineModel ? lineModel.tension : 0),
			steppedLine: lineModel ? lineModel.steppedLine : false,
			// Tooltip
			hitRadius: options.hitRadius
		}, mode);
	}

	/**
	 * @private
	 */
	_resolvePointOptions(element, index) {
		const me = this;
		const chart = me.chart;
		const dataset = chart.data.datasets[me.index];
		const custom = element.custom || {};
		const options = chart.options.elements.point;
		const values = {};
		let i, ilen, key;

		// Scriptable options
		const context = {
			chart,
			dataIndex: index,
			dataset,
			datasetIndex: me.index
		};

		const ELEMENT_OPTIONS = {
			backgroundColor: 'pointBackgroundColor',
			borderColor: 'pointBorderColor',
			borderWidth: 'pointBorderWidth',
			hitRadius: 'pointHitRadius',
			hoverBackgroundColor: 'pointHoverBackgroundColor',
			hoverBorderColor: 'pointHoverBorderColor',
			hoverBorderWidth: 'pointHoverBorderWidth',
			hoverRadius: 'pointHoverRadius',
			pointStyle: 'pointStyle',
			radius: 'pointRadius',
			rotation: 'pointRotation'
		};
		const keys = Object.keys(ELEMENT_OPTIONS);

		for (i = 0, ilen = keys.length; i < ilen; ++i) {
			key = keys[i];
			values[key] = resolve([
				custom[key],
				dataset[ELEMENT_OPTIONS[key]],
				dataset[key],
				options[key]
			], context, index);
		}

		return values;
	}

	calculatePointPosition(dataIndex) {
		const scale = this.chart.scale;
		const data = this.getDataset().data[dataIndex];
		return scale.getPointPosition(data.x, data.y);
	}
	parse(start, count) {
		const data = this.getDataset().data;
		const meta = this._cachedMeta;

		if (this._parsing === false) {
			meta._parsed = data;
		} else {
			let i, ilen;
			for (i = start, ilen = start + count; i < ilen; ++i) {
				meta._parsed[i] = data[i];
			}
		}
	}
}
