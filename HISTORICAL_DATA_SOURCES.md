# Historical Data Sources for GlobStory

Comprehensive guide to integrating historical population, political, social, economic, and contextual data into GlobStory.

## 📊 Data Categories Overview

| Category | Data Types | Time Range | Best Sources |
|----------|-----------|------------|--------------|
| **Population** | Population counts, density, demographics | 1800-present | WorldPop, World Bank, Census |
| **Political** | Boundaries, conflicts, events | 1800-present | Thenmap, UCDP, ACLED |
| **Economic** | GDP, trade, income | 1800-present | World Bank, Gapminder |
| **Social** | Literacy, education, health | 1970-present | UNESCO, World Bank |
| **Cultural** | Heritage sites, monuments | Historic-present | UNESCO, Wikidata |
| **Climate** | Temperature, precipitation | 1874-present | NOAA, NASA |
| **Migration** | Flows, displacement | 1990-present | IOM, UN Migration |

---

## 🌍 1. POPULATION DATA

### A. WorldPop API (FREE)

**Coverage**: 2000-2020, 100m resolution
**Geographic**: Global (all countries)
**Format**: Raster data, API access
**Cost**: Free for non-commercial use

```javascript
// Example: Get population data for coordinates
const getPopulation = async (lat, lon, year) => {
  const response = await fetch(
    `https://www.worldpop.org/rest/data/pop/${lat}/${lon}/${year}`
  );
  return response.json();
};
```

**Use Cases for GlobStory**:
- Show population bubbles on map by city/region
- Display population change over time (2000-2020)
- Visualize population density with heat maps

**API Docs**: https://www.worldpop.org/sdi/introapi/

---

### B. World Bank Population API (FREE)

**Coverage**: 1960-present
**Geographic**: Country-level
**Format**: JSON, XML
**Cost**: Free, no API key required

```javascript
// Example: Get population for a country
const getCountryPopulation = async (countryCode, year) => {
  const response = await fetch(
    `https://api.worldbank.org/v2/country/${countryCode}/indicator/SP.POP.TOTL?date=${year}&format=json`
  );
  return response.json();
};

// Example: France population in 1990
// GET https://api.worldbank.org/v2/country/FRA/indicator/SP.POP.TOTL?date=1990&format=json
```

**Available Indicators**:
- `SP.POP.TOTL` - Total population
- `SP.POP.TOTL.FE.IN` - Female population
- `SP.POP.TOTL.MA.IN` - Male population
- `SP.URB.TOTL` - Urban population
- `SP.RUR.TOTL` - Rural population
- `SP.POP.DPND` - Age dependency ratio

**API Docs**: https://datahelpdesk.worldbank.org/knowledgebase/topics/125589

---

### C. Historical Population Estimates (Gapminder CSV)

**Coverage**: 1800-present
**Geographic**: Country-level
**Format**: CSV files (GitHub)
**Cost**: Free, CC-BY license

```javascript
// Population data back to 1800 from Gapminder
const historicalPopURL = 'https://raw.githubusercontent.com/open-numbers/ddf--gapminder--systema_globalis/master/ddf--datapoints--population_total--by--geo--time.csv';

const fetchHistoricalPop = async () => {
  const response = await fetch(historicalPopURL);
  const csv = await response.text();
  return parseCSV(csv); // Use Papa Parse or similar
};
```

**Source**: https://github.com/open-numbers/ddf--gapminder--systema_globalis

---

## 🗺️ 2. POLITICAL BOUNDARIES & CONFLICTS

### A. Thenmap API (FREE) ⭐ HIGHLY RECOMMENDED

**Coverage**: 1800-present (varies by region)
**Geographic**: World, US states, Nordic countries
**Format**: GeoJSON, SVG
**Cost**: Free, open source

```javascript
// Get world borders for a specific date
const getBorders = async (date) => {
  const response = await fetch(
    `https://thenmap.net/v2/world-2/${date}/data.geojson`
  );
  return response.json();
};

// Example: Get world map for WWI start
// GET https://thenmap.net/v2/world-2/1914-08-01/data.geojson

