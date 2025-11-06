/**
 * AI Historical Summary Plugin for GlobStory
 *
 * This plugin demonstrates how to:
 * - Hook into article load events
 * - Call external AI APIs
 * - Add custom UI elements
 * - Store plugin settings
 */

export default class AIHistoricalSummaryPlugin {
  constructor(api) {
    this.api = api;  // GlobStory API
    this.config = {};
    this.cache = new Map();  // Cache summaries
  }

  /**
   * Initialize plugin with configuration
   */
  async initialize(config) {
    this.config = config;
    console.log('[AI Summary Plugin] Initialized with config:', config);

    // Load cached summaries from storage
    const cached = this.api.storage.get('ai_summaries_cache');
    if (cached) {
      this.cache = new Map(JSON.parse(cached));
    }
  }

  /**
   * Activate plugin and register hooks
   */
  async activate() {
    console.log('[AI Summary Plugin] Activating...');

    // Register hooks
    this.api.hooks.register('onArticleLoad', this.onArticleLoad.bind(this));
    this.api.hooks.register('onAppReady', this.onAppReady.bind(this));

    // Add UI button to article header
    this.api.ui.addButton('generate-summary', {
      icon: 'fas fa-robot',
      label: 'Generate AI Summary',
      position: 'article-header',
      onClick: () => this.generateSummary()
    });

    console.log('[AI Summary Plugin] Activated successfully');
  }

  /**
   * Deactivate plugin and cleanup
   */
  async deactivate() {
    console.log('[AI Summary Plugin] Deactivating...');

    // Unregister hooks
    this.api.hooks.unregister('onArticleLoad');
    this.api.hooks.unregister('onAppReady');

    // Remove UI elements
    this.api.ui.removeButton('generate-summary');
    this.api.ui.removePanel('ai-summary');

    // Save cache
    this.saveCache();
  }

  /**
   * Hook: Called when app is ready
   */
  async onAppReady() {
    console.log('[AI Summary Plugin] App ready');

    // Show notification if API key not configured
    if (!this.config.settings.apiKey) {
      this.api.ui.showNotification({
        type: 'info',
        message: 'AI Summary Plugin: Configure your API key in settings',
        duration: 5000
      });
    }
  }

  /**
   * Hook: Called when Wikipedia article loads
   */
  async onArticleLoad(article) {
    console.log('[AI Summary Plugin] Article loaded:', article.title);

    // Check if auto-generate is enabled
    if (!this.config.settings.autoGenerate) {
      return;
    }

    // Check if API key is configured
    if (!this.config.settings.apiKey) {
      console.log('[AI Summary Plugin] No API key configured');
      return;
    }

    // Check cache first
    const cacheKey = `${article.title}_${article.lang}`;
    if (this.cache.has(cacheKey)) {
      console.log('[AI Summary Plugin] Using cached summary');
      this.displaySummary(this.cache.get(cacheKey));
      return;
    }

    // Generate new summary
    await this.generateSummary(article);
  }

  /**
   * Generate AI summary for current article
   */
  async generateSummary(article = null) {
    // Get current article if not provided
    if (!article) {
      article = this.api.getCurrentArticle();
      if (!article) {
        this.api.ui.showNotification({
          type: 'error',
          message: 'No article loaded',
          duration: 3000
        });
        return;
      }
    }

    // Show loading state
    this.api.ui.addPanel('ai-summary', {
      title: 'AI Historical Summary',
      content: '<div class="loading">Generating summary...</div>',
      icon: 'fas fa-robot',
      position: 'top'
    });

    try {
      // Extract text content (first 3000 characters)
      const textContent = this.extractText(article.content).slice(0, 3000);

      // Call AI API based on provider
      let summary;
      if (this.config.settings.aiProvider === 'OpenAI') {
        summary = await this.callOpenAI(textContent, article.title);
      } else if (this.config.settings.aiProvider === 'Anthropic') {
        summary = await this.callAnthropic(textContent, article.title);
      } else {
        throw new Error('No AI provider selected');
      }

      // Cache the summary
      const cacheKey = `${article.title}_${article.lang}`;
      this.cache.set(cacheKey, summary);
      this.saveCache();

      // Display summary
      this.displaySummary(summary);

    } catch (error) {
      console.error('[AI Summary Plugin] Error:', error);
      this.api.ui.updatePanel('ai-summary', {
        content: `<div class="error">Error: ${error.message}</div>`
      });
    }
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(text, title) {
    const apiKey = this.config.settings.apiKey;
    const summaryLength = this.config.settings.summaryLength;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a historical expert. Provide concise, accurate summaries of historical articles.'
          },
          {
            role: 'user',
            content: `Summarize this historical article about "${title}" in approximately ${summaryLength} words. Focus on key historical facts, dates, and significance:\n\n${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: Math.ceil(summaryLength * 1.5)
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Anthropic API
   */
  async callAnthropic(text, title) {
    const apiKey = this.config.settings.apiKey;
    const summaryLength = this.config.settings.summaryLength;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: Math.ceil(summaryLength * 1.5),
        messages: [
          {
            role: 'user',
            content: `Summarize this historical article about "${title}" in approximately ${summaryLength} words. Focus on key historical facts, dates, and significance:\n\n${text}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Display summary in UI panel
   */
  displaySummary(summary) {
    const html = `
      <div class="ai-summary-content">
        <p>${summary}</p>
        <div class="ai-summary-footer">
          <small>Generated by ${this.config.settings.aiProvider}</small>
          <button class="regenerate-btn" onclick="globstory.plugins.get('ai-historical-summary').generateSummary()">
            <i class="fas fa-sync"></i> Regenerate
          </button>
        </div>
      </div>
    `;

    this.api.ui.updatePanel('ai-summary', {
      content: html
    });
  }

  /**
   * Extract plain text from HTML content
   */
  extractText(html) {
    const div = document.createElement('div');
    div.innerHTML = html;

    // Remove script and style elements
    div.querySelectorAll('script, style').forEach(el => el.remove());

    return div.textContent || div.innerText || '';
  }

  /**
   * Save summary cache to storage
   */
  saveCache() {
    const cacheArray = Array.from(this.cache.entries());
    this.api.storage.set('ai_summaries_cache', JSON.stringify(cacheArray));
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.api.storage.remove('ai_summaries_cache');
    this.api.ui.showNotification({
      type: 'success',
      message: 'Summary cache cleared',
      duration: 3000
    });
  }
}
