import { env } from "@/lib/env";

// Imported post HTML needs two touches the WordPress runtime used to do:
// share buttons get real links, and the author name (a dynamic block) goes
// back under the first separator.
function prepare(html: string, url: string, author: string | null) {
  let out = html.replace(
    /<a class="uagb-ss__link" data-href="([^"]+)"/g,
    (_m, base: string) =>
      `<a class="uagb-ss__link" href="${base}${encodeURIComponent(url)}" target="_blank" aria-label="Share"`,
  );
  if (author) {
    out = out.replace(
      /(<hr class="wp-block-separator[^>]*>)/,
      `$1<div class="wp-block-post-author-name">${author.replace(/</g, "&lt;")}</div>`,
    );
  }
  return out;
}

export function PostContent({
  html,
  slug,
  author,
}: {
  html: string;
  slug: string;
  author: string | null;
}) {
  return (
    <div
      className="prose-rotta"
      dangerouslySetInnerHTML={{
        __html: prepare(html, `${env.siteUrl}/${slug}/`, author),
      }}
    />
  );
}