// Get US state borders over time
// GET https://thenmap.net/v2/us-states-1/1865-01-01/data.geojson
```

**Available Datasets**:
- `world-2` - World borders (1946-present)
- `world-1` - World borders (1800-1946) [in development]
- `us-states-1` - US states (1865-present)
- `se-municipalities` - Swedish municipalities (1974-present)
- `no-municipalities` - Norwegian municipalities (2006-present)

**Use Cases**:
- Show changing borders during WWI/WWII
- Display country formations/dissolutions (USSR, Yugoslavia)
- Visualize colonial empires over time

**API Docs**: https://thenmap.net/

---

### B. historical-basemaps (GitHub) (FREE)

**Coverage**: 1-2025 CE
**Geographic**: World countries and cultural regions
**Format**: GeoJSON
**Cost**: Free, open source

```javascript
// Static files hosted on GitHub
const getHistoricalMap = async (year) => {
  const baseURL = 'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/';

  // Choose appropriate file based on year
  let file;
  if (year < 1500) file = 'world_1_1500_AD.geojson';
  else if (year < 1900) file = 'world_1500_1900_AD.geojson';
  else file = 'world_1900_2025_AD.geojson';

  const response = await fetch(baseURL + file);
  return response.json();
};
```

**Available Files**:
- Countries (1-2025 CE)
- Cultural regions
- Colonial empires
- Ancient civilizations

**Source**: https://github.com/aourednik/historical-basemaps

---

### C. UCDP Conflict Data API (FREE) ⭐ ACADEMIC STANDARD

**Coverage**: 1989-present (some datasets back to 1946)
**Geographic**: Global, georeferenced
**Format**: JSON, CSV
**Cost**: Free for non-commercial use

```javascript
// Get conflict events by location and time
const getConflicts = async (lat, lon, startYear, endYear) => {
  const response = await fetch(
    `https://ucdpapi.pcr.uu.se/api/gedevents/23.1?lat=${lat}&lon=${lon}&start=${startYear}&end=${endYear}`
  );
  return response.json();
};

// Example: Get conflicts in Ukraine 2022
// GET https://ucdpapi.pcr.uu.se/api/gedevents/23.1?country=Ukraine&year=2022
```

**Available Data**:
- Conflict events (with deaths)
- Armed conflicts
- Non-state conflicts
- One-sided violence
- Peace agreements

**Use Cases for GlobStory**:
- Mark conflict zones on historical maps
- Show battle locations during wars
- Display death tolls by region
- Timeline of conflict escalation

**API Docs**: https://ucdp.uu.se/apidocs/

---

### D. ACLED Conflict Data API (FREE with registration)

**Coverage**: 1997-present (real-time updates)
**Geographic**: Global
**Format**: JSON, CSV
**Cost**: Free with registration

```javascript
// ACLED API requires authentication
const getACLED = async (country, year) => {
  const response = await fetch(
    `https://api.acleddata.com/acled/read?country=${country}&year=${year}&key=YOUR_API_KEY&email=your@email.com`
  );
  return response.json();
};
```

**Unique Features**:
- Real-time updates (weekly)
- Non-violent events (protests, riots)
- Government responses
- Troop movements

**Registration**: https://acleddata.com/register/

---

## 💰 3. ECONOMIC DATA

### A. World Bank Indicators API (FREE)

**Coverage**: 1960-present
**Geographic**: 260+ countries and regions
**Format**: JSON, XML
**Cost**: Free, no API key required

```javascript
// Get GDP data
const getGDP = async (countryCode, startYear, endYear) => {
  const response = await fetch(
    `https://api.worldbank.org/v2/country/${countryCode}/indicator/NY.GDP.MKTP.CD?date=${startYear}:${endYear}&format=json`
  );
  return response.json();
};

