/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Confidential internal tool — never index.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
