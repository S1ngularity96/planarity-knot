module.exports = {
  entry: "./lib/planarity_knot.js",
  output: {
    filename: "./dist/bundle.js"
  },
  devtool: 'source-map',
  resolve: {
    extensions: ["*", ".js", ".jsx"]
  }
};
