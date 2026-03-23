/**
 * Large, stable block for first paint (FCP/LCP visibility in Lighthouse).
 */
export function MeaningfulPaintHeader({ title }: { title: string }) {
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 32 }}>{title}</h1>
      <div style={{ height: 200, background: "#eee" }} />
    </div>
  );
}
