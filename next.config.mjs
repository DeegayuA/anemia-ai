/** @type {import('next').NextConfig} */
import CopyPlugin from "copy-webpack-plugin";
import path from "path";

const nextConfig = {
  output: "export",
  basePath: "/anemia-ai",
  assetPrefix: "/anemia-ai/",
  turbopack: {}, // disable turbopack warning
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
            from: path.join(process.cwd(), "node_modules/onnxruntime-web/dist/*.wasm"),
            to: path.join(process.cwd(), "public/models/[name][ext]"),
          },
        ],
      })
    );

    return config;
  },
};

export default nextConfig;
