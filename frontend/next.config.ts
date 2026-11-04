/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [
        'tldraw',
        '@tldraw/sync',
        '@tldraw/sync-core',
        '@tldraw/editor',
        '@tldraw/store',
        '@tldraw/tlschema',
        '@tldraw/state',
    ],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
    },
    // The games moved under /games/* — keep the old URLs working.
    async redirects() {
        return [
            { source: '/liars-bar', destination: '/games/liars-bar', permanent: true },
            { source: '/typing-fall', destination: '/games/typing-fall', permanent: true },
        ];
    },
    async rewrites() {
        return [
            {
                source: '/proxy-audio/:path*',
                destination: 'https://www.soundhelix.com/examples/mp3/:path*',
            },
        ];
    },
};

export default nextConfig;
