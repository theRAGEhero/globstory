# GlobStory  -  Interactive Historical Map and Wikipedia Explorer

GlobStory is an interactive web application that combines historical maps with Wikipedia content, allowing users to explore historical information in a geographical context. The application enables users to visualize historical events, places, and timelines on a map while accessing relevant Wikipedia articles.

## Features

- Interactive historical map with time slider control
- Wikipedia article integration with smart word and year detection
- Multi-language support for various Wikipedia editions
- Automatic location detection and highlighting for place names in articles
- Year detection and time navigation from article content
- Responsive design for desktop and mobile devices
- User settings with persistent storage
- Dark/light theme options
- Customizable interface elements

## Directory Structure

```
globstory/
├── css/
│   ├── styles.css                  # Main stylesheet
│   └── leaflet-ohm-timeslider.css  # TimeSlider control styles
├── images/
│   └── GlobStory_logo150x150.png   # Application logo
├── js/
│   ├── main.js                     # Main application JavaScript
│   ├── mapstyle.js                 # Map styling definition
│   ├── decimaldate.js              # Date conversion utilities
│   └── leaflet-ohm-timeslider.js   # TimeSlider control
└── index.html                      # Main HTML file
```

## Setup

1. Download or clone the repository
2. Host the files on a web server or open index.html directly in a browser
3. No server-side components are required - the application runs entirely in the browser

## Dependencies

- [Leaflet](https://leafletjs.com/) - For interactive maps
- [MapLibre GL JS](https://maplibre.org/projects/maplibre-gl-js/) - For vector tile rendering
- [Leaflet-MiniMap](https://github.com/Norkart/Leaflet-MiniMap) - For the overview map
- [Font Awesome](https://fontawesome.com/) - For icons

## Usage

- Search for Wikipedia articles using the search box
- Click on place names in articles to locate them on the map
- Click on years to navigate the historical timeline
- Use the language selector to change the Wikipedia language
- Customize the application behavior using the settings panel

## Testing

The project does not yet ship with an automated test suite. When updating the
front-end, smoke-test the experience by opening `app.html` in a browser and
confirming that map interactions respond to highlighted places and years.

## License

This project is open source and available under the MIT License.

## Placeholder Files

Note: The GlobStory_logo150x150.png file is a placeholder and should be
replaced with an actual logo before deployment.
