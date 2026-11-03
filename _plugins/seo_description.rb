require 'jekyll-seo-tag'

# Based on jekyll-seo-tag's Jekyll::SeoTag::Drop#description, with these changes:
#
# * If the page has neither a `description` nor an `excerpt`, the description is derived
#   from the page's content. We use the rendered content (available as `content` in the
#   layout's Liquid context) instead of the raw source, so that Liquid tags
#   (e.g., `{% include ... %}`) do not leak into the description.
# * Headings and tables are removed from the content: when flattened into plain text,
#   headings repeat the page title or end up as stray words, and tables become a jumble
#   of cell values. Callout keywords (`> Warning ...`) are removed, as readers never see
#   them either.
# * The description is truncated to 100 words.
Jekyll::SeoTag::Drop.class_eval do
  HEADING_REGEX = %r!<h([1-6])\b[^>]*>.*?</h\1>!m
  TABLE_REGEX = %r!<table\b.*?</table>!m
  # callout keywords, which js/noteboxes.js replaces with an icon
  CALLOUT_KEYWORD_REGEX = %r!(<blockquote>\s*<p>)\s*(?:Note|Warning|Tip|Bestpractice|Deprecated|Update|Installation|Quote|New)\b!

  # The drop is constructed with the layout's context, where `content` holds the
  # rendered page content. Capture it here: when the drop is accessed from the SEO
  # tag's own template, Liquid replaces @context with that template's context.
  alias_method :ducklake_original_initialize, :initialize

  def initialize(text, context)
    ducklake_original_initialize(text, context)
    @rendered_content = context["content"]
  end

  def description
    @description ||= begin
      description_max_words = 100
      explicit = page["description"] || page["excerpt"]
      value = explicit.nil? ? content_description : format_string(explicit)
      snippet(value || site_description, description_max_words)
    end
  end

  def content_description
    html = @rendered_content
    return if html.nil?

    html = html.gsub(HEADING_REGEX, ' ').gsub(TABLE_REGEX, ' ').gsub(CALLOUT_KEYWORD_REGEX, '\1')
    text = filters.normalize_whitespace(filters.strip_html(html))
    filters.escape_once(text) unless text.empty?
  end

  def snippet(string, max_words)
    return string if string.nil?

    result = string.split(%r!\s+!, max_words + 1)[0...max_words].join(" ")
    result.length < string.length ? result.concat("…") : result
  end
end
