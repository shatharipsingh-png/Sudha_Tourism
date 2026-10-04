import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { site } from "../config/site";
import { seoModel, serializeJsonLd } from "../utils/seo";
export function useSeo(title, description = site.description, options = {}) {
  const location = useLocation();
  const model = seoModel(title, description, {
    path: location.pathname,
    ...(typeof options === "string" ? { canonical: options } : options),
  });
  const key = JSON.stringify(model);
  useEffect(() => {
    const value = JSON.parse(key);
    const originalTitle = document.title;
    document.title = value.title;
    const cleanups = [];
    for (const [name, content] of Object.entries(value.meta)) {
      const attribute = name.startsWith("og:") ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      const original = element?.getAttribute("content");
      if (content === undefined || content === null) {
        element?.remove();
        continue;
      }
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.append(element);
      }
      element.content = content;
      cleanups.push(() => {
        if (original === undefined || original === null) element.remove();
        else element.content = original;
      });
    }
    if (value.canonical) {
      const element = document.createElement("link");
      element.rel = "canonical";
      element.href = value.canonical;
      document.head.append(element);
      cleanups.push(() => element.remove());
    }
    if (value.data.length) {
      const element = document.createElement("script");
      element.type = "application/ld+json";
      element.dataset.sudhaSeo = "true";
      element.textContent = serializeJsonLd(value.data);
      document.head.append(element);
      cleanups.push(() => element.remove());
    }
    return () => {
      cleanups.reverse().forEach((clean) => clean());
      document.title = originalTitle;
    };
  }, [key]);
}
