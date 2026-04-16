import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://crypto-signal-lab.rickyyao.cc",
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
  ];
}
