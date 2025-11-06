# GlobStory Plugin Architecture

## Overview
A simple, GitHub-based plugin system allowing community contributions of AI-powered history functionalities.

## Plugin Structure

Each plugin is a GitHub repository with this structure:

```
my-history-plugin/
├── plugin.json          # Manifest file (required)
├── plugin.js            # Main plugin code (required)
├── plugin.css           # Optional styling
├── README.md            # Documentation
└── assets/              # Optional images/data
    └── icon.png
```

## plugin.json Manifest

```json
{
  "id": "ai-historical-context",
  "name": "AI Historical Context",
  "version": "1.0.0",
  "author": "YourGitHubUsername",
  "description": "Adds AI-generated historical context to articles",
  "homepage": "https://github.com/username/ai-historical-context",
  "main": "plugin.js",
  "styles": "plugin.css",
  "api": {
    "required": ["openai", "anthropic"],
    "optional": ["google-gemini"]
  },
  "permissions": [
    "wikipedia-content",
    "map-interaction",
    "settings-storage"
  ],
  "hooks": [
    "onArticleLoad",
    "onPlaceHover",
    "onYearClick"
  ],
  "settings": [
    {
      "key": "aiProvider",
      "type": "select",
      "label": "AI Provider",
      "options": ["OpenAI", "Anthropic", "Google"],
      "default": "OpenAI"
    },
    {
      "key": "contextLength",
      "type": "range",
      "label": "Context Length",
      "min": 50,
      "max": 500,
      "default": 200
    }
  ]
}
```

## Plugin API Interface

### Core Plugin Class

```javascript
// plugin.js
export default class HistoryPlugin {
  constructor(api) {
    this.api = api;  // GlobStory API provided by host
    this.config = {};
  }

  // Required lifecycle methods
  async initialize(config) {
    this.config = config;
    console.log('Plugin initialized:', config);
  }

  async activate() {
    // Register hooks
    this.api.hooks.register('onArticleLoad', this.onArticleLoad.bind(this));
    this.api.hooks.register('onPlaceHover', this.onPlaceHover.bind(this));
  }

  async deactivate() {
    // Cleanup
    this.api.hooks.unregister('onArticleLoad');
  }

  // Hook implementations
  async onArticleLoad(article) {
    // Get article data
    const { title, content, lang } = article;

    // Call external AI API
    const context = await this.generateContext(content);

    // Add UI element
    this.api.ui.addPanel('ai-context', {
      title: 'AI Historical Context',
      content: context,
      position: 'bottom'
    });
  }

  async onPlaceHover(place) {
    // React to place hover
    const { name, coords } = place;
    // Add marker, fetch data, etc.
  }

  async generateContext(text) {
    // AI API call example
    const apiKey = this.config.settings.apiKey;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Provide historical context for: ${text.slice(0, 500)}`
        }]
      })
    });
    return response.json();
  }
}
```

## Host Application API

GlobStory exposes this API to plugins:

```javascript
// js/plugin-api.js
class PluginAPI {
  constructor() {
    this.hooks = new HookManager();
    this.ui = new UIManager();
    this.map = new MapManager();
    this.storage = new StorageManager();
  }

  // Hook system
  hooks = {
    register: (hookName, callback) => { /*...*/ },
    unregister: (hookName, callback) => { /*...*/ },
    trigger: (hookName, data) => { /*...*/ }
  };

  // UI manipulation
  ui = {
    addPanel: (id, options) => { /*...*/ },
    addButton: (id, options) => { /*...*/ },
    showModal: (content) => { /*...*/ },
    addToMenu: (item) => { /*...*/ }
  };

  // Map interaction
  map = {
    addLayer: (layer) => { /*...*/ },
    addMarker: (coords, options) => { /*...*/ },
    panTo: (coords) => { /*...*/ },
    getVisibleBounds: () => { /*...*/ }
  };

  // Storage
  storage = {
    get: (key) => localStorage.getItem(`plugin_${key}`),
    set: (key, value) => localStorage.setItem(`plugin_${key}`, value)
  };

  // Content access
  getCurrentArticle: () => { /*...*/ },
  getCurrentLocation: () => { /*...*/ },
  getCurrentYear: () => { /*...*/ }
}
```

## Available Hooks

```javascript
// Hook triggers in main.js
const AVAILABLE_HOOKS = {
  // Content hooks
  'onArticleLoad': 'Fired when Wikipedia article loads',
  'onArticleSearch': 'Fired when user searches',
  'onTextImport': 'Fired when user imports custom text',

  // Map hooks
  'onMapMove': 'Fired when map pans/zooms',
  'onPlaceHover': 'Fired when hovering over place name',
  'onPlaceClick': 'Fired when clicking place name',
  'onMarkerAdd': 'Fired when marker added to map',

  // Time hooks
  'onYearClick': 'Fired when clicking year',
  'onTimeSliderChange': 'Fired when time slider moves',

  // UI hooks
  'onLanguageChange': 'Fired when language selector changes',
  'onSettingsChange': 'Fired when settings updated',

  // Lifecycle hooks
  'onAppReady': 'Fired when app fully initialized',
  'onAppDestroy': 'Fired before page unload'
};
```

## Plugin Installation Methods

### Method 1: Plugin Manager UI (Recommended)

```html
<!-- Add to app.html -->
<div id="plugin-manager-modal" class="modal">
  <h2>Plugin Manager</h2>
  <input type="text"
         id="plugin-repo-url"
         placeholder="https://github.com/user/plugin-name">
  <button onclick="installPlugin()">Install Plugin</button>

  <div id="installed-plugins">
    <!-- List of installed plugins -->
  </div>
