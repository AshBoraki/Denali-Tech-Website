(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DenaliBlogSearch = api;
}(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  // Keep negation and intent words (not, new, working, etc.) searchable.
  var stopWords = new Set('a an and are as at be by can do does for from how i in is it me my of on or our that the their this to was we what when where which who why with would you your'.split(' '));
  var equivalents = {
    blinds: 'blind', cameras: 'camera', costs: 'cost', locks: 'lock',
    networks: 'network', remotes: 'remote', routers: 'router', shades: 'shade',
    speakers: 'speaker', subscriptions: 'subscription', systems: 'system',
    theaters: 'theater', theatres: 'theater', theatre: 'theater', zones: 'zone',
    motorised: 'motorized'
  };

  function words(value) {
    if (typeof value !== 'string') return [];
    return value.toLowerCase().normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(?:isn't|isn’t)\b/g, 'is not')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\bwi\s+fi\b/g, 'wifi')
      .replace(/\bcontrol\s+4\b/g, 'control4')
      .replace(/\bradio\s*ra\s*3\b/g, 'radiora3')
      .trim().split(/\s+/).filter(Boolean)
      .map(function (word) { return Object.prototype.hasOwnProperty.call(equivalents, word) ? equivalents[word] : word; });
  }

  function field(value) {
    var tokens = words(value);
    return { tokens: tokens, set: new Set(tokens), phrase: ' ' + tokens.join(' ') + ' ' };
  }

  function phrasePosition(tokens, queryTokens) {
    for (var start = 0; start <= tokens.length - queryTokens.length; start += 1) {
      if (queryTokens.every(function (token, offset) { return tokens[start + offset] === token; })) return start;
    }
    return -1;
  }

  function compareText(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  }

  /**
   * Return original post objects in relevance order, without changing the input.
   * Blank queries preserve the caller's browse order. Category filtering belongs
   * to the caller. Nonblank queries require every meaningful whole-word token;
   * no fuzzy or substring fallback quietly broadens an unsuccessful search.
   */
  function search(posts, query) {
    if (!Array.isArray(posts)) return [];
    var rawQuery = query == null ? '' : String(query);
    if (!rawQuery.trim()) return posts.slice();
    var queryWords = words(rawQuery);
    var tokens = Array.from(new Set(queryWords.filter(function (token) { return !stopWords.has(token); })));
    if (!tokens.length) return [];
    var phrase = ' ' + queryWords.join(' ') + ' ';

    return posts.map(function (post, index) {
      if (!post || typeof post !== 'object') return null;
      var title = field(post.title);
      var tags = field(Array.isArray(post.tags) ? post.tags.filter(function (tag) { return typeof tag === 'string'; }).join(' ') : '');
      // Slugs retain useful editorial terms omitted from short display titles,
      // e.g. control4-after-new-router-internet-provider contains "new router".
      var slug = field(post.slug);
      var excerpt = field(post.excerpt);
      var category = field(post.category);
      var fields = [title, tags, slug, excerpt, category];
      var weights = [50, 20, 12, 6, 2];
      var score = 0;
      for (var i = 0; i < tokens.length; i += 1) {
        var match = fields.findIndex(function (item) { return item.set.has(tokens[i]); });
        if (match === -1) return null;
        score += weights[match];
      }

      if (tokens.every(function (token) { return title.set.has(token); })) score += 100;
      var titlePosition = phrasePosition(title.tokens, queryWords);
      if (titlePosition !== -1) score += 120 + 30 / (titlePosition + 1);
      if (tags.phrase.includes(phrase)) score += 20;
      if (slug.phrase.includes(phrase)) score += 20;
      if (excerpt.phrase.includes(phrase)) score += 10;

      // A brand-only question belongs at the introductory homeowner guide,
      // not whichever narrow product happens to have the newest publication date.
      if (tokens.length === 1 && tokens[0] === 'control4' && post.slug === 'what-is-control4-guide') score += 300;

      return {
        post: post,
        score: score,
        title: title.tokens.join(' '),
        key: String(post.slug || post.url || post.id || ''),
        index: index
      };
    }).filter(Boolean).sort(function (a, b) {
      return b.score - a.score || compareText(a.title, b.title) || compareText(a.key, b.key) || a.index - b.index;
    }).map(function (item) { return item.post; });
  }

  return { search: search };
}));