// Example: US GDP 1960-2020
// GET https://api.worldbank.org/v2/country/USA/indicator/NY.GDP.MKTP.CD?date=1960:2020&format=json
```

**Key Economic Indicators**:
- `NY.GDP.MKTP.CD` - GDP (current US$)
- `NY.GDP.PCAP.CD` - GDP per capita
- `NE.TRD.GNFS.ZS` - Trade (% of GDP)
- `FP.CPI.TOTL.ZG` - Inflation
- `SL.UEM.TOTL.ZS` - Unemployment
- `SI.POV.GINI` - GINI index (inequality)
- `NY.GNP.MKTP.CD` - GNI (Gross National Income)

**Use Cases**:
- Show economic prosperity over time (color-coded)
- Display wealth inequality trends
- Visualize trade routes and volumes
- Economic impacts of wars/conflicts

**Browse Indicators**: https://data.worldbank.org/indicator

---

### B. Gapminder Historical Economic Data (FREE)

**Coverage**: 1800-present
**Geographic**: Country-level
**Format**: CSV (GitHub)
**Cost**: Free, CC-BY license

```javascript
// GDP per capita back to 1800
const gdpHistoricalURL = 'https://raw.githubusercontent.com/open-numbers/ddf--gapminder--systema_globalis/master/ddf--datapoints--gdppercapita_us_inflation_adjusted--by--geo--time.csv';

const fetchHistoricalGDP = async () => {
  const response = await fetch(gdpHistoricalURL);
  return await response.text();
};
```

**Available Historical Data**:
- GDP per capita (1800-present)
- Income levels by percentile
- Life expectancy (1800-present)
- Child mortality
- Income inequality

**Source**: https://www.gapminder.org/data/

---

## 📚 4. SOCIAL & CULTURAL DATA

### A. UNESCO Education Statistics API (FREE)

**Coverage**: 1970-present
**Geographic**: 200+ countries
**Format**: SDMX (JSON)
**Cost**: Free with API key

```javascript
// UNESCO UIS API
const getEducationData = async (country, indicator) => {
  const response = await fetch(
    `https://api.uis.unesco.org/sdmx/data/UNESCO,EDU_NON_FINANCE,1.0/${indicator}.${country}?format=json`,
    {
      headers: {
        'API-Key': 'YOUR_API_KEY'
      }
    }
  );
  return response.json();
};
```

**Key Indicators**:
- Adult literacy rate
- School enrollment (primary, secondary, tertiary)
- Out-of-school children
- Student-teacher ratios
- Education expenditure

**API Key**: https://apiportal.uis.unesco.org/

---

### B. UNESCO World Heritage Sites API (FREE)

**Coverage**: 1978-present (all listed sites)
**Geographic**: Global
**Format**: JSON, GeoJSON
**Cost**: Free, open access

```javascript
// Unofficial but functional API
const getHeritageSites = async () => {
  const response = await fetch(
    'http://whc.unesco.org/en/list/georss/'
  );
  return response.text(); // Returns GeoRSS XML
};

// Alternative: Community API
const getHeritageAPI = async () => {
  const response = await fetch(
    'https://unesco-api.netlify.app/.netlify/functions/api/sites'
  );
  return response.json();
};
```

**Use Cases**:
- Mark cultural heritage sites on historical maps
- Show when sites were built/designated
- Display sites destroyed in conflicts
- Cultural significance overlays

**GitHub API**: https://github.com/eprendergast/unesco-api

---

### C. World Health Data (WHO/World Bank) (FREE)

**Coverage**: 1960-present
**Format**: JSON
**Cost**: Free

```javascript
// Life expectancy
const getLifeExpectancy = async (country, year) => {
  const response = await fetch(
    `https://api.worldbank.org/v2/country/${country}/indicator/SP.DYN.LE00.IN?date=${year}&format=json`
  );
  return response.json();
};
```

**Key Health Indicators**:
- `SP.DYN.LE00.IN` - Life expectancy at birth
- `SH.DYN.MORT` - Mortality rate (under-5)
- `SH.STA.MMRT` - Maternal mortality
- `SH.IMM.IDPT` - Immunization rates
- `SH.XPD.CHEX.GD.ZS` - Health expenditure

---

## 🌡️ 5. CLIMATE & ENVIRONMENTAL DATA

### A. NOAA Climate Data API (FREE)

**Coverage**: 1763-present (varies by station)
**Geographic**: Global weather stations
**Format**: JSON
**Cost**: Free with token

```javascript
// NOAA CDO (Climate Data Online) API
const getClimateData = async (location, startDate, endDate) => {
  const response = await fetch(
    `https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&locationid=${location}&startdate=${startDate}&enddate=${endDate}`,
    {
      headers: {
        'token': 'YOUR_TOKEN'
      }
    }
  );
  return response.json();
};

