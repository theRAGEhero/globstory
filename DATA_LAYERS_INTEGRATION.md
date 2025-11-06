# Data Layers Integration Guide

This guide shows how to integrate the historical data layers into your existing GlobStory application.

## 📁 Files Created

```
globstory/
├── js/
│   └── data-layers/
│       ├── data-layer-manager.js       # Core manager
│       ├── population-layer.js         # Population data
│       └── conflict-layer.js           # Conflict events
├── css/
│   └── data-layers/
│       └── data-layers.css             # Styling
├── HISTORICAL_DATA_SOURCES.md          # Data source documentation
└── DATA_LAYERS_INTEGRATION.md          # This file
```

## 🚀 Quick Start Integration

### Step 1: Add HTML Structure

Add this to your `app.html` before the closing `</body>` tag:

```html
<!-- Data Layers Control Panel -->
<button id="toggle-data-panel" onclick="toggleDataPanel()" title="Data Layers">
  <i class="fas fa-layer-group"></i>
</button>

<div id="data-layers-panel">
  <h3><i class="fas fa-layer-group"></i> Data Layers</h3>

  <div class="layer-toggle" id="toggle-population">
    <input type="checkbox" id="layer-population" onchange="toggleLayer('population', this.checked)">
    <label for="layer-population">
      <i class="fas fa-users"></i>
      <span>Population</span>
    </label>
  </div>
  <div class="layer-info">Country population (1960-present)</div>

  <div class="layer-toggle" id="toggle-conflicts">
    <input type="checkbox" id="layer-conflicts" onchange="toggleLayer('conflicts', this.checked)">
    <label for="layer-conflicts">
      <i class="fas fa-burst"></i>
      <span>Conflict Events</span>
    </label>
  </div>
  <div class="layer-info">Armed conflicts (1989-present)</div>

  <div class="layer-toggle" id="toggle-boundaries">
    <input type="checkbox" id="layer-boundaries" onchange="toggleLayer('boundaries', this.checked)">
    <label for="layer-boundaries">
      <i class="fas fa-map"></i>
      <span>Historical Borders</span>
    </label>
  </div>
  <div class="layer-info">Changing boundaries over time</div>
</div>

<!-- Include Scripts -->
<script src="js/data-layers/data-layer-manager.js"></script>
<script src="js/data-layers/population-layer.js"></script>
<script src="js/data-layers/conflict-layer.js"></script>

<!-- Include Styles -->
<link rel="stylesheet" href="css/data-layers/data-layers.css">
```

### Step 2: Initialize in main.js

Add this code to `js/main.js` after map initialization (around line 90):

```javascript
// Initialize Data Layer Manager
let DATA_LAYER_MANAGER;

// After map and timeslider are initialized
function initializeDataLayers() {
  console.log('[GlobStory] Initializing data layers...');

  // Create manager instance
  DATA_LAYER_MANAGER = new DataLayerManager(MAP, TIMESLIDER);

  // Register available layers
  DATA_LAYER_MANAGER.registerLayer('population', PopulationLayer);
  DATA_LAYER_MANAGER.registerLayer('conflicts', ConflictLayer);

  // Make it globally accessible
  window.DATA_LAYER_MANAGER = DATA_LAYER_MANAGER;

  console.log('[GlobStory] Data layers initialized');
}

// Call after map setup
document.addEventListener('DOMContentLoaded', () => {
  // Your existing initialization code...

  // Then initialize data layers
  setTimeout(() => {
    initializeDataLayers();
  }, 1000);
});
```

### Step 3: Add Toggle Functions

Add these functions to `js/main.js`:

```javascript
/**
 * Toggle data layer on/off
 */
async function toggleLayer(layerId, enabled) {
  if (!DATA_LAYER_MANAGER) {
    console.error('[GlobStory] Data Layer Manager not initialized');
    return;
  }

  const toggleDiv = document.getElementById(`toggle-${layerId}`);

  if (enabled) {
    toggleDiv.classList.add('active', 'loading');
    try {
      await DATA_LAYER_MANAGER.enableLayer(layerId);
    } catch (error) {
      // Uncheck on error
      document.getElementById(`layer-${layerId}`).checked = false;
    }
    toggleDiv.classList.remove('loading');
  } else {
    DATA_LAYER_MANAGER.disableLayer(layerId);
    toggleDiv.classList.remove('active');
  }
}

/**
 * Toggle data layers panel visibility
 */
function toggleDataPanel() {
  const panel = document.getElementById('data-layers-panel');
  panel.classList.toggle('collapsed');

  const button = document.getElementById('toggle-data-panel');
  const icon = button.querySelector('i');

  if (panel.classList.contains('collapsed')) {
    icon.className = 'fas fa-layer-group';
  } else {
    icon.className = 'fas fa-times';
  }
}
```

