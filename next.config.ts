import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@carbon/react', '@carbon/styles', '@carbon/icons-react'],
  turbopack: {
    root: path.resolve(__dirname),
  },
  allowedDevOrigins: ['project.configurationplayground.dpdns.org'],
};

export default nextConfig;
