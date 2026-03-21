import type { ReactNode } from "react";

import { useHydrated } from "@web-speed-hackathon-2026/client/src/hooks/use_hydrated";

interface DocumentProps {
  children: ReactNode;
  cssHref?: string | undefined;
  title?: string | undefined;
  modulePreloads?: string[] | undefined;
}

export function Document({ children, cssHref, title, modulePreloads }: DocumentProps) {
  const hydrated = useHydrated();

  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {title && <title>{title}</title>}
        {cssHref && <link rel="stylesheet" crossOrigin="" href={cssHref} />}
        {modulePreloads?.map((href) => (
          <link key={href} rel="modulepreload" crossOrigin="" href={href} />
        ))}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/ReiNoAreMincho-Heavy-subset.woff2"
          crossOrigin=""
        />
      </head>
      <body className="bg-cax-canvas text-cax-text">
        <fieldset disabled={!hydrated} style={{ border: "none", padding: 0, margin: 0 }}>
          <div id="app">{children}</div>
        </fieldset>
      </body>
    </html>
  );
}
