import { useEffect } from "react";
import { site, isConfigured } from "../config/site";
export function useSeo(title, description = site.description, canonical) {
  useEffect(() => {
    document.title = `${title} | ${site.businessName}`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.append(meta);
    }
    meta.content = description;
    let link = document.querySelector('link[rel="canonical"]');
    let url;
    try {
      if (canonical) url = new URL(canonical);
      else if (isConfigured(site.canonicalOrigin))
        url = new URL(window.location.pathname, site.canonicalOrigin);
    } catch {
      url = undefined;
    }
    if (url && ["http:", "https:"].includes(url.protocol)) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.append(link);
      }
      link.href = url.href;
    } else link?.remove();
    return () => {
      document.querySelector('link[rel="canonical"]')?.remove();
    };
  }, [title, description, canonical]);
}
