# AI Historical Summary Plugin

A GlobStory plugin that generates AI-powered summaries of Wikipedia articles using OpenAI or Anthropic APIs.

## Features

- **Automatic Summaries**: Auto-generate summaries when articles load
- **Multiple AI Providers**: Support for OpenAI GPT-4 and Anthropic Claude
- **Caching**: Saves generated summaries to avoid redundant API calls
- **Customizable**: Configure summary length, provider, and behavior
- **Beautiful UI**: Gradient-styled panel with smooth animations

## Installation

### Method 1: Direct GitHub URL

```javascript
// In GlobStory plugin manager
globstory.plugins.install('https://github.com/yourusername/globstory-ai-summary-plugin');
```

### Method 2: Manual Installation

1. Clone this repository
2. Copy files to GlobStory's `plugins/` directory
3. Restart GlobStory

## Configuration

### Get an API Key

**OpenAI**:
1. Visit https://platform.openai.com/api-keys
2. Create new API key
3. Copy key

**Anthropic**:
1. Visit https://console.anthropic.com/account/keys
2. Create new API key
3. Copy key

### Plugin Settings

Open GlobStory Settings → Plugins → AI Historical Summary:

| Setting | Description | Default |
|---------|-------------|---------|
| **AI Provider** | Choose OpenAI or Anthropic | None |
| **API Key** | Your API key | (empty) |
| **Summary Length** | Target word count | 150 |
| **Auto-generate** | Generate on article load | true |

## Usage

### Auto-Generation

When enabled, summaries generate automatically when you load a Wikipedia article.

### Manual Generation

Click the **"Generate AI Summary"** button in the article header.

### Clear Cache

```javascript
globstory.plugins.get('ai-historical-summary').clearCache();
```

## Examples

### Generated Summary for "World War II"

> World War II (1939-1945) was the deadliest conflict in human history, involving over 30 countries and resulting in 70-85 million deaths. The war began with Germany's invasion of Poland and evolved into a global conflict between the Axis powers (Germany, Italy, Japan) and the Allied forces (UK, USSR, USA). Key events included the Holocaust, the Battle of Stalingrad, D-Day, and the atomic bombings of Hiroshima and Nagasaki, which led to Japan's surrender in 1945.

## API Costs

**OpenAI GPT-4o-mini**:
- ~$0.0001 per summary (150 words)
- 10,000 summaries ≈ $1

**Anthropic Claude Sonnet**:
- ~$0.0002 per summary (150 words)
- 5,000 summaries ≈ $1

## Development

### Plugin Structure

```
ai-historical-summary/
├── plugin.json      # Manifest
├── plugin.js        # Main logic
├── plugin.css       # Styles
└── README.md        # Documentation
```

### Extending the Plugin

```javascript
// Add custom AI provider
async callCustomAI(text, title) {
  const response = await fetch('https://your-api.com/v1/summarize', {
    method: 'POST',
    body: JSON.stringify({ text, title })
  });
  return response.json();
}
```

### Testing

```bash
# Serve locally
python -m http.server 8000

# Open GlobStory with dev mode
globstory --dev --plugin-path ./ai-historical-summary
```

## Troubleshooting

### "No API key configured"

Add your API key in plugin settings.

### "API error: 401"

Invalid API key. Generate a new one.

### "API error: 429"

Rate limit exceeded. Wait a few minutes.

### Summary not generating

1. Check browser console for errors
2. Verify API key is valid
3. Check network connectivity
4. Clear plugin cache

## Privacy

- API keys stored locally in browser
- Summaries cached locally
- Article content sent to AI provider (OpenAI/Anthropic)
- No data sent to GlobStory servers

## Contributing

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file

## Credits

Built by [Your Name] for GlobStory

## Links

- [GlobStory](https://github.com/yourusername/globstory)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Report Issues](https://github.com/yourusername/globstory-ai-summary-plugin/issues)
