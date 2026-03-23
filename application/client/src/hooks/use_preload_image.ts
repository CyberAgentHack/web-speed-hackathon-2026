import { useEffect } from "react";

export const usePreloadImage = (src: string | null) => {
    useEffect(() => {
        if (src == null || src === "") {
            return;
        }

        const absoluteSrc = new URL(src, window.location.origin).href;
        const existingLinks = document.head.querySelectorAll(
            'link[rel="preload"][as="image"]',
        );

        for (const link of Array.from(existingLinks)) {
            if ((link as HTMLLinkElement).href === absoluteSrc) {
                return;
            }
        }

        const preloadLink = document.createElement("link");
        preloadLink.rel = "preload";
        preloadLink.as = "image";
        preloadLink.href = src;
        preloadLink.setAttribute("fetchpriority", "high");
        document.head.appendChild(preloadLink);
    }, [src]);
};
