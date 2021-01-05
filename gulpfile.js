'use strict'
const gulp = require('gulp')
const cleanCSS = require('gulp-clean-css')
const postcss = require('gulp-postcss')
const stylus = require('gulp-stylus')
const pxToUnits = require('postcss-px2units')
const pxToViewPort = require('postcss-px-to-viewport')
const cssnano = require('cssnano')
const presetenv = require('postcss-preset-env')
const rename = require('gulp-rename')
const toBem = require('postcss-bem-fix')
const toNested = require('postcss-nested')
const bemConfig = {
  defaultNamespace: 'ce', // default namespace to use, none by default
  style: 'suit', // suit or bem, suit by default,
  shortcuts: {
    component: 'b',
    modifier: 'm',
    descendent: 'e'
  },
  separators: {
    namespace: '-',
    descendent: '__',
    modifier: '--'
  }
}
const compile = {
  /**
   * 编译vw单位文件
   */
  cssToVw() {
    return gulp
      .src("./src/*.styl")
      .pipe(stylus())
      .pipe(
        postcss([
          toBem(bemConfig),
          toNested(),
          pxToViewPort({
            viewportWidth: 750, // (Number) The width of the viewport.
            viewportHeight: 1334, // (Number) The height of the viewport.
            unitPrecision: 3, // (Number) 转换的时候除不尽保留3位小数.
            viewportUnit: "vw", // (String) 转换为vw单位.
            selectorBlackList: [".ignore", ".hairlines"], // (Array) The selectors to ignore and leave as px.
            minPixelValue: 1, // (Number) 小于或等于'1px'不转换为视窗单位.
            mediaQuery: false, // (Boolean) Allow px to be converted in media queries.
            unitToConvert: "px",
          }),
          presetenv(),
          cssnano({
            "cssnano-preset-advanced": {
              zIndex: false,
              autoprefixer: true,
            },
          }),
        ])
      )
      .pipe(cleanCSS())
      .pipe(
        rename({
          suffix: ".vw",
        })
      )
      .pipe(gulp.dest("./lib"));
  },
  /**
   * build css
   */
  cssToRelease() {
    return gulp
      .src("./src/icon/*.styl")
      .pipe(stylus())
      .pipe(
        postcss([
          toBem(bemConfig),
          toNested(),
          presetenv(),
          pxToUnits({
            divisor: 1,
            targetUnits: "px",
          }),
        ])
      )
      .pipe(cleanCSS())
      .pipe(
        rename({
          extname: ".css",
        })
      )
      .pipe(gulp.dest("./lib"));
  },
  /**
   * 处理font
   */
  copyFont() {
    return gulp.src("./src/fonts/**").pipe(gulp.dest("./lib/fonts"));
  },
  /**
   * 处理fontJS
   */
  copyFontJS() {
    return gulp.src("./src/icon/*.js").pipe(gulp.dest("./lib/"));
  },
};



exports.build = gulp.parallel(
  compile.cssToRelease,
  compile.copyFont,
  compile.copyFontJS
)