// Example: Temperature in Paris 1900
// GET https://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&locationid=CITY:FR000004&startdate=1900-01-01&enddate=1900-12-31
```

**Available Data**:
- Temperature (daily, monthly)
- Precipitation
- Snow depth
- Wind speed

**Token Request**: https://www.ncdc.noaa.gov/cdo-web/token

---

### B. Open-Meteo Historical Weather API (FREE)

**Coverage**: 1940-present
**Geographic**: Any coordinates globally
**Format**: JSON
**Cost**: Free, no API key required

```javascript
// Simple historical weather API
const getHistoricalWeather = async (lat, lon, startDate, endDate) => {
  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum`
  );
  return response.json();
};

// Example: Berlin weather in 1945
// GET https://archive-api.open-meteo.com/v1/archive?latitude=52.52&longitude=13.41&start_date=1945-01-01&end_date=1945-12-31&daily=temperature_2m_max
```

**Use Cases**:
- Show weather during historical battles
- Climate conditions during famines
- Temperature trends over decades

**API Docs**: https://open-meteo.com/en/docs/historical-weather-api

---

## 👥 6. MIGRATION & DISPLACEMENT

### A. Global Migration Data Portal API (FREE with key)

**Coverage**: 1990-present
**Geographic**: Global
**Format**: JSON
**Cost**: Free with API key

```javascript
// Migration data API
const getMigrationData = async (countryCode, year) => {
  const response = await fetch(
    `https://api.migrationdataportal.org/v1/data?indicator=intl_mig_stock&country=${countryCode}&year=${year}`,
    {
      headers: {
        'X-API-Key': 'YOUR_API_KEY'
      }
    }
  );
  return response.json();
};
```

**Available Indicators**:
- International migrant stock
- Refugee populations
- Internal displacement
- Remittance flows
- Migration routes

**API Docs**: https://www.migrationdataportal.org/handbooks/global-migration-data-portal-api-documentation

---

### B. UNHCR Refugee Data API (FREE)

**Coverage**: 1951-present
**Geographic**: Global
**Format**: JSON, CSV
**Cost**: Free

```javascript
// UNHCR Population Statistics API
const getRefugeeData = async (year, country) => {
  const response = await fetch(
    `https://api.unhcr.org/population/v1/population/?year=${year}&country=${country}`
  );
  return response.json();
};
```

**Use Cases**:
- Show refugee flows during conflicts
- Display displaced populations
- Migration routes and destinations
- Historical asylum trends

**API Portal**: https://data.unhcr.org/

---

## 🔗 7. INTEGRATION ARCHITECTURE

### Data Layer Structure

```javascript
// js/data-layers.js
class DataLayerManager {
  constructor(map, timeslider) {
    this.map = map;
    this.timeslider = timeslider;
    this.layers = new Map();
    this.cache = new Map();
  }

  // Register a data layer
  registerLayer(id, config) {
    this.layers.set(id, {
      id,
      name: config.name,
      source: config.source,
      fetchData: config.fetchData,
      render: config.render,
      enabled: config.enabled || false,
      cache: config.cache || true
    });
  }

  // Enable a layer
  async enableLayer(id) {
    const layer = this.layers.get(id);
    if (!layer) return;

    layer.enabled = true;
    await this.updateLayer(id);
  }

  // Update layer based on current map state
  async updateLayer(id) {
    const layer = this.layers.get(id);
    if (!layer || !layer.enabled) return;

    const currentYear = this.timeslider.getCurrentYear();
    const bounds = this.map.getBounds();

    // Check cache
    const cacheKey = `${id}_${currentYear}`;
    if (layer.cache && this.cache.has(cacheKey)) {
      layer.render(this.cache.get(cacheKey));
      return;
    }

    // Fetch new data
    const data = await layer.fetchData(currentYear, bounds);

    // Cache it
    if (layer.cache) {
      this.cache.set(cacheKey, data);
    }

    // Render on map
    layer.render(data);
  }

