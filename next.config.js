/** @type {import('next').NextConfig} */
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

const nextConfig = {
  output: "export",
  basePath: "/anemia-ai",
  assetPrefix: "/anemia-ai/",
  transpilePackages: [
    '@tensorflow/tfjs',
    '@tensorflow/tfjs-core',
    '@tensorflow/tfjs-backend-webgl',
    '@tensorflow-models/blazeface'
  ],
  webpack: (config) => {
    // See https://github.com/microsoft/onnxruntime/issues/13072
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: path.join(__dirname, "node_modules/onnxruntime-web/dist/*.wasm"),
            to: path.join(__dirname, "public/models/[name][ext]"),
          },
        ],
      })
    );

    return config;
  },
};

module.exports = nextConfig;
