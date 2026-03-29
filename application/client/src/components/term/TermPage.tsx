import termPageContent from "@web-speed-hackathon-2026/client/src/components/term/term_page_content.html?raw";

export const TermPage = () => {
  return (
    <article
      className="px-2 pb-16 leading-relaxed md:px-4 md:pt-2"
      dangerouslySetInnerHTML={{ __html: termPageContent }}
    />
  );
};
