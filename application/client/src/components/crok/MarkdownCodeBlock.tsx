import { ComponentProps, lazy, Suspense } from "react";

const CodeBlock = lazy(async () => {
  const module = await import("@web-speed-hackathon-2026/client/src/components/crok/CodeBlock");
  return { default: module.CodeBlock };
});

export const MarkdownCodeBlock = (props: ComponentProps<"pre">) => {
  return (
    <Suspense fallback={<pre>{props.children}</pre>}>
      <CodeBlock {...props} />
    </Suspense>
  );
};
