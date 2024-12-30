/* eslint-disable import/no-commonjs */
/* eslint-env es6 */

const terser = require('@rollup/plugin-terser');
const pkg = require('./package.json');

const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * ${pkg.homepage}
 * (c) ${new Date().getFullYear()} Chart.js Contributors
 * Released under the ${pkg.license} license
 */`;

module.exports = [
	{
		input: 'src/index.js',
		output: {
			file: `dist/${pkg.name}.js`,
			banner,
			format: 'umd',
			name: 'Chart',
			indent: false,
			globals: {
				'chart.js2': 'Chart'
			}
		},
		external: [
			'chart.js2'
		]
	},
	{
		input: 'src/index.js',
		output: {
			file: `dist/${pkg.name}.min.js`,
			format: 'umd',
			name: 'Chart',
			indent: false,
			globals: {
				'chart.js2': 'Chart'
			}
		},
		plugins: [
			terser({
				output: {
					preamble: banner
				}
			})
		],
		external: [
			'chart.js2'
		]
	}
];
