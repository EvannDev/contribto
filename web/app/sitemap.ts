import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://contrib.to',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://contrib.to/privacy',
      lastModified: new Date('2026-05-02'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://contrib.to/terms',
      lastModified: new Date('2026-05-02'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]
}
