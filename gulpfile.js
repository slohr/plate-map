//npm init
//npm install --global gulp
//npm install --save-dev gulp gulp-concat gulp-uglify gulp-watch gulp-jshint gulp-rename gulp-sass gulp-notify gulp-batch gulp-header gulp-rename gulp-strip-debug gulp-put
var gulp = require('gulp');
var fs = require('fs');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var notify = require('gulp-notify');
var batch = require('gulp-batch');
var header = require('gulp-header');
var rename = require('gulp-rename');
var put = require('gulp-put');
var stripDebug = require('gulp-strip-debug');

//order is semi-important. Make
//sure plate-layout.js is first
var fileArray = [
  "plate-layout.js",
  "load-plate.js",
  "add-data-on-change.js",
  "add-data-to-tabs.js",
  "add-tab-data.js",
  "apply-well-data.js",
  "bottom-table.js",
  "canvas-circles.js",
  "canvas.js", 
  "check-box.js",
  "color-manager.js",
  "create-canvas-elements.js",
  "create-field.js",
  "engine.js",
  "fabric-events.js",
  "interface.js",
  "menu.js",
  "overlay.js",
  "preset.js",
  "redo.js",
  "tabs.js",
  "undo-redo-manager.js",
  "undo.js",
  "unit-data-field.js",
];

var pkg = require('./package.json');

gulp.task('copy-data', function(){
    gulp.src('example_plate_data.txt')
      .pipe(put('dist'));
});

gulp.task('copy-dev-index', ['copy-data'],function(){
    gulp.src('dev-index.html')
      .pipe(rename("index.html"))
      .pipe(gulp.dest('dist'));
});

gulp.task('copy-index', ['copy-data'],function(){
    gulp.src('demo-index.html')
      .pipe(rename("index.html"))
      .pipe(gulp.dest('dist'));
});

gulp.task('copy-assets', function(){
    gulp.src(['./libs/*','./css/*'])
      .pipe(put('dist'));
});


gulp.task('default', ['copy-index','copy-assets'], function(){
  return gulp.src(fileArray)
    .pipe(concat('plate-map.min.js'))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(header(fs.readFileSync('header.txt', 'utf8'), { pkg : pkg } ))
    .pipe(gulp.dest('dist'))
    .pipe(notify({ message: 'Finished minifying JavaScript'}));
});

gulp.task('dev', ['copy-dev-index','copy-assets'],function() {
  return gulp.src(fileArray)
    .pipe(concat('plate-map.js'))
    .pipe(gulp.dest('dist'))
    .pipe(notify({ message: 'Finished building DEV JavaScript'}));
});

gulp.task('dev-watch', function () {
  watch(fileArray, batch(function (events, done) {
    gulp.start('dev', done);
  }));
});

gulp.task('min-watch', function () {
  watch(fileArray, batch(function (events, done) {
    gulp.start('default', done);
  }));
});
