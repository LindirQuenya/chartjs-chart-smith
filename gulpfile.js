/* eslint-disable import/no-nodejs-modules, import/no-commonjs, no-use-before-define */

import gulp from 'gulp';
import eslint from 'gulp-eslint';
import file from 'gulp-file';
import path from 'path';
import {execFile} from 'child_process';
import pkg from './package.json' with  { type: "json" };
import yargs from 'yargs';

const argv = yargs
	.option('output', {alias: 'o', default: 'dist'})
	.option('docs-dir', {default: 'docs'})
	.option('www-dir', {default: 'www'})
	.argv;

function run(bin, args) {
	return new Promise((resolve, reject) => {
		const src = new URL(import.meta.resolve(bin)).pathname;
		const ps = execFile(process.execPath, [src, ...args.filter((arg) => arg !== undefined)]);

		ps.stdout.pipe(process.stdout);
		ps.stderr.pipe(process.stderr);
		ps.on('close', (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});
}

gulp.task('build', () => run('rollup/dist/bin/rollup', ['--bundleConfigAsCjs', '-c', argv.watch ? '--watch' : undefined]));

gulp.task('lint', () => {
	const files = [
		'src/**/*.js',
		'test/**/*.js',
		'*.js'
	];

	return gulp.src(files)
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('docs', () => {
	const mode = argv.watch ? 'dev' : 'build';
	const out = path.join(argv.output, argv.docsDir);
	const args = argv.watch ? '' : '--dest ' + out;
	return run('vuepress', [mode, 'docs', args]);
});

gulp.task('bower', () => {
	const json = JSON.stringify({
		name: pkg.name,
		description: pkg.description,
		homepage: pkg.homepage,
		license: pkg.license,
		version: pkg.version,
		main: argv.output + '/' + pkg.name + '.js'
	}, null, 2);

	return file('bower.json', json, {src: true})
		.pipe(gulp.dest('./'));
});

gulp.task('default', gulp.parallel('build'));
