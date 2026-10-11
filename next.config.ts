import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	cacheComponents: true,
	turbopack: {
		root: __dirname,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
