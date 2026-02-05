import { normalizeHost } from './settings';

export type Category =
  | 'productive'
  | 'social'
  | 'entertainment'
  | 'shopping'
  | 'reference'
  | 'other';

export type CategoryConfig = {
  label: string;
  color: string;
};

export const CATEGORIES: Record<Category, CategoryConfig> = {
  productive: { label: 'Productive', color: 'emerald' },
  social: { label: 'Social', color: 'blue' },
  entertainment: { label: 'Entertainment', color: 'purple' },
  shopping: { label: 'Shopping', color: 'amber' },
  reference: { label: 'Reference', color: 'fuchsia' },
  other: { label: 'Other', color: 'zinc' },
};

export const CATEGORY_LIST = Object.keys(CATEGORIES) as Category[];

export const DEFAULT_CATEGORY_MAP: Record<string, Category> = {
  // Productive
  'github.com': 'productive',
  'gitlab.com': 'productive',
  'bitbucket.org': 'productive',
  'notion.so': 'productive',
  'linear.app': 'productive',
  'figma.com': 'productive',
  'docs.google.com': 'productive',
  'drive.google.com': 'productive',
  'sheets.google.com': 'productive',
  'slides.google.com': 'productive',
  'calendar.google.com': 'productive',
  'mail.google.com': 'productive',
  'trello.com': 'productive',
  'asana.com': 'productive',
  'monday.com': 'productive',
  'clickup.com': 'productive',
  'atlassian.net': 'productive',
  'slack.com': 'productive',
  'vercel.com': 'productive',
  'netlify.com': 'productive',
  'render.com': 'productive',
  'railway.app': 'productive',
  'supabase.com': 'productive',
  'planetscale.com': 'productive',
  'airtable.com': 'productive',
  'coda.io': 'productive',
  'miro.com': 'productive',
  'loom.com': 'productive',
  'zoom.us': 'productive',
  'meet.google.com': 'productive',

  // Social
  'twitter.com': 'social',
  'x.com': 'social',
  'facebook.com': 'social',
  'instagram.com': 'social',
  'linkedin.com': 'social',
  'reddit.com': 'social',
  'discord.com': 'social',
  'threads.net': 'social',
  'tiktok.com': 'social',
  'mastodon.social': 'social',
  'bsky.app': 'social',
  'snapchat.com': 'social',
  'pinterest.com': 'social',
  'tumblr.com': 'social',
  'whatsapp.com': 'social',
  'web.whatsapp.com': 'social',
  'messenger.com': 'social',

  // Entertainment
  'youtube.com': 'entertainment',
  'netflix.com': 'entertainment',
  'twitch.tv': 'entertainment',
  'spotify.com': 'entertainment',
  'open.spotify.com': 'entertainment',
  'hulu.com': 'entertainment',
  'disneyplus.com': 'entertainment',
  'max.com': 'entertainment',
  'primevideo.com': 'entertainment',
  'crunchyroll.com': 'entertainment',
  'funimation.com': 'entertainment',
  'soundcloud.com': 'entertainment',
  'vimeo.com': 'entertainment',
  'dailymotion.com': 'entertainment',
  'imdb.com': 'entertainment',
  'rottentomatoes.com': 'entertainment',
  'letterboxd.com': 'entertainment',
  'steampowered.com': 'entertainment',
  'store.steampowered.com': 'entertainment',
  'epicgames.com': 'entertainment',
  'itch.io': 'entertainment',

  // Shopping
  'amazon.com': 'shopping',
  'ebay.com': 'shopping',
  'etsy.com': 'shopping',
  'walmart.com': 'shopping',
  'target.com': 'shopping',
  'bestbuy.com': 'shopping',
  'aliexpress.com': 'shopping',
  'wish.com': 'shopping',
  'shopify.com': 'shopping',
  'newegg.com': 'shopping',
  'costco.com': 'shopping',
  'homedepot.com': 'shopping',
  'lowes.com': 'shopping',
  'wayfair.com': 'shopping',
  'ikea.com': 'shopping',
  'zappos.com': 'shopping',
  'nordstrom.com': 'shopping',
  'macys.com': 'shopping',

  // Reference
  'google.com': 'reference',
  'bing.com': 'reference',
  'duckduckgo.com': 'reference',
  'stackoverflow.com': 'reference',
  'stackexchange.com': 'reference',
  'wikipedia.org': 'reference',
  'developer.mozilla.org': 'reference',
  'mdn.io': 'reference',
  'w3schools.com': 'reference',
  'medium.com': 'reference',
  'dev.to': 'reference',
  'hashnode.com': 'reference',
  'freecodecamp.org': 'reference',
  'geeksforgeeks.org': 'reference',
  'tutorialspoint.com': 'reference',
  'digitalocean.com': 'reference',
  'css-tricks.com': 'reference',
  'smashingmagazine.com': 'reference',
  'news.ycombinator.com': 'reference',
  'arxiv.org': 'reference',
  'scholar.google.com': 'reference',
  'wolframalpha.com': 'reference',
  'quora.com': 'reference',
};

export function getCategoryForHost(
  host: string,
  userCategories: Record<string, Category>
): Category {
  const normalized = normalizeHost(host);

  if (userCategories[normalized]) {
    return userCategories[normalized];
  }

  if (DEFAULT_CATEGORY_MAP[normalized]) {
    return DEFAULT_CATEGORY_MAP[normalized];
  }

  for (const [domain, category] of Object.entries(DEFAULT_CATEGORY_MAP)) {
    if (normalized.endsWith(`.${domain}`)) {
      return category;
    }
  }

  return 'other';
}

export function getCategoryConfig(category: Category): CategoryConfig {
  return CATEGORIES[category];
}

export function getCategoryColor(category: Category): string {
  return CATEGORIES[category].color;
}

export function getCategoryLabel(category: Category): string {
  return CATEGORIES[category].label;
}
