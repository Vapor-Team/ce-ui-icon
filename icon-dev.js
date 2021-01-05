/*
 * @Author: Mark
 * @Date: 2020-07-12 19:40:06
 * @LastEditors: Mark
 * @LastEditTime: 2021-01-05 13:49:26
 * @Description: gulp-iconfont
 */
const gulp = require("gulp");
const icon = "ce-icon";
const fontName = `${icon}-font`;
const svgSymbols2js = require("gulp-svg-symbols2js");
const iconFontCss = require("gulp-iconfont-css");
const iconFont = require("gulp-iconfont");
const uglifyEs = require("gulp-uglify-es").default;
const gulpIf = require("gulp-if");
const svgSymbols = require("gulp-svg-symbols");
const cleanCSS = require("gulp-clean-css");
const postcss = require("gulp-postcss");
const stylus = require("gulp-stylus");
const pxToUnits = require("postcss-px2units");
const pxToViewPort = require("postcss-px-to-viewport");
const cssnano = require("cssnano");
const presetenv = require("postcss-preset-env");
const rename = require("gulp-rename");
const toBem = require("postcss-bem-fix");
const toNested = require("postcss-nested");
const bemConfig = {
  defaultNamespace: "ce", // default namespace to use, none by default
  style: "suit", // suit or bem, suit by default,
  shortcuts: {
    component: "b",
    modifier: "m",
    descendent: "e",
  },
  separators: {
    namespace: "-",
    descendent: "__",
    modifier: "--",
  },
};


const compile = {
  svgToFonts() {
    const runTimestamp = Math.round(Date.now() / 1000);
    return gulp
      .src(`./src/svg/**/*.svg`)
      .pipe(
        iconFontCss({
          fontName: fontName,
          cssClass: icon + "--",
          path: "./src/template/_iconfont.styl",
          cacheBuster: runTimestamp,
          targetPath: "../icon/index.styl",
          fontPath: "./fonts/",
        })
      )
      .pipe(
        iconFont({
          fontName: fontName, // required
          prependUnicode: true, // recommended option
          formats: ["svg", "ttf", "eot", "woff", "woff2"],
        })
      )
      .pipe(gulp.dest(`./src/fonts`));
  },
  /**
   * 编译处理svg
   */
  svgToSymbol() {
    return gulp
      .src(`./src/svg/**/*.svg`)
      .pipe(
        svgSymbols({
          slug: (name) => {
            return name;
          },
          id: `${icon}--%f`,
          // optional: define a global class for every SVG
          svgAttrs: {
            class: `${icon}__symbol`,
            xmlns: `http://www.w3.org/2000/svg`,
            "aria-hidden": `true`,
            "data-enabled": true,
          },
          // optional: customize another class for each SVG
          class: `.${icon}--%f`,
          // choose the vue template
          templates: ["default-svg", "default-stylus"],
          transformData(svg, defaultData, options) {
            /******
            svg is same object as the one passed to the templates (see above)

            defaultData are the ones needed by default templates
            see /lib/get-default-data.js

            options are the one you have set in your gulpfile,
              minus templates & transformData
            *******/

            return {
              // Return every datas you need
              id: defaultData.id,
              class: defaultData.class,
              width: `1em`,
              height: `1em`,
            };
          },
        })
      )
      .pipe(svgSymbols2js())
      .pipe(
        gulpIf((file) => {
          return file.extname === ".js";
        }, uglifyEs())
      )
      .pipe(
        gulpIf(
          (file) => {
            return file.extname === ".js";
          },
          rename("iconfont.min.js"),
          rename("iconfont.styl")
        )
      )
      .pipe(gulp.dest(`./src/icon`));
  },
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
const watch = {
  /**
   * 监视构建css
   */
  css() {
    return gulp.watch(["./src/icon/*.styl"], gulp.parallel(compile.cssToRelease));
  },
  /**
   * 监听字体库
   */
  fonts() {
    return gulp.watch("./src/fonts/**", compile.copyFont);
  },
  fontJS() {
    return gulp.watch("./src/fonts/**", compile.copyFontJS);
  },
  /**
   * 监听字体库
   */
  symbol() {
    return gulp.watch("./src/svg/**/*.svg", compile.svgToSymbol);
  },
  /**
   * 监听svgToFonts
   */
  iconFonts() {
    return gulp.watch("./src/svg/**/*.svg", compile.svgToFonts);
  },
};

exports.default = gulp.series(
  compile.svgToFonts,
  compile.svgToSymbol,
  compile.cssToRelease,
  gulp.parallel(
    watch.css,
    watch.fonts,
    watch.fontJS,
    watch.symbol,
    watch.iconFonts
  )
);
