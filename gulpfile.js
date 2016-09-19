/**
 * @file Gulpfile
 */

// Require gulp and the needed plugins
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var typescript = require('gulp-typescript');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var del = require('del');
var tslint = require('gulp-tslint');

/***** clean:build ******************************
 * Deletes all the files of the "dist" directory.
 */
gulp.task('clean:build', function (done) {
	del.sync(['dist/**/*'], { force: true });
	done();
});

/***** build **************************************************************
 * Check if the TypeScript files are compilent to the linter configuration,
 * then compile them all into a single output file, with source maps aside.
 */
gulp.task('build', ['clean:build'], function() {

	var project = typescript.createProject('tsconfig.json', { sortOutput: true });

	var tsResult = project.src()
		.pipe(sourcemaps.init())
		.pipe(tslint({
			formater: 'prose'
		}))
		.pipe(tslint.report({
			emitError: false
		}))
		.pipe(typescript(project));

	return tsResult.js
		.pipe(sourcemaps.write('maps/'))
		.pipe(gulp.dest('dist/'));
});

/***** minify ***********************************
 * Create a smaller version of the "syllabes.js".
 */
gulp.task('minify', ['build'], function (callback) {
	return gulp.src('dist/syllabes.js')
		.pipe(uglify({
			preserveComments: 'license'
		}))
		.pipe(concat('syllabes.min.js'))
		.pipe(gulp.dest('dist/'));
});

/***** watch **********************************************
 * Watches in real-time for any change in the source files,
 * and launches the build process when it occurs.
 */
gulp.task('watch', function() {
	gulp.watch('src/**/*.ts', ['build']);
});

/***** default ***********************************************
 * Build by default a production-ready version of the library.
 */
gulp.task('default', ['minify']);