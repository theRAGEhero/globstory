# Quick Integration Guide - Historical Boundaries + Auto Conflict Data

This guide shows how to add the **2 highest-impact features** to GlobStory in under 1 hour.

## 🎯 What You're Adding

1. **Historical Boundaries** - Map borders change as you move the time slider (1946-present)
2. **Auto Conflict Data** - Automatically loads conflict events for your starting location

**Total Implementation Time**: 30-45 minutes
**Visual Impact**: 🚀🚀🚀🚀🚀

---

## 📦 Step 1: Include New Scripts (2 minutes)

Add these script tags to `app.html` **before the closing `</body>` tag**:

```html
<!-- Historical Boundaries -->
<script src="js/historical-boundaries.js"></script>

<!-- Auto Conflict Loader -->
<script src="js/auto-conflict-loader.js"></script>
```

**Location**: Right after your existing script tags, around line 450-460 in `app.html`

---

## 🔧 Step 2: Initialize Historical Boundaries (5 minutes)

Add this code to `js/main.js` **after the time slider is initialized** (around line 90):

```javascript
// Add this AFTER line 90 where TIMESLIDER is created

// Initialize Historical Boundaries
let HISTORICAL_BOUNDARIES;

// Wait for map and timeslider to be ready
setTimeout(() => {
  console.log('[GlobStory] Initializing historical boundaries...');

  HISTORICAL_BOUNDARIES = new HistoricalBoundaries(MAP, TIMESLIDER);

  // Auto-enable boundaries
  HISTORICAL_BOUNDARIES.enable();

  // Make globally accessible
  window.HISTORICAL_BOUNDARIES = HISTORICAL_BOUNDARIES;

  console.log('[GlobStory] Historical boundaries initialized');
}, 1500);
```

**That's it!** Historical boundaries now work automatically with your time slider.

---

## 💥 Step 3: Initialize Auto Conflict Data (5 minutes)

Add this code to `js/main.js` **after the marker is added** (around line 62):

```javascript
// Add this AFTER line 62 where the marker is added

// Initialize Auto Conflict Loader
let AUTO_CONFLICT_LOADER;

setTimeout(() => {
  console.log(`[GlobStory] Loading conflict data for ${selectedZone.name}...`);

  AUTO_CONFLICT_LOADER = new AutoConflictLoader(MAP, selectedZone);

  // Load conflicts for current year
  const currentYear = new Date().getFullYear();
  AUTO_CONFLICT_LOADER.loadConflictData({
    year: currentYear,
    radiusKm: 500,  // 500km radius around starting point
    maxEvents: 100   // Show max 100 events
  });

  // Make globally accessible
  window.AUTO_CONFLICT_LOADER = AUTO_CONFLICT_LOADER;

}, 2000);
```

**That's it!** Conflict data now loads automatically when the page loads.

---

## ✅ Step 4: Test It (5 minutes)

1. **Open GlobStory** in your browser
2. **Wait 2-3 seconds** for data to load
3. **You should see**:
   - Country borders appear on the map
   - Red conflict markers (if any recent conflicts in that zone)
   - Notification: "Loaded X conflict events for [Zone Name]"

4. **Test the time slider**:
   - Move it to 1960 → Borders change
   - Move it to 1990 → USSR appears
   - Move it to 1992 → USSR dissolves into separate countries
   - Move it to 2014 → See current borders

5. **Click on countries** → Popup shows country name and year

6. **Click on red markers** → Popup shows conflict details

---

## 🎨 Optional: Add UI Controls (10 minutes)

Want users to be able to toggle these features? Add this HTML to `app.html`:

### Add to Top Menu Bar

Find the `<div id="top-menu-bar">` section and add:

```html
<!-- Add this after the language selector -->
<button id="toggle-boundaries-btn"
        onclick="toggleHistoricalBoundaries()"
        title="Toggle Historical Boundaries"
        style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 0 5px;">
  <i class="fas fa-map"></i> Boundaries
</button>

<button id="toggle-conflicts-btn"
        onclick="toggleConflictData()"
        title="Toggle Conflict Data"
        style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 0 5px;">
  <i class="fas fa-burst"></i> Conflicts
</button>
```

### Add Toggle Functions to main.js

```javascript
/**
 * Toggle historical boundaries on/off
 */
function toggleHistoricalBoundaries() {
  if (!HISTORICAL_BOUNDARIES) {
    console.error('Historical boundaries not initialized');
    return;
  }

  const btn = document.getElementById('toggle-boundaries-btn');

  if (HISTORICAL_BOUNDARIES.isEnabled()) {
    HISTORICAL_BOUNDARIES.disable();
    btn.style.opacity = '0.5';
    btn.innerHTML = '<i class="fas fa-map"></i> Boundaries (Off)';
  } else {
    HISTORICAL_BOUNDARIES.enable();
    btn.style.opacity = '1';
    btn.innerHTML = '<i class="fas fa-map"></i> Boundaries (On)';
  }
}

/**
 * Toggle conflict data on/off
 */
function toggleConflictData() {
  if (!AUTO_CONFLICT_LOADER) {
    console.error('Auto conflict loader not initialized');
    return;
  }

  const btn = document.getElementById('toggle-conflicts-btn');

  if (AUTO_CONFLICT_LOADER.conflictLayerGroup) {
    AUTO_CONFLICT_LOADER.clearMarkers();
    btn.style.opacity = '0.5';
    btn.innerHTML = '<i class="fas fa-burst"></i> Conflicts (Off)';
  } else {
    const currentYear = new Date().getFullYear();
    AUTO_CONFLICT_LOADER.loadConflictData({ year: currentYear });
    btn.style.opacity = '1';
    btn.innerHTML = '<i class="fas fa-burst"></i> Conflicts (On)';
  }
}
```

