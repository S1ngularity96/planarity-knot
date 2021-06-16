module.exports = {
  mode: 'development',
  entry: "./lib/planarity_knot.js",
  output: {
    filename: "bundle.js"
  },
  devtool: 'source-map',
  resolve: {
    extensions: ["*", ".js", ".jsx"]
  }
};
