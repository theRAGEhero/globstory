/**
 * Historical Boundaries Integration for GlobStory
 *
 * Automatically loads and displays historical political boundaries
 * that change as the user moves the time slider.
 *
 * Data Source: Thenmap (https://thenmap.net)
 * Coverage: 1946-present (world-2 dataset)
 * Format: GeoJSON
 * Cost: Free, open source
 */

class HistoricalBoundaries {
  constructor(map, timeslider) {
    this.map = map;
    this.timeslider = timeslider;
    this.currentBoundaryLayer = null;
    this.cache = new Map();
    this.enabled = false;
    this.defaultStyle = {
      color: '#444',
      weight: 2,
      fillOpacity: 0.05,
      fillColor: '#888'
    };
    this.highlightStyle = {
      color: '#000',
      weight: 3,
      fillOpacity: 0.15
    };
  }

  /**
   * Enable historical boundaries
   */
  async enable() {
    if (this.enabled) return;

    this.enabled = true;
    console.log('[HistoricalBoundaries] Enabling...');

    // Get current year from time slider
    const currentDate = this.timeslider.getDate();
    const year = new Date(currentDate).getFullYear();

    // Load boundaries for current year
    await this.loadBoundaries(year);

    // Set up time slider listener
    this.setupTimeSliderListener();

    console.log('[HistoricalBoundaries] Enabled');
  }

  /**
   * Disable historical boundaries
   */
  disable() {
    if (!this.enabled) return;

    this.enabled = false;
    console.log('[HistoricalBoundaries] Disabling...');

    // Remove boundary layer from map
    if (this.currentBoundaryLayer) {
      this.map.removeLayer(this.currentBoundaryLayer);
      this.currentBoundaryLayer = null;
    }

    console.log('[HistoricalBoundaries] Disabled');
  }

  /**
   * Load boundaries for a specific year
   */
  async loadBoundaries(year) {
    console.log(`[HistoricalBoundaries] Loading boundaries for ${year}`);

    // Check if year is supported
    if (year < 1946) {
      console.warn(`[HistoricalBoundaries] Thenmap data only available from 1946 onwards (requested: ${year})`);
      this.showNotification(`Historical borders not available before 1946`, 'info');
      return;
    }

    try {
      // Check cache first
      const cacheKey = year.toString();
      if (this.cache.has(cacheKey)) {
        console.log(`[HistoricalBoundaries] Using cached data for ${year}`);
        this.renderBoundaries(this.cache.get(cacheKey), year);
        return;
      }

      // Fetch from Thenmap API
      const date = `${year}-01-01`;
      const url = `https://thenmap.net/v2/world-2/${date}/data.geojson`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Thenmap API error: ${response.status} ${response.statusText}`);
      }

      const geojson = await response.json();

      // Cache it
      this.cache.set(cacheKey, geojson);
      this.pruneCache();

      // Render on map
      this.renderBoundaries(geojson, year);

      console.log(`[HistoricalBoundaries] Loaded ${geojson.features.length} countries for ${year}`);

    } catch (error) {
      console.error('[HistoricalBoundaries] Error loading boundaries:', error);
      this.showNotification(`Error loading boundaries: ${error.message}`, 'error');
    }
  }

  /**
   * Render boundaries on map
   */
  renderBoundaries(geojson, year) {
    // Remove existing boundary layer
    if (this.currentBoundaryLayer) {
      this.map.removeLayer(this.currentBoundaryLayer);
    }

    // Create new GeoJSON layer
    this.currentBoundaryLayer = L.geoJSON(geojson, {
      style: (feature) => {
        return this.defaultStyle;
      },
      onEachFeature: (feature, layer) => {
        this.setupFeatureInteraction(feature, layer, year);
      }
    });

    // Add to map
    this.currentBoundaryLayer.addTo(this.map);

    // Store globally for other layers to access
    window.boundaryLayer = this.currentBoundaryLayer;

    console.log(`[HistoricalBoundaries] Rendered boundaries for ${year}`);
  }

  /**
   * Setup interaction (hover, click) for each country
   */
  setupFeatureInteraction(feature, layer, year) {
    const props = feature.properties;
    const countryName = props.name || props.NAME || 'Unknown';

    // Create popup content
    const popup = this.createPopupContent(props, year);
    layer.bindPopup(popup);

    // Hover effects
    layer.on('mouseover', function (e) {
      const layer = e.target;
      layer.setStyle({
        weight: 3,
        color: '#000',
        fillOpacity: 0.15
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }
    });

    layer.on('mouseout', function (e) {
      const layer = e.target;
      layer.setStyle({
        weight: 2,
        color: '#444',
        fillOpacity: 0.05
      });
    });

    // Click to zoom
    layer.on('click', function (e) {
      const layer = e.target;
      const bounds = layer.getBounds();
      e.target._map.fitBounds(bounds, { padding: [50, 50] });
    });
  }

  /**
   * Create popup content for country
   */
  createPopupContent(properties, year) {
    const name = properties.name || properties.NAME || 'Unknown';
    const code = properties.iso_a3 || properties.iso3 || properties.ISO || '';
    const status = properties.status || '';

    let html = `
      <div style="min-width: 200px;">
        <h4 style="margin: 0 0 10px 0;">${name}</h4>
    `;

    if (code) {
      html += `<div><strong>Code:</strong> ${code}</div>`;
    }

    if (status) {
      html += `<div><strong>Status:</strong> ${status}</div>`;
    }

    html += `
        <div style="margin-top: 10px; font-size: 12px; color: #666;">
          As of ${year}
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Setup time slider listener
   */
  setupTimeSliderListener() {
    // Hook into existing time slider change event
    const originalOnDateChange = this.timeslider.options.onDateChange;

    this.timeslider.options.onDateChange = async (date) => {
      // Call original handler
      if (originalOnDateChange) {
        originalOnDateChange.call(this.timeslider, date);
      }

      // Update boundaries if enabled
      if (this.enabled) {
        const year = new Date(date).getFullYear();
        await this.loadBoundaries(year);
      }
    };
  }

  /**
   * Prune cache to limit memory usage
   */
  pruneCache(maxSize = 20) {
    if (this.cache.size <= maxSize) return;

    const entries = Array.from(this.cache.entries());
    const toDelete = entries.slice(0, entries.length - maxSize);

    toDelete.forEach(([key]) => this.cache.delete(key));

    console.log(`[HistoricalBoundaries] Pruned cache: removed ${toDelete.length} entries`);
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `boundary-notification ${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      ${message}
    `;

    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#f8d7da' : '#d1ecf1'};
      color: ${type === 'error' ? '#721c24' : '#0c5460'};
      padding: 12px 20px;
      border-radius: 6px;
      border: 1px solid ${type === 'error' ? '#f5c6cb' : '#bee5eb'};
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    `;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Get current boundary layer
   */
  getBoundaryLayer() {
    return this.currentBoundaryLayer;
  }

  /**
   * Check if boundaries are enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[HistoricalBoundaries] Cache cleared');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HistoricalBoundaries;
}
