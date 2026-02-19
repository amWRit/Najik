
import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

const certDir = path.resolve(__dirname, 'cert');
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost-cert.pem');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  // @ts-ignore
  nextConfig.server = {
    type: 'https',
    options: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
  };
  console.log('HTTPS enabled for Next.js dev server.');
} else {
  console.warn('SSL cert/key not found. Run: node scripts/generate-ssl.js');
}

export default nextConfig;