### Step 4: Connect Time Slider

Modify your time slider change handler to notify the data layer manager.

Find where the time slider changes (in `js/leaflet-ohm-timeslider.js` or `js/main.js`):

```javascript
// In your time slider change handler, add:
function onTimeSliderChange(newYear) {
  // Your existing code...

  // Notify data layers
  if (window.DATA_LAYER_MANAGER) {
    window.DATA_LAYER_MANAGER.onTimeChange();
  }

  // Or dispatch custom event
  document.dispatchEvent(new CustomEvent('timeSliderChange', {
    detail: { year: newYear }
  }));
}
```

## 📊 Testing the Integration

1. **Open GlobStory** in your browser
2. **Look for the layers button** (three layers icon) in the top-right
3. **Click it** to open the data layers panel
4. **Enable Population layer**:
   - Check the "Population" checkbox
   - Wait for data to load (1-2 seconds)
   - Countries should be colored by population
   - Click countries to see population data
5. **Move the time slider**:
   - Population colors should update automatically
6. **Enable Conflict Events**:
   - Red/orange circles appear for conflict zones
   - Only works for years 1989+
   - Click markers for event details

## 🎨 Customization

### Adding a New Data Layer

Create a new file `js/data-layers/your-layer.js`:

```javascript
const YourLayer = {
  id: 'your-layer-id',
  name: 'Your Layer Name',
  description: 'What your layer shows',
  source: 'Data Source Name',
  icon: 'fas fa-icon-name',
  cache: true,
  timeDependent: true,

  fetchData: async ({ year, bounds, zoom, center }) => {
    // Fetch your data
    const response = await fetch(`https://api.example.com/data?year=${year}`);
    return response.json();
  },

  render: async (layerGroup, data, map) => {
    // Render data on map
    data.forEach(item => {
      const marker = L.marker([item.lat, item.lon]);
      marker.bindPopup(item.name);
      marker.addTo(layerGroup);
    });
  },

  cleanup: () => {
    // Optional cleanup
  }
};
```

Then register it:

```javascript
DATA_LAYER_MANAGER.registerLayer('your-layer-id', YourLayer);
```

### Customizing Colors

Edit `css/data-layers/data-layers.css`:

```css
/* Change panel background color */
#data-layers-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* Change layer toggle hover color */
.layer-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}
```

### Customizing Layer Icons

Change icons in your layer definitions:

```javascript
icon: 'fas fa-chart-line',  // Economic data
icon: 'fas fa-graduation-cap',  // Education data
icon: 'fas fa-heartbeat',  // Health data
icon: 'fas fa-cloud-sun',  // Climate data
```

## 🔌 Advanced Features

### 1. Load Historical Boundaries

To make population/GDP data more useful, load country boundaries:

```javascript
// Add to main.js
async function loadHistoricalBoundaries(year) {
  const date = `${year}-01-01`;
  const response = await fetch(
    `https://thenmap.net/v2/world-2/${date}/data.geojson`
  );
  const geojson = await response.json();

  // Remove old boundaries
  if (window.boundaryLayer) {
    MAP.removeLayer(window.boundaryLayer);
  }

  // Add new boundaries
  window.boundaryLayer = L.geoJSON(geojson, {
    style: {
      color: '#333',
      weight: 2,
      fillOpacity: 0.1
    }
  });

  window.boundaryLayer.addTo(MAP);
}

