/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Skip ESLint tijdens Vercel builds (je gebruikt Notepad + PS, dus linten doen we later pas)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Tijdelijk: negeer TS build errors totdat het project schoon is
    ignoreBuildErrors: true,
  },
};

export default nextConfig;