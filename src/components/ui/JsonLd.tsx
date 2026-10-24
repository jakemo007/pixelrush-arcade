/**
 * Renders structured data. Only used with data built from our own static
 * configuration (never user input). "<" is escaped so the JSON cannot close
 * the script element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