  // Hook into time slider changes
  onTimeChange() {
    for (const [id, layer] of this.layers) {
      if (layer.enabled) {
        this.updateLayer(id);
      }
    }
  }
}
```

---

## 📌 8. EXAMPLE IMPLEMENTATIONS

### Example 1: Population Density Heat Map

```javascript
// Register population layer
dataLayers.registerLayer('population', {
  name: 'Population Density',
  source: 'WorldPop',

  fetchData: async (year, bounds) => {
    // Fetch population data for visible area
    const response = await fetch(
      `https://api.worldpop.org/v1/density?year=${year}&bounds=${bounds.toString()}`
    );
    return response.json();
  },

  render: (data) => {
    // Create heat map layer
    const heatLayer = L.heatLayer(data.points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.0: 'blue',
        0.5: 'lime',
        1.0: 'red'
      }
    });

    heatLayer.addTo(MAP);
  },

  enabled: false,
  cache: true
});
```

---

### Example 2: Conflict Events Markers

```javascript
// Register conflict layer
dataLayers.registerLayer('conflicts', {
  name: 'Conflict Events',
  source: 'UCDP',

  fetchData: async (year, bounds) => {
    const response = await fetch(
      `https://ucdpapi.pcr.uu.se/api/gedevents/23.1?year=${year}`
    );
    const data = await response.json();

    // Filter to visible bounds
    return data.result.filter(event =>
      bounds.contains([event.latitude, event.longitude])
    );
  },

  render: (conflicts) => {
    const conflictLayer = L.layerGroup();

    conflicts.forEach(conflict => {
      const marker = L.circleMarker(
        [conflict.latitude, conflict.longitude],
        {
          radius: Math.min(conflict.deaths_a / 10, 20),
          fillColor: '#ff0000',
          color: '#000',
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.4
        }
      );

      marker.bindPopup(`
        <strong>${conflict.dyad_name}</strong><br>
        Date: ${conflict.date_start}<br>
        Deaths: ${conflict.deaths_a || 'Unknown'}<br>
        Type: ${conflict.type_of_violence}
      `);

      marker.addTo(conflictLayer);
    });

    conflictLayer.addTo(MAP);
  }
});
```

---

### Example 3: Historical Boundaries Overlay

```javascript
// Register boundaries layer
dataLayers.registerLayer('boundaries', {
  name: 'Historical Borders',
  source: 'Thenmap',

  fetchData: async (year) => {
    const date = `${year}-01-01`;
    const response = await fetch(
      `https://thenmap.net/v2/world-2/${date}/data.geojson`
    );
    return response.json();
  },

  render: (geojson) => {
    // Clear existing boundary layer
    if (window.boundaryLayer) {
      MAP.removeLayer(window.boundaryLayer);
    }

    // Add new boundaries
    window.boundaryLayer = L.geoJSON(geojson, {
      style: {
        color: '#333',
        weight: 2,
        fillOpacity: 0.1
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`
          <strong>${feature.properties.name}</strong><br>
          ${feature.properties.status || ''}
        `);
      }
    });

    window.boundaryLayer.addTo(MAP);
  }
});
```

---

### Example 4: GDP Choropleth Map

```javascript
// Register economic layer
dataLayers.registerLayer('gdp', {
  name: 'GDP per Capita',
  source: 'World Bank',

  fetchData: async (year) => {
    // Fetch GDP data for all countries
    const response = await fetch(
      `https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?date=${year}&format=json&per_page=300`
    );
    const [metadata, data] = await response.json();
    return data;
  },

  render: (gdpData) => {
    // Create GDP map object
    const gdpMap = {};
    gdpData.forEach(item => {
      if (item.value) {
        gdpMap[item.countryiso3code] = item.value;
      }
    });

    // Color countries by GDP
    const getColor = (gdp) => {
      return gdp > 50000 ? '#006d2c' :
             gdp > 20000 ? '#31a354' :
             gdp > 10000 ? '#74c476' :
             gdp > 5000  ? '#bae4b3' :
                           '#edf8e9';
    };

    // Apply to country polygons
    if (window.boundaryLayer) {
      window.boundaryLayer.eachLayer(layer => {
        const iso = layer.feature.properties.iso3;
        const gdp = gdpMap[iso];

        if (gdp) {
          layer.setStyle({
            fillColor: getColor(gdp),
            fillOpacity: 0.7
          });

          layer.bindPopup(`
            <strong>${layer.feature.properties.name}</strong><br>
            GDP per capita: $${gdp.toLocaleString()}
          `);
        }
      });
    }
  }
});
```

---

## 🎨 9. UI CONTROLS

### Data Layer Toggle Panel

```html
<!-- Add to app.html -->
<div id="data-layers-panel" class="control-panel">
  <h3>Data Layers</h3>

  <div class="layer-toggle">
    <input type="checkbox" id="layer-population" onchange="toggleLayer('population')">
    <label for="layer-population">
      <i class="fas fa-users"></i> Population Density
    </label>
  </div>

  <div class="layer-toggle">
    <input type="checkbox" id="layer-conflicts" onchange="toggleLayer('conflicts')">
    <label for="layer-conflicts">
      <i class="fas fa-explosion"></i> Conflict Events
    </label>
  </div>

  <div class="layer-toggle">
    <input type="checkbox" id="layer-boundaries" onchange="toggleLayer('boundaries')">
    <label for="layer-boundaries">
      <i class="fas fa-map"></i> Historical Borders
    </label>
  </div>

  <div class="layer-toggle">
    <input type="checkbox" id="layer-gdp" onchange="toggleLayer('gdp')">
    <label for="layer-gdp">
      <i class="fas fa-dollar-sign"></i> GDP per Capita
    </label>
  </div>

  <div class="layer-toggle">
    <input type="checkbox" id="layer-climate" onchange="toggleLayer('climate')">
    <label for="layer-climate">
      <i class="fas fa-temperature-half"></i> Climate Data
    </label>
  </div>

  <div class="layer-toggle">
    <input type="checkbox" id="layer-heritage" onchange="toggleLayer('heritage')">
    <label for="layer-heritage">
      <i class="fas fa-landmark"></i> Heritage Sites
    </label>
  </div>
