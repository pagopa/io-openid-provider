const { parallel, src, dest } = require('gulp');

function copyPublic(cb) {
  return src("src/public/**/*").pipe(dest("dist/public"));
}

function copyViews(cb) {
    return src("src/views/**/*").pipe(dest("dist/views"));
}

exports.default = parallel(copyViews, copyPublic)
