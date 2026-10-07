import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://regsure.vercel.app/sitemap.xml",
    host: "https://regsure.vercel.app/",
  };
}
