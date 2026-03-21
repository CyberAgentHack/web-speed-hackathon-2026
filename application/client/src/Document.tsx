import type { ReactNode } from "react";

interface DocumentProps {
  children: ReactNode;
  cssHref?: string | undefined;
  title?: string | undefined;
  modulePreloads?: string[] | undefined;
}

export function Document({ children, cssHref, title, modulePreloads }: DocumentProps) {
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
        <div id="app">{children}</div>
      </body>
    </html>
  );
}
