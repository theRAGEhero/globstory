/**
 * Population Data Layer for GlobStory
 * Displays population data from World Bank API
 */

const PopulationLayer = {
  id: 'population',
  name: 'Population',
  description: 'Country population data from World Bank (1960-present)',
  source: 'World Bank',
  icon: 'fas fa-users',
  cache: true,
  timeDependent: true,

  /**
   * Fetch population data for all countries
   */
  fetchData: async ({ year, bounds }) => {
    console.log(`[PopulationLayer] Fetching data for year ${year}`);

    try {
      // World Bank API endpoint for population
      const url = `https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?date=${year}&format=json&per_page=300`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`World Bank API error: ${response.status}`);
      }

      const data = await response.json();

      // World Bank returns [metadata, data]
      const populationData = data[1];

      if (!populationData || populationData.length === 0) {
        throw new Error(`No population data available for year ${year}`);
      }

      // Filter out null values and format
      return populationData
        .filter(item => item.value !== null && item.value > 0)
        .map(item => ({
          country: item.country.value,
          countryCode: item.countryiso3code,
          population: item.value,
          year: item.date
        }));

    } catch (error) {
      console.error('[PopulationLayer] Fetch error:', error);
      throw error;
    }
  },

  /**
   * Render population data on map
   */
  render: async (layerGroup, data, map) => {
    console.log(`[PopulationLayer] Rendering ${data.length} countries`);

    // Get country boundaries if available
    const boundaryLayer = window.boundaryLayer;
    if (!boundaryLayer) {
      console.warn('[PopulationLayer] No boundary layer available - consider loading boundaries first');
      return;
    }

    // Create population scale
    const maxPop = Math.max(...data.map(d => d.population));
    const getOpacity = (population) => {
      const normalized = population / maxPop;
      return 0.3 + (normalized * 0.5); // Range: 0.3 to 0.8
    };

    const getColor = (population) => {
      // Color scale from light to dark blue
      if (population > 500000000) return '#08306b';
      if (population > 100000000) return '#08519c';
      if (population > 50000000) return '#3182bd';
      if (population > 10000000) return '#6baed6';
      if (population > 1000000) return '#9ecae1';
      return '#c6dbef';
    };

    // Create population map
    const popMap = {};
    data.forEach(item => {
      popMap[item.countryCode] = item;
    });

    // Apply population styling to boundary layer
    boundaryLayer.eachLayer(layer => {
      const feature = layer.feature;
      if (!feature || !feature.properties) return;

      const iso3 = feature.properties.iso_a3 || feature.properties.iso3 || feature.properties.ISO;
      const popData = popMap[iso3];

      if (popData) {
        layer.setStyle({
          fillColor: getColor(popData.population),
          fillOpacity: getOpacity(popData.population),
          weight: 1,
          color: '#333'
        });

        // Create popup with population info
        const popup = L.popup().setContent(`
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 10px 0;">${popData.country}</h4>
            <div style="display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-users" style="font-size: 24px; color: #3182bd;"></i>
              <div>
                <strong>${popData.population.toLocaleString()}</strong>
                <div style="font-size: 12px; color: #666;">Population (${popData.year})</div>
              </div>
            </div>
          </div>
        `);

        layer.bindPopup(popup);
      } else {
        // No data available - make transparent
        layer.setStyle({
          fillOpacity: 0.05,
          weight: 1,
          color: '#999'
        });
      }
    });

    // Add legend
    PopulationLayer.addLegend(map);
  },

  /**
   * Add legend to map
   */
  addLegend: (map) => {
    // Remove existing legend
    if (window.populationLegend) {
      map.removeControl(window.populationLegend);
    }

    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'info legend population-legend');

      const grades = [0, 1000000, 10000000, 50000000, 100000000, 500000000];
      const labels = ['<strong>Population</strong>'];

      for (let i = 0; i < grades.length; i++) {
        const from = grades[i];
        const to = grades[i + 1];

        const color = from > 500000000 ? '#08306b' :
                     from > 100000000 ? '#08519c' :
                     from > 50000000 ? '#3182bd' :
                     from > 10000000 ? '#6baed6' :
                     from > 1000000 ? '#9ecae1' :
                     '#c6dbef';

        labels.push(
          `<i style="background:${color}"></i> ` +
          (from / 1000000).toFixed(0) + 'M' +
          (to ? '&ndash;' + (to / 1000000).toFixed(0) + 'M' : '+')
        );
      }

      div.innerHTML = labels.join('<br>');
      return div;
    };

    legend.addTo(map);
    window.populationLegend = legend;
  },

  /**
   * Cleanup function
   */
  cleanup: () => {
    // Remove legend
    if (window.populationLegend && window.MAP) {
      window.MAP.removeControl(window.populationLegend);
      window.populationLegend = null;
    }

    // Reset boundary styles if they exist
    if (window.boundaryLayer) {
      window.boundaryLayer.eachLayer(layer => {
        layer.setStyle({
          fillOpacity: 0.1,
          weight: 2,
          color: '#333'
        });
      });
    }
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PopulationLayer;
}