</div>
```

```javascript
// js/plugin-manager.js
async function installPlugin(githubUrl) {
  // Parse GitHub URL
  const [owner, repo] = parseGitHubUrl(githubUrl);

  // Fetch plugin.json
  const manifest = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/main/plugin.json`
  ).then(r => r.json());

  // Download plugin files
  const pluginCode = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/main/${manifest.main}`
  ).then(r => r.text());

  // Store in localStorage or IndexedDB
  const pluginData = {
    manifest,
    code: pluginCode,
    enabled: true,
    installedAt: new Date().toISOString()
  };

  localStorage.setItem(`plugin_${manifest.id}`, JSON.stringify(pluginData));

  // Load plugin
  await loadPlugin(pluginData);
}
```

### Method 2: Plugin Registry (Community Curated)

Create `plugins/registry.json`:

```json
{
  "plugins": [
    {
      "id": "ai-summarizer",
      "name": "AI Article Summarizer",
      "description": "Generates AI summaries of historical articles",
      "author": "username",
      "repo": "https://github.com/username/ai-summarizer",
      "version": "1.2.0",
      "downloads": 1543,
      "rating": 4.8,
      "tags": ["ai", "openai", "summary"],
      "verified": true
    },
    {
      "id": "timeline-visualizer",
      "name": "Interactive Timeline",
      "description": "Creates visual timelines from article dates",
      "author": "developer2",
      "repo": "https://github.com/developer2/timeline-vis",
      "version": "2.0.1",
      "downloads": 892,
      "rating": 4.5,
      "tags": ["visualization", "timeline"],
      "verified": true
    }
  ]
}
```

### Method 3: Direct URL Import

```javascript
// Quick install from any GitHub repo
globstory.plugins.install('https://github.com/user/plugin');
```

## Example Plugins

### 1. AI Historical Context Plugin

```javascript
// Adds AI-generated summaries to articles
export default class AIContextPlugin {
  async onArticleLoad(article) {
    const summary = await this.callOpenAI(article.content);
    this.api.ui.addPanel('ai-summary', {
      title: 'AI Summary',
      content: summary,
      icon: 'fas fa-robot'
    });
  }
}
```

### 2. Historical Events Timeline

```javascript
// Creates interactive timeline from detected years
export default class TimelinePlugin {
  async onArticleLoad(article) {
    const years = this.extractYears(article);
    const timeline = this.renderTimeline(years);
    this.api.ui.addPanel('timeline', {
      title: 'Article Timeline',
      content: timeline
    });
  }
}
```

### 3. Image Recognition for Historical Photos

```javascript
// Uses AI to identify historical figures in photos
export default class ImageRecognitionPlugin {
  async onArticleLoad(article) {
    const images = article.images;
    for (const img of images) {
      const analysis = await this.analyzeImage(img.url);
      this.api.ui.addTooltip(img.element, analysis);
    }
  }
}
```

### 4. Multi-Source Historical Data

```javascript
// Pulls data from multiple historical databases
export default class MultiSourcePlugin {
  async onPlaceClick(place) {
    const britannica = await this.fetchBritannica(place.name);
    const loc = await this.fetchLibraryOfCongress(place.name);

    this.api.ui.showModal({
      title: `${place.name} - Multiple Sources`,
      tabs: [
        { name: 'Wikipedia', content: place.wikiContent },
        { name: 'Britannica', content: britannica },
        { name: 'Library of Congress', content: loc }
      ]
    });
  }
}
```

### 5. Voice Narration Plugin

```javascript
// Text-to-speech for articles
export default class VoiceNarrationPlugin {
  async activate() {
    this.api.ui.addButton('narrate', {
      icon: 'fas fa-volume-up',
      position: 'article-header',
      onClick: () => this.narrate()
    });
  }

  async narrate() {
    const article = this.api.getCurrentArticle();
    const speech = await this.textToSpeech(article.content);
    this.playAudio(speech);
  }
}
```

## Security Considerations

1. **Sandboxing**: Run plugins in isolated contexts
2. **Permissions**: Explicit permission system for API access
3. **Code Review**: Community verification for registry plugins
4. **CSP Headers**: Content Security Policy for external requests
5. **Rate Limiting**: Prevent API abuse

## Plugin Development Workflow

1. **Create GitHub repo** using template: `globstory-plugin-template`
2. **Develop locally** with GlobStory dev environment
3. **Test** with plugin developer tools
4. **Submit to registry** via PR to `plugins/registry.json`
5. **Community review** for verification badge
6. **Users install** via plugin manager or direct URL

## Benefits

- **Zero deployment**: Plugins load from GitHub raw URLs
- **Version control**: Git-based updates
- **Community driven**: Anyone can contribute
- **Easy discovery**: Central registry + GitHub topics
- **No backend needed**: Pure client-side architecture
- **Instant updates**: Pull latest from GitHub
- **Fork-friendly**: Easy to modify existing plugins

## Implementation Priority

1. **Phase 1**: Hook system in main.js (2-3 hours)
2. **Phase 2**: Plugin API interface (3-4 hours)
3. **Phase 3**: Plugin manager UI (4-5 hours)
4. **Phase 4**: Plugin registry + documentation (2-3 hours)
5. **Phase 5**: Example plugins (varies)

Total: ~15-20 hours for basic plugin system
