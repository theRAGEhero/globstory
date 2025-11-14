/**
 * Auto Conflict Data Loader for GlobStory
 *
 * Automatically loads conflict event data for the starting conflict zone
 * Displays recent events on map load
 *
 * Data Source: UCDP Georeferenced Event Dataset
 * Coverage: 1989-present
 * Updates: Annual
 * Cost: Free for non-commercial use
 */

class AutoConflictLoader {
  constructor(map, conflictZone) {
    this.map = map;
    this.conflictZone = conflictZone;
    this.conflictMarkers = [];
    this.conflictLayerGroup = null;
  }

  /**
   * Load conflict data for the current zone
   */
  async loadConflictData(options = {}) {
    const {
      year = new Date().getFullYear(),
      radiusKm = 500,
      maxEvents = 100
    } = options;

    console.log(`[AutoConflictLoader] Loading conflicts for ${this.conflictZone.name} (${year})`);

    try {
      // UCDP API endpoint
      const url = `https://ucdpapi.pcr.uu.se/api/gedevents/23.1?year=${year}&pagesize=1000`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`UCDP API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.Result || data.Result.length === 0) {
        console.log(`[AutoConflictLoader] No conflict events found for ${year}`);
        this.showNotification(`No conflict data available for ${this.conflictZone.name} in ${year}`, 'info');
        return;
      }

      // Filter events near the conflict zone
      const [zoneLat, zoneLon] = this.conflictZone.coords;
      const nearbyEvents = data.Result.filter(event => {
        if (!event.latitude || !event.longitude) return false;

        const distance = this.calculateDistance(
          zoneLat, zoneLon,
          event.latitude, event.longitude
        );

        return distance <= radiusKm;
      });

      // Limit number of events
      const eventsToShow = nearbyEvents.slice(0, maxEvents);

      if (eventsToShow.length === 0) {
        console.log(`[AutoConflictLoader] No nearby events found`);
        this.showNotification(`No recent conflicts found near ${this.conflictZone.name}`, 'info');
        return;
      }

      // Display events on map
      this.displayConflictEvents(eventsToShow, year);

      console.log(`[AutoConflictLoader] Loaded ${eventsToShow.length} conflict events`);

      // Show success notification
      this.showNotification(
        `Loaded ${eventsToShow.length} conflict event${eventsToShow.length > 1 ? 's' : ''} for ${this.conflictZone.name}`,
        'success'
      );

    } catch (error) {
      console.error('[AutoConflictLoader] Error loading conflict data:', error);
      this.showNotification(`Error loading conflict data: ${error.message}`, 'error');
    }
  }

  /**
   * Display conflict events as markers on map
   */
  displayConflictEvents(events, year) {
    // Remove existing markers
    this.clearMarkers();

    // Create layer group
    this.conflictLayerGroup = L.layerGroup();

    // Group events by location to avoid marker overlap
    const clusters = this.clusterEvents(events, 0.5); // 0.5 degree clustering

    clusters.forEach(cluster => {
      const totalDeaths = cluster.events.reduce((sum, e) =>
        sum + (e.deaths_a || 0) + (e.deaths_b || 0) +
        (e.deaths_civilians || 0) + (e.deaths_unknown || 0), 0
      );

      // Create marker
      const radius = Math.min(Math.max(totalDeaths / 5, 6), 25);

      const marker = L.circleMarker(
        [cluster.lat, cluster.lon],
        {
          radius: radius,
          fillColor: '#dc3545',
          color: '#8b0000',
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.6
        }
      );

      // Create popup
      const popup = this.createEventPopup(cluster, year);
      marker.bindPopup(popup);

      // Hover effects
      marker.on('mouseover', function () {
        this.setStyle({
          fillOpacity: 0.9,
          weight: 3
        });
      });

      marker.on('mouseout', function () {
        this.setStyle({
          fillOpacity: 0.6,
          weight: 2
        });
      });

      // Add to layer group
      marker.addTo(this.conflictLayerGroup);
      this.conflictMarkers.push(marker);
    });

    // Add layer group to map
    this.conflictLayerGroup.addTo(this.map);

    // Add legend
    this.addLegend(year);
  }

  /**
   * Create popup content for conflict event cluster
   */
  createEventPopup(cluster, year) {
    const totalDeaths = cluster.events.reduce((sum, e) =>
      sum + (e.deaths_a || 0) + (e.deaths_b || 0) +
      (e.deaths_civilians || 0) + (e.deaths_unknown || 0), 0
    );

    const uniqueConflicts = [...new Set(cluster.events.map(e => e.conflict_name))];

    let html = `
      <div style="min-width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h4 style="margin: 0 0 12px 0; color: #dc3545; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-burst"></i>
          Conflict Event${cluster.events.length > 1 ? 's' : ''} (${year})
        </h4>

        <div style="margin-bottom: 12px;">
          <strong>Location:</strong> ${cluster.events[0].where_coordinates || cluster.events[0].where_description || 'Unknown'}
        </div>

        <div style="background: #f8d7da; padding: 10px; border-radius: 4px; margin-bottom: 12px; border-left: 4px solid #dc3545;">
          <strong style="color: #721c24; font-size: 16px;">${totalDeaths} Reported Deaths</strong>
          ${cluster.events.length > 1 ? `<div style="font-size: 12px; color: #721c24; margin-top: 4px;">${cluster.events.length} separate events</div>` : ''}
        </div>

        <div style="margin-bottom: 12px;">
          <strong>Conflict${uniqueConflicts.length > 1 ? 's' : ''}:</strong>
          <ul style="margin: 5px 0; padding-left: 20px;">
    `;

    uniqueConflicts.slice(0, 3).forEach(conflict => {
      html += `<li style="margin: 3px 0;">${conflict}</li>`;
    });

    if (uniqueConflicts.length > 3) {
      html += `<li style="color: #666;">+ ${uniqueConflicts.length - 3} more...</li>`;
    }

    html += `
          </ul>
        </div>

        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          <strong>Source:</strong> UCDP Georeferenced Event Dataset<br>
          <strong>Type:</strong> ${this.getViolenceType(cluster.events[0].type_of_violence)}
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Get violence type label
   */
  getViolenceType(type) {
    switch (type) {
      case 1: return 'State-based conflict';
      case 2: return 'Non-state conflict';
      case 3: return 'One-sided violence';
      default: return 'Unknown';
    }
  }

  /**
   * Cluster nearby events to avoid marker overlap
   */
  clusterEvents(events, radiusDegrees) {
    const clusters = [];

    events.forEach(event => {
      let foundCluster = false;

      for (const cluster of clusters) {
        const dist = Math.sqrt(
          Math.pow(cluster.lat - event.latitude, 2) +
          Math.pow(cluster.lon - event.longitude, 2)
        );

        if (dist < radiusDegrees) {
          cluster.events.push(event);
          // Update cluster center (weighted average)
          cluster.lat = cluster.events.reduce((sum, e) => sum + e.latitude, 0) / cluster.events.length;
          cluster.lon = cluster.events.reduce((sum, e) => sum + e.longitude, 0) / cluster.events.length;
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        clusters.push({
          lat: event.latitude,
          lon: event.longitude,
          events: [event]
        });
      }
    });

    return clusters;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Clear all conflict markers
   */
  clearMarkers() {
    if (this.conflictLayerGroup) {
      this.map.removeLayer(this.conflictLayerGroup);
    }

    this.conflictMarkers = [];
    this.conflictLayerGroup = null;

    // Remove legend
    if (window.autoConflictLegend) {
      this.map.removeControl(window.autoConflictLegend);
      window.autoConflictLegend = null;
    }
  }

  /**
   * Add legend to map
   */
  addLegend(year) {
    // Remove existing legend
    if (window.autoConflictLegend) {
      this.map.removeControl(window.autoConflictLegend);
    }

    const legend = L.control({ position: 'bottomleft' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend auto-conflict-legend');

      div.innerHTML = `
        <div style="background: white; padding: 12px; border-radius: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
          <strong style="display: block; margin-bottom: 8px; color: #333;">
            <i class="fas fa-burst" style="color: #dc3545;"></i>
            Conflict Events ${year}
          </strong>
          <div style="font-size: 12px; color: #666; line-height: 1.5;">
            <i style="background: #dc3545; width: 12px; height: 12px; display: inline-block; border-radius: 50%; margin-right: 6px; border: 1px solid #8b0000;"></i>
            ${this.conflictZone.name}<br>
            <div style="margin-top: 6px; font-size: 11px; font-style: italic;">
              Circle size = deaths<br>
              Source: UCDP
            </div>
          </div>
        </div>
      `;

      return div;
    };

    legend.addTo(this.map);
    window.autoConflictLegend = legend;
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const colors = {
      success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
      info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' },
      error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' }
    };

    const color = colors[type] || colors.info;

    const notification = document.createElement('div');
    notification.innerHTML = `
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
      ${message}
    `;

    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: ${color.bg};
      color: ${color.text};
      padding: 12px 20px;
      border-radius: 6px;
      border: 1px solid ${color.border};
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AutoConflictLoader;
}