---

## 🎯 Advanced: Load Conflicts for Specific Years

Want conflicts to update with the time slider? Add this:

```javascript
// In main.js, modify the time slider onDateChange callback

// Find the existing onDateChange function (around line 72)
onDateChange: function (date) {
  console.debug(['timeslider.js onDateChange', date, this]);

  // Update year indicator
  const year = new Date(date).getFullYear();
  document.getElementById('year-indicator').textContent = year;

  // *** ADD THIS: Update conflict data for the new year ***
  if (AUTO_CONFLICT_LOADER && year >= 1989) {
    AUTO_CONFLICT_LOADER.clearMarkers();
    AUTO_CONFLICT_LOADER.loadConflictData({ year: year });
  }
},
```

Now when users move the time slider, conflict data updates to show events from that year!

---

## 🐛 Troubleshooting

### Boundaries Not Showing

**Problem**: Map looks the same, no borders appear

**Solutions**:
1. Check browser console for errors:
   ```javascript
   // Open browser DevTools (F12)
   // Look for errors mentioning "HistoricalBoundaries"
   ```

2. Verify Thenmap API is accessible:
   ```javascript
   fetch('https://thenmap.net/v2/world-2/2020-01-01/data.geojson')
     .then(r => r.json())
     .then(d => console.log('Thenmap works:', d))
     .catch(e => console.error('Thenmap error:', e));
   ```

3. Check if initialized:
   ```javascript
   console.log('Boundaries:', window.HISTORICAL_BOUNDARIES);
   console.log('Enabled:', window.HISTORICAL_BOUNDARIES?.isEnabled());
   ```

### Conflicts Not Showing

**Problem**: No red markers appear

**Solutions**:
1. Check if conflict zone has recent data:
   ```javascript
   // Some zones may not have conflicts in UCDP database
   // Try a different starting year:
   AUTO_CONFLICT_LOADER.loadConflictData({ year: 2023 });
   ```

2. Verify UCDP API is accessible:
   ```javascript
   fetch('https://ucdpapi.pcr.uu.se/api/gedevents/23.1?year=2023&pagesize=10')
     .then(r => r.json())
     .then(d => console.log('UCDP works:', d))
     .catch(e => console.error('UCDP error:', e));
   ```

3. Check if there are nearby events:
   ```javascript
   console.log('Conflict loader:', window.AUTO_CONFLICT_LOADER);
   console.log('Markers:', window.AUTO_CONFLICT_LOADER?.conflictMarkers);
   ```

### Time Slider Not Updating Boundaries

**Problem**: Moving time slider doesn't change borders

**Solutions**:
1. The `onDateChange` hook may not be working. Try this alternative:
   ```javascript
   // Add event listener directly
   MAP.on('timechange', function(e) {
     const year = new Date(e.date).getFullYear();
     HISTORICAL_BOUNDARIES.loadBoundaries(year);
   });
   ```

2. Manually trigger boundary update:
   ```javascript
   // In browser console:
   HISTORICAL_BOUNDARIES.loadBoundaries(1960);
   ```

### CORS Errors

**Problem**: `Access-Control-Allow-Origin` errors in console

**Solutions**:
1. Both Thenmap and UCDP support CORS, but if you're testing locally, use a local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Then open http://localhost:8000/app.html
   ```

2. Or use VS Code Live Server extension

---

## 📱 Mobile Considerations

Both features work on mobile! The code automatically:
- Scales markers appropriately
- Makes popups touch-friendly
- Handles slower connections (caching)

---

## 🎨 Customization

### Change Boundary Colors

Edit `js/historical-boundaries.js`:

```javascript
this.defaultStyle = {
  color: '#ff6b6b',        // Border color
  weight: 3,               // Border thickness
  fillOpacity: 0.1,        // Fill transparency
  fillColor: '#4ecdc4'     // Fill color
};
```

### Change Conflict Marker Colors

Edit `js/auto-conflict-loader.js`:

```javascript
const marker = L.circleMarker([cluster.lat, cluster.lon], {
  radius: radius,
  fillColor: '#ff6b6b',    // Change from red to your color
  color: '#c0392b',        // Border color
  weight: 2,
  opacity: 0.9,
  fillOpacity: 0.6
});
```

### Adjust Conflict Search Radius

```javascript
AUTO_CONFLICT_LOADER.loadConflictData({
  year: currentYear,
  radiusKm: 1000,  // Change from 500 to 1000km
  maxEvents: 200   // Show more events
});
```

---

## 📊 What's Next?

After these work, consider adding:

1. **Smart Layer Auto-Loading** - Automatically enable layers based on Wikipedia article
2. **Wikidata Integration** - Show population, GDP, etc. for clicked countries
3. **Historical Photos** - Add geotagged photos from Wikimedia Commons
4. **Timeline Visualization** - Show all dates from article on a timeline

See `RECOMMENDED_INTEGRATIONS.md` for details on these.

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] Historical boundaries appear on map
- [ ] Boundaries change when moving time slider
- [ ] Countries show popup on click
- [ ] Conflict markers appear (if data available)
- [ ] Conflict markers show details on click
- [ ] Legends appear for both features
- [ ] No console errors
- [ ] Works on mobile
- [ ] Page load time is acceptable (<5 seconds)

---

## 🎉 You're Done!

Your GlobStory now has:
- ✅ Dynamic historical borders that change with time
- ✅ Auto-loaded conflict data for starting zones
- ✅ Interactive popups with detailed information
- ✅ Beautiful legends
- ✅ Smooth animations

**Total time**: 30-45 minutes
**Visual impact**: Massive! 🚀

Users will be amazed when they see borders changing through history and current conflict zones highlighted automatically.

Enjoy your enhanced GlobStory! 🗺️✨
