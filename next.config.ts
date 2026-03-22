import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [
            { protocol: "https", hostname: "**.crunchyroll.com" },
            { protocol: "https", hostname: "**.vrv.co" },
            { protocol: "https", hostname: "**.hidive.com" },
            { protocol: "https", hostname: "**.imggaming.com" },
            { protocol: "https", hostname: "**.animationdigitalnetwork.com" }
        ]
    }
}

export default nextConfig
