const { parallel, src, dest } = require('gulp');

function copyPublic(cb) {
  return src("src/adapters/http/public/**/*").pipe(dest("dist/adapters/http/public"));
}

function copyViews(cb) {
    return src("src/adapters/http/views/**/*").pipe(dest("dist/adapters/http/views"));
}

exports.default = parallel(copyViews, copyPublic)
