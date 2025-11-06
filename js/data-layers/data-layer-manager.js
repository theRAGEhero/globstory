/**
 * Data Layer Manager for GlobStory
 * Manages overlaying historical data on the map
 */

class DataLayerManager {
  constructor(map, timeslider) {
    this.map = map;
    this.timeslider = timeslider;
    this.layers = new Map();
    this.cache = new Map();
    this.activeLayerGroups = new Map();

    // Listen to time slider changes
    this.setupTimeSliderListener();
  }

  /**
   * Register a new data layer
   */
  registerLayer(id, config) {
    this.layers.set(id, {
      id,
      name: config.name,
      description: config.description || '',
      source: config.source,
      icon: config.icon || 'fas fa-layer-group',
      fetchData: config.fetchData,
      render: config.render,
      cleanup: config.cleanup || (() => {}),
      enabled: false,
      cache: config.cache !== false, // default true
      timeDependent: config.timeDependent !== false // default true
    });

    console.log(`[DataLayerManager] Registered layer: ${id}`);
  }

  /**
   * Enable a data layer
   */
  async enableLayer(id) {
    const layer = this.layers.get(id);
    if (!layer) {
      console.error(`[DataLayerManager] Layer not found: ${id}`);
      return;
    }

    if (layer.enabled) {
      console.log(`[DataLayerManager] Layer already enabled: ${id}`);
      return;
    }

    layer.enabled = true;
    console.log(`[DataLayerManager] Enabling layer: ${id}`);

    // Show loading state
    this.showLoading(id);

    try {
      await this.updateLayer(id);
    } catch (error) {
      console.error(`[DataLayerManager] Error enabling layer ${id}:`, error);
      this.showError(id, error.message);
      layer.enabled = false;
    } finally {
      this.hideLoading(id);
    }
  }

  /**
   * Disable a data layer
   */
  disableLayer(id) {
    const layer = this.layers.get(id);
    if (!layer) return;

    layer.enabled = false;
    console.log(`[DataLayerManager] Disabling layer: ${id}`);

    // Remove layer from map
    const layerGroup = this.activeLayerGroups.get(id);
    if (layerGroup) {
      this.map.removeLayer(layerGroup);
      this.activeLayerGroups.delete(id);
    }

    // Call cleanup function
    if (layer.cleanup) {
      layer.cleanup();
    }
  }

  /**
   * Update layer data based on current map state
   */
  async updateLayer(id, force = false) {
    const layer = this.layers.get(id);
    if (!layer || !layer.enabled) return;

    const currentYear = this.timeslider ? this.timeslider.getYear() : new Date().getFullYear();
    const bounds = this.map.getBounds();

    console.log(`[DataLayerManager] Updating layer ${id} for year ${currentYear}`);

    // Check cache
    const cacheKey = `${id}_${currentYear}_${Math.floor(this.map.getZoom())}`;
    if (!force && layer.cache && this.cache.has(cacheKey)) {
      console.log(`[DataLayerManager] Using cached data for ${id}`);
      const cachedData = this.cache.get(cacheKey);
      await this.renderLayer(id, cachedData);
      return;
    }

    // Fetch new data
    try {
      const data = await layer.fetchData({
        year: currentYear,
        bounds: bounds,
        zoom: this.map.getZoom(),
        center: this.map.getCenter()
      });

      // Cache it
      if (layer.cache) {
        this.cache.set(cacheKey, data);
        this.pruneCache(); // Limit cache size
      }

      // Render on map
      await this.renderLayer(id, data);

    } catch (error) {
      console.error(`[DataLayerManager] Error updating layer ${id}:`, error);
      this.showError(id, error.message);
      throw error;
    }
  }

  /**
   * Render layer data on the map
   */
  async renderLayer(id, data) {
    const layer = this.layers.get(id);
    if (!layer) return;

    // Remove existing layer
    const existingLayer = this.activeLayerGroups.get(id);
    if (existingLayer) {
      this.map.removeLayer(existingLayer);
    }

    // Create new layer group
    const layerGroup = L.layerGroup();
    this.activeLayerGroups.set(id, layerGroup);

    // Call layer's render function
    await layer.render(layerGroup, data, this.map);

    // Add to map
    layerGroup.addTo(this.map);

    console.log(`[DataLayerManager] Rendered layer ${id} with ${data?.length || 0} items`);
  }

  /**
   * Setup listener for time slider changes
   */
  setupTimeSliderListener() {
    if (!this.timeslider) return;

    // Listen for custom time change event
    document.addEventListener('timeSliderChange', (e) => {
      console.log(`[DataLayerManager] Time changed to ${e.detail.year}`);
      this.onTimeChange();
    });

    // Also listen for direct calls if exposed globally
    if (window.TIMESLIDER) {
      const originalSetYear = window.TIMESLIDER.setYear;
      if (originalSetYear) {
        window.TIMESLIDER.setYear = (year) => {
          originalSetYear.call(window.TIMESLIDER, year);
          this.onTimeChange();
        };
      }
    }
  }

  /**
   * Handle time slider change
   */
  onTimeChange() {
    console.log('[DataLayerManager] Updating all time-dependent layers');

    for (const [id, layer] of this.layers) {
      if (layer.enabled && layer.timeDependent) {
        this.updateLayer(id);
      }
    }
  }

  /**
   * Get enabled layers
   */
  getEnabledLayers() {
    return Array.from(this.layers.values()).filter(l => l.enabled);
  }

  /**
   * Get all registered layers
   */
  getAllLayers() {
    return Array.from(this.layers.values());
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[DataLayerManager] Cache cleared');
  }

  /**
   * Prune cache to limit size
   */
  pruneCache(maxSize = 50) {
    if (this.cache.size <= maxSize) return;

    const entries = Array.from(this.cache.entries());
    const toDelete = entries.slice(0, entries.length - maxSize);

    toDelete.forEach(([key]) => this.cache.delete(key));

    console.log(`[DataLayerManager] Pruned cache: removed ${toDelete.length} entries`);
  }

  /**
   * Show loading indicator for layer
   */
  showLoading(id) {
    const checkbox = document.getElementById(`layer-${id}`);
    if (checkbox) {
      const label = checkbox.nextElementSibling;
      if (label) {
        label.style.opacity = '0.5';
        label.innerHTML = label.innerHTML.replace('fa-', 'fa-spinner fa-spin fa-');
      }
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading(id) {
    const checkbox = document.getElementById(`layer-${id}`);
    if (checkbox) {
      const label = checkbox.nextElementSibling;
      if (label) {
        label.style.opacity = '1';
        label.innerHTML = label.innerHTML.replace('fa-spinner fa-spin', '');
      }
    }
  }

  /**
   * Show error notification
   */
  showError(id, message) {
    console.error(`[DataLayerManager] Error in layer ${id}: ${message}`);

    // You can integrate with your notification system here
    if (window.showNotification) {
      window.showNotification(`Error loading ${id}: ${message}`, 'error');
    } else {
      alert(`Error loading data layer: ${message}`);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataLayerManager;
}
