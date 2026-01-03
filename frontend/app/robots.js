export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://simtrading.vercel.app/sitemap.xml',
  }
}
