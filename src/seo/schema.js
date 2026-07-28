/* JSON-LD (schema.org) generators for the SEO factory sections.
 *
 * Pure functions — each returns a plain object ready for page({ jsonld: [...] }).
 * build.js's page() wraps each object in its own <script type="application/ld+json">
 * and escapes every `<`, so never hand-write script tags or stringify yourself.
 *
 * HARD RULE: never emit aggregateRating or review fields. There is NO real
 * review data for these products — fabricated ratings are against Google's
 * structured-data guidelines and are misrepresentation. Add those fields only
 * when genuine, verifiable user reviews exist.
 */

const ORG = { '@type': 'Organization', name: 'OneTimeSuite', url: 'https://onetimesuite.com' };

/* SoftwareApplication for a catalog product.
 * p: product entry ({ slug, brand, tagline, price, kind? }).
 * url: absolute canonical URL of the page. */
function softwareApp(p, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: p.brand,
    description: p.tagline || p.oneliner || p.brand,
    url,
    applicationCategory: p.kind === 'web' ? 'WebApplication' : 'DesktopApplication',
    operatingSystem: p.kind === 'web' ? 'Any (web browser, self-hosted)' : 'Windows, macOS, Linux',
    offers: {
      '@type': 'Offer',
      price: String(p.price),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    // NO aggregateRating / review — see HARD RULE above.
  };
}

/* FAQPage from [[question, answer]] pairs. */
function faqPageLd(faqPairs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqPairs.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

/* Product — for suite/bundle/stack style offers.
 * priceNote: optional human note ('price rises $1 per sale') kept out of the
 * machine-readable offer and appended to the description instead. */
function productLd({ name, desc, url, price, priceNote }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: priceNote ? `${desc} ${priceNote}` : desc,
    url,
    brand: ORG,
    offers: {
      '@type': 'Offer',
      price: String(price),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url,
    },
    // NO aggregateRating / review — see HARD RULE above.
  };
}

/* Event — ev is passed through with @type Event added (caller supplies
 * name, startDate, location, description, url, etc.). */
function eventLd(ev) {
  return { '@context': 'https://schema.org', '@type': 'Event', ...ev };
}

/* VideoObject. durationIso is ISO-8601 ('PT1M30S'); omit when unknown. */
function videoLd({ name, desc, thumbUrl, uploadDate, durationIso, url }) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description: desc,
    thumbnailUrl: [thumbUrl],
    uploadDate,
    url,
  };
  if (durationIso) ld.duration = durationIso;
  return ld;
}

/* HowTo from [[stepTitle, stepText]] pairs. */
function howToLd({ name, steps, url }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    url,
    step: steps.map(([title, text], i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: title,
      text,
    })),
  };
}

/* Article / research post. */
function articleLd({ title, desc, url, datePublished }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: desc,
    mainEntityOfPage: url,
    datePublished,
    author: ORG,
    publisher: ORG,
  };
}

/* ItemList for hubs/directories — items: [[name, absoluteUrl]]. */
function itemListLd({ name, url, items }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url,
    numberOfItems: items.length,
    itemListElement: items.map(([itemName, itemUrl], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: itemName,
      url: itemUrl,
    })),
  };
}

module.exports = {
  softwareApp,
  faqPageLd,
  productLd,
  eventLd,
  videoLd,
  howToLd,
  articleLd,
  itemListLd,
};
