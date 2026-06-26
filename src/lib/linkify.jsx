// Matches http(s):// URLs and bare www.* URLs.
// Stops at whitespace and common boundary characters (<>"').
const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

const TRAILING_PUNCT = /[.,;:!?)\]}]+$/;

function normalize(url) {
  return url.startsWith('www.') ? `https://${url}` : url;
}

/**
 * Returns the array of URL strings found in the given text, in order.
 * Trailing punctuation (.,;: etc.) is stripped because users often paste
 * URLs at the end of sentences.
 */
export function extractUrls(text) {
  if (!text) return [];
  const matches = text.match(URL_REGEX) || [];
  return matches.map((u) => u.replace(TRAILING_PUNCT, ''));
}

/**
 * Inline component: renders text as JSX, turning any URLs into anchor tags.
 * Pass `stopPropagation` if the parent is also clickable (e.g. card).
 */
export function Linkify({ text, stopPropagation = false }) {
  if (!text) return null;
  const parts = [];
  let last = 0;
  const regex = new RegExp(URL_REGEX.source, 'gi');
  let m;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    const raw = m[0];
    const trimmedTrailing = raw.replace(TRAILING_PUNCT, '');
    const start = m.index;
    const end = start + trimmedTrailing.length;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <a
        key={`l-${key++}`}
        href={normalize(trimmedTrailing)}
        target="_blank"
        rel="noopener noreferrer"
        className="linkified"
        onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      >
        {trimmedTrailing}
      </a>,
    );
    last = end;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
