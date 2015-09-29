
import gulp from 'gulp';
import del from 'del';
import gulpLoadPlugins from 'gulp-load-plugins';
import path from 'path';
import minimist from 'minimist';
import runSequence from 'run-sequence';
import config from './config';

const $ = gulpLoadPlugins();
const argv = minimist(process.argv.slice(2));
const RELEASE = !!argv.release;
const AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

let src = {};
let watch = false;


// The default task
gulp.task('default', ['serve']);

// Clean up
gulp.task('clean', del.bind(null, [config.core.paths.publicPath]));

// Assets 
gulp.task('assets', () => {
  src.assets = config.core.paths.corePath + '/assets/**/*.*';
  return gulp.src(src.assets)
    .on('error', console.error.bind(console))
    .pipe(gulp.dest(config.core.paths.publicPath))
    .pipe($.size({title: 'assets'}));
});

// Styles
gulp.task('styles:vendor', () => {
  src.vendorStyles = config.core.paths.stylesPath + '/vendor/*.{css,scss}';
  return gulp.src(src.vendorStyles)
    .pipe($.plumber())
    .pipe($.sass({
      sourceMap: !RELEASE,
      sourceMapBasepath: __dirname
    }))
    .on('error', console.error.bind(console))
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe($.csscomb())
    .pipe($.minifyCss())
    .pipe(gulp.dest(config.core.paths.publicPath + '/css/vendor/'))
    .pipe($.size({title: 'vendor styles'}));
});

gulp.task('styles', ['styles:vendor'], () => {
  src.styles = config.core.paths.stylesPath + '/*.{css,scss}';
  return gulp.src(src.styles)
    .pipe($.plumber())
    .pipe($.sass({
      sourceMap: !RELEASE,
      sourceMapBasepath: __dirname
    }))
    .on('error', console.error.bind(console))
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe($.csscomb())
    .pipe($.concat('main.css'))
    .pipe($.minifyCss())
    .pipe(gulp.dest(config.core.paths.publicPath + '/css/'))
    .pipe($.size({title: 'styles'}));
});

gulp.task('build', ['clean'], (cb) => {
  runSequence(['assets', 'styles'], cb);
});

gulp.task('serve', ['build'], () => {
  $.nodemon({
    exec: 'babel-node index.js',
    ext: 'js hbs scss css',
    env: { 'NODE_ENV': 'development' },
    tasks: runSequence('build', () => {
      gulp.watch(src.styles, ['styles']);
      gulp.watch(src.scripts, ['bundle']);
    })
  });
});
