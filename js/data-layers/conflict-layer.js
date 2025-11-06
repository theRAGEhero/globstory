/**
 * Conflict Events Data Layer for GlobStory
 * Displays conflict data from UCDP API
 */

const ConflictLayer = {
  id: 'conflicts',
  name: 'Conflict Events',
  description: 'Armed conflict events from UCDP (1989-present)',
  source: 'Uppsala Conflict Data Program',
  icon: 'fas fa-burst',
  cache: true,
  timeDependent: true,

  /**
   * Fetch conflict data from UCDP API
   */
  fetchData: async ({ year, bounds }) => {
    console.log(`[ConflictLayer] Fetching conflicts for year ${year}`);

    // UCDP API only has data from 1989 onwards
    if (year < 1989) {
      console.warn(`[ConflictLayer] No data available before 1989 (requested: ${year})`);
      return [];
    }

    try {
      // UCDP GED API endpoint
      const url = `https://ucdpapi.pcr.uu.se/api/gedevents/23.1?year=${year}&pagesize=10000`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`UCDP API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.Result || data.Result.length === 0) {
        console.log(`[ConflictLayer] No conflict events found for ${year}`);
        return [];
      }

      // Filter events within visible bounds if provided
      let filteredEvents = data.Result;

      if (bounds) {
        filteredEvents = data.Result.filter(event => {
          const lat = event.latitude;
          const lon = event.longitude;
          return lat && lon && bounds.contains([lat, lon]);
        });
      }

      return filteredEvents.map(event => ({
        id: event.id,
        date: event.date_start,
        location: event.where_coordinates || event.where_description,
        latitude: event.latitude,
        longitude: event.longitude,
        deaths: event.deaths_a + event.deaths_b + event.deaths_civilians + event.deaths_unknown,
        deathsDetail: {
          sideA: event.deaths_a,
          sideB: event.deaths_b,
          civilians: event.deaths_civilians,
          unknown: event.deaths_unknown
        },
        conflict: event.conflict_name,
        dyad: event.dyad_name,
        type: event.type_of_violence === 1 ? 'State-based' :
              event.type_of_violence === 2 ? 'Non-state' :
              'One-sided violence',
        source: event.source_article,
        country: event.country
      }));

    } catch (error) {
      console.error('[ConflictLayer] Fetch error:', error);
      throw error;
    }
  },

  /**
   * Render conflict markers on map
   */
  render: async (layerGroup, conflicts, map) => {
    console.log(`[ConflictLayer] Rendering ${conflicts.length} conflict events`);

    if (conflicts.length === 0) {
      // Show notification that no data is available
      const notification = L.control({ position: 'topright' });
      notification.onAdd = function () {
        const div = L.DomUtil.create('div', 'conflict-notification');
        div.innerHTML = '<i class="fas fa-info-circle"></i> No conflict data for this time period';
        div.style.cssText = 'background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107;';
        return div;
      };
      notification.addTo(map);

      setTimeout(() => {
        map.removeControl(notification);
      }, 3000);

      return;
    }

    // Group events by location for clustering
    const clusters = ConflictLayer.clusterEvents(conflicts);

    clusters.forEach(cluster => {
      const totalDeaths = cluster.events.reduce((sum, e) => sum + e.deaths, 0);
      const avgLat = cluster.events.reduce((sum, e) => sum + e.latitude, 0) / cluster.events.length;
      const avgLon = cluster.events.reduce((sum, e) => sum + e.longitude, 0) / cluster.events.length;

      // Size based on deaths (min 5, max 30)
      const radius = Math.min(Math.max(totalDeaths / 5, 5), 30);

      // Color based on type
      const color = ConflictLayer.getConflictColor(cluster.events[0].type);

      const marker = L.circleMarker([avgLat, avgLon], {
        radius: radius,
        fillColor: color,
        color: '#000',
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.6
      });

      // Create popup content
      const popup = ConflictLayer.createPopup(cluster);
      marker.bindPopup(popup);

      // Hover effect
      marker.on('mouseover', function () {
        this.setStyle({
          fillOpacity: 0.9,
          weight: 2
        });
      });

      marker.on('mouseout', function () {
        this.setStyle({
          fillOpacity: 0.6,
          weight: 1
        });
      });

      marker.addTo(layerGroup);
    });

    // Add legend
    ConflictLayer.addLegend(map);
  },

  /**
   * Cluster nearby events
   */
  clusterEvents: (events) => {
    const clusters = [];
    const clusterRadius = 0.5; // degrees (~55km at equator)

    events.forEach(event => {
      // Find nearby cluster
      let foundCluster = false;

      for (const cluster of clusters) {
        const dist = Math.sqrt(
          Math.pow(cluster.lat - event.latitude, 2) +
          Math.pow(cluster.lon - event.longitude, 2)
        );

        if (dist < clusterRadius) {
          cluster.events.push(event);
          foundCluster = true;
          break;
        }
      }

      // Create new cluster
      if (!foundCluster) {
        clusters.push({
          lat: event.latitude,
          lon: event.longitude,
          events: [event]
        });
      }
    });

    return clusters;
  },

  /**
   * Get color for conflict type
   */
  getConflictColor: (type) => {
    switch (type) {
      case 'State-based': return '#dc3545';
      case 'Non-state': return '#fd7e14';
      case 'One-sided violence': return '#6f42c1';
      default: return '#6c757d';
    }
  },

  /**
   * Create popup HTML
   */
  createPopup: (cluster) => {
    const totalDeaths = cluster.events.reduce((sum, e) => sum + e.deaths, 0);
    const uniqueConflicts = [...new Set(cluster.events.map(e => e.conflict))];

    let html = `
      <div style="min-width: 250px;">
        <h4 style="margin: 0 0 10px 0; color: #dc3545;">
          <i class="fas fa-burst"></i> Conflict Event${cluster.events.length > 1 ? 's' : ''}
        </h4>

        <div style="margin-bottom: 10px;">
          <strong>Location:</strong> ${cluster.events[0].location}<br>
          <strong>Date:</strong> ${cluster.events[0].date}
          ${cluster.events.length > 1 ? ` (+${cluster.events.length - 1} more)` : ''}
        </div>

        <div style="background: #f8d7da; padding: 8px; border-radius: 4px; margin-bottom: 10px;">
          <strong style="color: #721c24;">Total Deaths: ${totalDeaths}</strong>
        </div>

        <div style="font-size: 13px;">
          <strong>Conflict${uniqueConflicts.length > 1 ? 's' : ''}:</strong><br>
    `;

    uniqueConflicts.slice(0, 3).forEach(conflict => {
      html += `<div style="margin-left: 10px;">• ${conflict}</div>`;
    });

    if (uniqueConflicts.length > 3) {
      html += `<div style="margin-left: 10px; color: #666;">+ ${uniqueConflicts.length - 3} more</div>`;
    }

    html += `
        </div>

        <div style="margin-top: 10px; font-size: 12px; color: #666;">
          <strong>Type:</strong> ${cluster.events[0].type}<br>
          <strong>Source:</strong> UCDP GED
        </div>
      </div>
    `;

    return html;
  },

  /**
   * Add legend to map
   */
  addLegend: (map) => {
    // Remove existing legend
    if (window.conflictLegend) {
      map.removeControl(window.conflictLegend);
    }

    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend conflict-legend');

      div.innerHTML = `
        <strong>Conflict Events</strong><br>
        <i style="background:#dc3545"></i> State-based<br>
        <i style="background:#fd7e14"></i> Non-state<br>
        <i style="background:#6f42c1"></i> One-sided<br>
        <div style="margin-top: 5px; font-size: 11px; color: #666;">
          Circle size = deaths
        </div>
      `;

      return div;
    };

    legend.addTo(map);
    window.conflictLegend = legend;
  },

  /**
   * Cleanup function
   */
  cleanup: () => {
    if (window.conflictLegend && window.MAP) {
      window.MAP.removeControl(window.conflictLegend);
      window.conflictLegend = null;
    }
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConflictLayer;
}