</div>
```

```css
/* css/data-layers.css */
.control-panel {
  position: absolute;
  top: 80px;
  right: 10px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  max-width: 250px;
  z-index: 1000;
}

.layer-toggle {
  display: flex;
  align-items: center;
  margin: 10px 0;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.layer-toggle:hover {
  background: #f0f0f0;
}

.layer-toggle input[type="checkbox"] {
  margin-right: 10px;
}

.layer-toggle label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.layer-toggle i {
  width: 20px;
  text-align: center;
}
```

```javascript
// Toggle layer function
function toggleLayer(layerId) {
  const checkbox = document.getElementById(`layer-${layerId}`);

  if (checkbox.checked) {
    dataLayers.enableLayer(layerId);
  } else {
    dataLayers.disableLayer(layerId);
  }
}
```

---

## 📊 10. RECOMMENDED PRIORITY

### Phase 1: Core Data (Week 1-2)
1. **Historical Boundaries** (Thenmap) - Most visual impact
2. **Population Data** (World Bank) - Easy integration
3. **Conflict Events** (UCDP) - High user interest

### Phase 2: Economic Context (Week 3-4)
4. **GDP/Economic** (World Bank) - Choropleth maps
5. **Trade Data** - Economic connections
6. **Inequality Data** - Social context

### Phase 3: Social Context (Week 5-6)
7. **UNESCO Heritage** - Cultural sites
8. **Education/Literacy** - Social development
9. **Health Data** - Life expectancy trends

### Phase 4: Environmental (Week 7-8)
10. **Climate Data** (NOAA) - Historical weather
11. **Disasters** - Natural events database
12. **Migration** (IOM) - Population movements

---

## 💡 11. USAGE SCENARIOS

### Scenario 1: World War II Deep Dive
**Active Layers**:
- Historical boundaries (1939-1945)
- Conflict events (battles, casualties)
- Population changes (pre/post war)
- Economic impact (GDP decline)
- Migration (displaced persons)

**User Experience**:
1. User searches "World War II" in Wikipedia
2. Timeline automatically sets to 1939
3. Map shows 1939 European borders
4. Conflict markers appear for major battles
5. Population heat map shows urban areas
6. GDP choropleth shows economic devastation
7. User slides timeline to see progression

---

### Scenario 2: Industrial Revolution
**Active Layers**:
- Historical boundaries (1800-1900)
- Population growth (urbanization)
- Economic growth (GDP per capita)
- UNESCO heritage (industrial sites)

**User Experience**:
1. Article about "Industrial Revolution"
2. Timeline set to 1800
3. Population bubbles show small cities
4. Slide forward to 1900
5. Watch cities explode in size
6. GDP colors shift from brown to green
7. Heritage markers show factories, mills

---

### Scenario 3: Refugee Crisis
**Active Layers**:
- Current boundaries
- Conflict zones (ACLED real-time)
- Refugee flows (UNHCR)
- Camps and settlements
- Origin countries highlighted

**User Experience**:
1. Search "Syrian Civil War"
2. Map centers on Syria
3. Conflict events show intensity
4. Migration arrows show refugee routes
5. Destination countries highlighted
6. Population statistics in tooltips

---

## 🚀 12. IMPLEMENTATION ROADMAP

### Week 1-2: Foundation
- [ ] Create `DataLayerManager` class
- [ ] Add data layers control panel UI
- [ ] Integrate Thenmap historical boundaries
- [ ] Add World Bank population API
- [ ] Basic caching system

### Week 3-4: Conflict & Economic Data
- [ ] UCDP conflict events integration
- [ ] World Bank economic indicators
- [ ] Choropleth rendering for GDP
- [ ] Conflict markers with death tolls
- [ ] Timeline synchronization

### Week 5-6: Social & Cultural
- [ ] UNESCO heritage sites
- [ ] UNESCO education statistics
- [ ] Health data (WHO/World Bank)
- [ ] Site markers with info popups
- [ ] Historical literacy visualizations

### Week 7-8: Advanced Features
- [ ] Climate data integration
- [ ] Migration flows visualization
- [ ] Multi-layer combinations
- [ ] Data export functionality
- [ ] Plugin API for custom data sources

### Week 9-10: Polish & Performance
- [ ] Optimize caching strategies
- [ ] Add loading indicators
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Documentation

---

## 📈 13. PERFORMANCE CONSIDERATIONS

### Caching Strategy
```javascript
class DataCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  // Store in IndexedDB for persistence
  async persist() {
    const db = await openDB('globstory-cache', 1, {
      upgrade(db) {
        db.createObjectStore('data');
      }
    });

    for (const [key, value] of this.cache) {
      await db.put('data', value, key);
    }
  }
}
```

### Progressive Loading
```javascript
// Load data in chunks as user zooms in
async function progressiveLoad(bounds, zoomLevel) {
  if (zoomLevel < 5) {
    // World view: load country-level data only
    return loadCountryData();
  } else if (zoomLevel < 8) {
    // Regional view: load regional data
    return loadRegionalData(bounds);
  } else {
    // City view: load detailed data
    return loadDetailedData(bounds);
  }
}
```

---

## 🎯 14. SUCCESS METRICS

Track these metrics to measure impact:

1. **User Engagement**:
   - Data layers enabled per session
   - Time spent exploring with layers active
   - Most popular data combinations

2. **Educational Impact**:
   - Correlation between data layers and article depth
   - User questions answered by visualizations
   - Learning outcomes surveys

3. **Technical Performance**:
   - API response times
   - Cache hit rates
   - Data loading errors
   - Mobile vs desktop usage

---

## 📝 15. LICENSING & ATTRIBUTION

All data sources require proper attribution:

```html
<!-- Add to footer -->
<div id="data-attributions">
  Data sources:
  <a href="https://www.worldbank.org">World Bank</a>,
  <a href="https://ucdp.uu.se">UCDP</a>,
  <a href="https://acleddata.com">ACLED</a>,
  <a href="https://thenmap.net">Thenmap</a>,
  <a href="https://www.gapminder.org">Gapminder</a>,
  <a href="https://uis.unesco.org">UNESCO</a>
</div>
```

---

## 🔑 KEY TAKEAWAYS

1. **Free & Open**: All recommended APIs are free for non-commercial use
2. **Historical Depth**: Coverage from 1800s to present for most indicators
3. **Global Coverage**: Worldwide data with country/regional granularity
4. **Real-time Updates**: Conflict and migration data updated regularly
5. **Easy Integration**: RESTful APIs with JSON responses
6. **No Backend Required**: All client-side integrations possible

This positions GlobStory as a comprehensive historical data visualization platform! 🗺️📊
