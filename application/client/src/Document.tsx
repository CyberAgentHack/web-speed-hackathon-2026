import type { ReactNode } from "react";

interface DocumentProps {
  children: ReactNode;
  cssHref?: string | undefined;
  title?: string | undefined;
}

export function Document({ children, cssHref, title }: DocumentProps) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {title && <title>{title}</title>}
        {cssHref && <link rel="stylesheet" crossOrigin="" href={cssHref} />}
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
