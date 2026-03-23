const entities = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'",
  '&#39;': "'", '&laquo;': '\u00AB', '&raquo;': '\u00BB', '&mdash;': '\u2014',
  '&ndash;': '\u2013', '&nbsp;': '\u00A0', '&copy;': '\u00A9', '&reg;': '\u00AE',
  '&trade;': '\u2122', '&hellip;': '\u2026', '&lsquo;': '\u2018', '&rsquo;': '\u2019',
  '&ldquo;': '\u201C', '&rdquo;': '\u201D', '&bull;': '\u2022', '&minus;': '\u2212',
}

/**
 * Декодирует HTML-сущности в строке (SSR-safe, без использования DOM)
 */
export function decodeHtml(text) {
  if (!text) return text

  return text.replace(/&(?:#x[\da-fA-F]+|#\d+|[a-zA-Z]+);/g, (match) => {
    if (entities[match]) return entities[match]
    if (match.startsWith('&#x')) return String.fromCharCode(parseInt(match.slice(3, -1), 16))
    if (match.startsWith('&#')) return String.fromCharCode(parseInt(match.slice(2, -1), 10))
    return match
  })
}
