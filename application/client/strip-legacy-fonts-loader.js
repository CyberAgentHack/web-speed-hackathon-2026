// Strip woff and ttf font sources from @font-face declarations (keep woff2 only)
module.exports = function (source) {
  return source.replace(
    /,\s*url\([^)]+\.(?:woff|ttf)\)\s*format\(["'](?:woff|truetype)["']\)/g,
    "",
  );
};