// Call when time slider changes
function onTimeSliderChange(newYear) {
  loadHistoricalBoundaries(newYear);
  // ... rest of your code
}
```

### 2. Combine Multiple Layers

Example: Show conflicts + population together:

```javascript
async function showConflictPopulationContext() {
  // Enable both layers
  await DATA_LAYER_MANAGER.enableLayer('population');
  await DATA_LAYER_MANAGER.enableLayer('conflicts');

  // Adjust conflict markers to stand out on population heat map
  // (Automatically handled by layer rendering)
}
```

### 3. Export Data

Add export functionality:

```javascript
function exportLayerData(layerId) {
  const layer = DATA_LAYER_MANAGER.layers.get(layerId);
  if (!layer) return;

  // Get cached data
  const cacheKey = `${layerId}_${currentYear}_${zoom}`;
  const data = DATA_LAYER_MANAGER.cache.get(cacheKey);

  if (!data) {
    alert('No data loaded for this layer');
    return;
  }

  // Convert to CSV
  const csv = convertToCSV(data);

  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${layerId}_${currentYear}.csv`;
  a.click();
}
```

## 🐛 Troubleshooting

### Data Not Loading

**Problem**: Checkbox enabled but nothing happens

**Solutions**:
1. Check browser console for errors
2. Verify API endpoints are accessible:
   ```javascript
   fetch('https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?date=2020&format=json&per_page=1')
     .then(r => r.json())
     .then(d => console.log('World Bank API works:', d))
     .catch(e => console.error('World Bank API error:', e));
   ```
3. Check if `boundaryLayer` exists (required for population/GDP):
   ```javascript
   console.log('Boundary layer:', window.boundaryLayer);
   ```

### Time Slider Not Updating Layers

**Problem**: Moving time slider doesn't update data layers

**Solutions**:
1. Verify time slider connection:
   ```javascript
   console.log('Time slider:', window.TIMESLIDER);
   console.log('Data manager:', window.DATA_LAYER_MANAGER);
   ```
2. Check event listener:
   ```javascript
   document.addEventListener('timeSliderChange', (e) => {
     console.log('Time changed to:', e.detail.year);
   });
   ```

### CORS Errors

**Problem**: `Access-Control-Allow-Origin` errors

**Solutions**:
1. Some APIs may not support CORS - use a proxy:
   ```javascript
   const proxyURL = 'https://api.allorigins.win/raw?url=';
   const response = await fetch(proxyURL + encodeURIComponent(apiURL));
   ```
2. Or set up your own CORS proxy

### Performance Issues

**Problem**: App slows down with layers enabled

**Solutions**:
1. Enable caching (default):
   ```javascript
   cache: true  // in layer definition
   ```
2. Reduce marker count with clustering
3. Use progressive loading based on zoom
4. Limit data to visible bounds only

## 📱 Mobile Considerations

The data layers panel is responsive and works on mobile, but:

1. **Touch Events**: Already handled by CSS `:active` states
2. **Performance**: Consider limiting data on mobile:
   ```javascript
   const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
   if (isMobile) {
     // Load less data or simplified version
   }
   ```
3. **Panel Position**: Automatically moves to bottom on mobile (via CSS media queries)

## 🎯 Next Steps

1. **Add More Layers**: See `HISTORICAL_DATA_SOURCES.md` for 20+ data sources
2. **Create Presets**: Add buttons for common combinations (e.g., "WWII Context")
3. **Add Filters**: Let users filter by region, time period, event type
4. **Timeline Integration**: Show data trends in a timeline chart
5. **Share Links**: Save layer states in URL parameters

## 📚 Resources

- **Data Sources**: See `HISTORICAL_DATA_SOURCES.md`
- **Plugin System**: See `PLUGIN_ARCHITECTURE.md`
- **API Documentation**:
  - World Bank: https://datahelpdesk.worldbank.org/knowledgebase/topics/125589
  - UCDP: https://ucdp.uu.se/apidocs/
  - Thenmap: https://thenmap.net/
  - UNESCO: https://apiportal.uis.unesco.org/

## ✅ Verification Checklist

Before deploying:

- [ ] Data layers panel appears and is clickable
- [ ] Population layer loads and colors countries
- [ ] Conflict layer shows markers (for years 1989+)
- [ ] Time slider updates layer data
- [ ] Legends appear when layers are enabled
- [ ] Tooltips/popups show correct information
- [ ] Layers can be toggled on/off smoothly
- [ ] Mobile layout works correctly
- [ ] Console shows no errors
- [ ] Performance is acceptable (no lag)

## 🎉 You're Done!

Your GlobStory installation now has rich historical data layers! Users can explore:
- Population changes over time
- Conflict zones and battles
- Economic development
- And much more...

Enjoy building an even better historical exploration platform! 🗺️📊
