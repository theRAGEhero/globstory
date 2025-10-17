// Global Variables
const START_ZOOM = 7.0;

// List of current conflict zones for random selection
const CONFLICT_ZONES = [
    { name: "Ukraine-Russia", coords: [49.0275, 31.4828], zoom: 6.0 },  // Ukraine
    { name: "Gaza-Israel", coords: [31.7683, 35.2137], zoom: 7.0 },      // Palestine/Israel
    { name: "Sudan", coords: [15.5007, 32.5599], zoom: 6.5 },           // Khartoum, Sudan
    { name: "Myanmar", coords: [21.9162, 95.9560], zoom: 6.0 },         // Myanmar
    { name: "Syria", coords: [34.8021, 38.9968], zoom: 6.5 }            // Syria
];

// Randomly select a conflict zone
const randomIndex = Math.floor(Math.random() * CONFLICT_ZONES.length);
const selectedZone = CONFLICT_ZONES[randomIndex];
const START_CENTER = selectedZone.coords;
// Override zoom if specified in the selected zone
const START_ZOOM_OVERRIDE = selectedZone.zoom || START_ZOOM;

let MAP, TIMESLIDER, OHMLAYER;
let isMobile = window.innerWidth < 768;
let CURRENT_MARKER = null;
let SHOW_MARKER = true; // Default marker setting is ON
let MINIMAP = null;
let SHOW_MINIMAP = true; // Default minimap setting is ON
let SHOW_UNDERLINES = false; // Default underline setting is OFF
let HOVER_DELAY = 1000; // Default hover delay in milliseconds (1 second)

function escapeHTML(text) {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text ?? '';
    return tempDiv.innerHTML;
}

if (typeof window !== 'undefined' && window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Initialize map and everything else
document.addEventListener('DOMContentLoaded', function () {
    // Initialize map
    MAP = L.map('map', {
        zoomSnap: 0.1,
        tap: true // Enable tap for mobile
    }).setView(START_CENTER, START_ZOOM_OVERRIDE);
    
    // Log which conflict zone was selected (for debugging)
    console.log(`Showing conflict zone: ${selectedZone.name}`);

    L.control.scale().addTo(MAP);

    OHMLAYER = new L.maplibreGL({
        attribution: "<a href='https://www.openhistoricalmap.org/'>OHM</a>",
        style: OHM_MAP_STYLE,
    });
    OHMLAYER.addTo(MAP);

    // Initialize minimap if enabled
    if (SHOW_MINIMAP) {
        initializeMiniMap();
    }

    // Add a default marker at the center position showing the conflict zone name
    if (SHOW_MARKER) {
        addMarkerToMap(START_CENTER[0], START_CENTER[1], selectedZone.name);
    }

    const tsoptions = {
        vectorLayer: OHMLAYER,
        vectorSourceName: 'osm',
        range: ['1850-01-01', '2025-12-31'],
        date: '2025-01-01',
        stepInterval: 1,
        stepAmount: '10year',
        collapsed: true,
        onDateChange: function (date) {
            console.debug(['timeslider.js onDateChange', date, this]);
            // Update year indicator
            const year = new Date(date).getFullYear();
            document.getElementById('year-indicator').textContent = year;
        },
        onRangeChange: function (range) {
            console.debug(['timeslider.js onRangeChange', range, this]);
        },
        onReady: function () {
            console.debug(['timeslider.js onReady', this]);
        },
    };

    const selectedlanguage = (new URLSearchParams(document.location.search)).get('lang');
    if (selectedlanguage) {
        tsoptions.language = selectedlanguage;
    }
    TIMESLIDER = new L.Control.OHMTimeSlider(tsoptions).addTo(MAP);

    // Setup info panel differently based on desktop/mobile
    setupInfoPanel();

    // Article navigation setup
    const articleNavBar = document.getElementById('article-nav-bar');
    const backButton = document.getElementById('back-button');
    const nextButton = document.getElementById('next-button');
    const articleNavTitle = document.getElementById('article-nav-title');
    const searchBox = document.getElementById('search-box');
    const searchResults = document.getElementById('search-results');
    const searchLanguageIndicator = document.getElementById('search-language-indicator');
    const pdfUploadButton = document.getElementById('pdf-upload-button');
    const pdfFileInput = document.getElementById('pdf-file-input');
    const pdfViewerContainer = document.getElementById('pdf-viewer-container');
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfCloseButton = document.getElementById('pdf-close-button');
    const pdfFileNameElement = document.getElementById('pdf-file-name');
    const wikiSection = document.getElementById('wiki-section');
    const articleContent = document.getElementById('article-content');
    
    // Function to add a marker to the map
    function addMarkerToMap(lat, lng, title) {
        // Remove existing marker if one exists
        if (CURRENT_MARKER) {
            MAP.removeLayer(CURRENT_MARKER);
        }
        
        // Create a custom icon for the marker
        const customIcon = L.divIcon({
            className: 'custom-marker-icon',
            html: '<i class="fas fa-map-marker-alt" style="color: white; font-size: 16px;"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
        
        // Create the marker with popup
        CURRENT_MARKER = L.marker([lat, lng], {icon: customIcon})
            .addTo(MAP)
            .bindPopup('<div class="marker-popup"><strong>' + title + '</strong><br>Lat: ' + lat.toFixed(5) + '<br>Lng: ' + lng.toFixed(5) + '</div>');
        
        // Open the popup by default
        CURRENT_MARKER.openPopup();
    }
    
    // Function to initialize the minimap
    function initializeMiniMap() {
        // Remove existing minimap if one exists
        if (MINIMAP) {
            MINIMAP.remove();
        }
        
        // Create a new tile layer for the minimap
        const osmUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
        const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        const minimapTiles = new L.TileLayer(osmUrl, { 
            minZoom: 0, 
            maxZoom: 13, 
            attribution: attribution 
        });
        
        // Create and add the minimap
        MINIMAP = new L.Control.MiniMap(minimapTiles, { 
            toggleDisplay: true,
            collapsedWidth: 24,
            collapsedHeight: 24,
            zoomLevelOffset: -6
        }).addTo(MAP);
    }
    
    // History state for navigation
    let articleHistory = [];
    let currentArticleIndex = -1;
    let pdfActive = false;
    
    // Function to update navigation button states
    function updateNavigationButtons() {
        backButton.disabled = currentArticleIndex <= 0;
        nextButton.disabled = currentArticleIndex >= articleHistory.length - 1;
        
        if (articleHistory.length > 0 && currentArticleIndex >= 0) {
            const currentArticle = articleHistory[currentArticleIndex];
            articleNavTitle.textContent = currentArticle.title;
            articleNavBar.style.display = 'flex';
        } else {
            articleNavBar.style.display = 'none';
        }
    }
    
    // Function to reset article history
    function resetArticleHistory() {
        articleHistory = [];
        currentArticleIndex = -1;
        updateNavigationButtons();
    }

    function showPdfUI() {
        pdfActive = true;
        if (wikiSection) {
            wikiSection.classList.add('pdf-mode');
        }
        if (pdfViewerContainer) {
            pdfViewerContainer.classList.remove('hidden');
        }
        if (searchLanguageIndicator) {
            searchLanguageIndicator.classList.add('hidden');
        }
        if (searchBox) {
            searchBox.classList.add('hidden');
        }
        if (searchResults) {
            searchResults.classList.add('hidden');
        }
        articleNavBar.style.display = 'none';
    }

    function showWikipediaUI() {
        pdfActive = false;
        if (wikiSection) {
            wikiSection.classList.remove('pdf-mode');
        }
        if (pdfViewerContainer) {
            pdfViewerContainer.classList.add('hidden');
        }
        if (pdfViewer) {
            pdfViewer.innerHTML = '';
        }
        if (pdfFileNameElement) {
            pdfFileNameElement.textContent = '';
        }
        if (searchLanguageIndicator) {
            searchLanguageIndicator.classList.remove('hidden');
        }
        if (searchBox) {
            searchBox.classList.remove('hidden');
        }
        if (searchResults) {
            searchResults.classList.remove('hidden');
        }
        updateNavigationButtons();
    }
    
    // Back button click handler
    backButton.addEventListener('click', function() {
        if (currentArticleIndex > 0) {
            currentArticleIndex--;
            const previousArticle = articleHistory[currentArticleIndex];
            getWikipediaArticle(previousArticle.title, false);
            updateNavigationButtons();
        }
    });
    
    // Next button click handler
    nextButton.addEventListener('click', function() {
        if (currentArticleIndex < articleHistory.length - 1) {
            currentArticleIndex++;
            const nextArticle = articleHistory[currentArticleIndex];
            getWikipediaArticle(nextArticle.title, false);
            updateNavigationButtons();
        }
    });

    if (pdfUploadButton && pdfFileInput) {
        pdfUploadButton.addEventListener('click', function() {
            pdfFileInput.click();
        });

        pdfFileInput.addEventListener('change', function(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) {
                return;
            }

            if (!window.pdfjsLib) {
                articleContent.innerHTML = '<p class="loading-text">PDF functionality is unavailable. Please try again later.</p>';
                return;
            }

            handlePdfUpload(file);
            pdfFileInput.value = '';
        });
    }

    if (pdfCloseButton) {
        pdfCloseButton.addEventListener('click', function() {
            showWikipediaUI();
            articleContent.innerHTML = '<p class="loading-text">Select or search for an article to begin exploring.</p>';
            const historicalInfoContent = document.getElementById('historical-info-content');
            if (historicalInfoContent) {
                historicalInfoContent.innerHTML = '<p>Choose a Wikipedia article or upload a PDF to see contextual information here.</p>';
            }
        });
    }

    // Language selector functionality
    const languageButton = document.getElementById('language-button');
    const languageDropdown = document.getElementById('language-dropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    let currentLanguage = 'en';

    languageButton.addEventListener('click', function() {
        languageDropdown.classList.toggle('show');
    });

    // Close the dropdown when clicking outside of it
    window.addEventListener('click', function(event) {
        if (!event.target.matches('#language-button') && 
            !event.target.matches('.fa-globe')) {
            if (languageDropdown.classList.contains('show')) {
                languageDropdown.classList.remove('show');
            }
        }
    });

    // Handle language selection
    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            const selectedLang = this.getAttribute('data-lang');
            currentLanguage = selectedLang;
            
            // Update active state
            languageOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            // Update button text - different for mobile/desktop
            const languageName = this.textContent.trim();
            if (isMobile) {
                languageButton.innerHTML = `<i class="fas fa-globe"></i>`;
            } else {
                languageButton.innerHTML = `<i class="fas fa-globe"></i> <span>${languageName}</span>`;
            }
            
            // Close dropdown
            languageDropdown.classList.remove('show');
            
            // Update language indicator
            document.getElementById('search-language-indicator').innerHTML = 
                `Searching in: <strong>${languageName}</strong> Wikipedia`;
            
            // Clear current search results and article content
            searchResults.innerHTML = '';
            articleContent.innerHTML = '';
            
            // Reset article history when changing language
            resetArticleHistory();
        });
    });

    // Settings button functionality
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsButton = document.getElementById('save-settings');
    const resetSettingsButton = document.getElementById('reset-settings');
    const cancelSettingsButton = document.getElementById('cancel-settings');
    const resetTutorialButton = document.getElementById('reset-tutorial');
    const showMarkerToggle = document.getElementById('show-marker');
    const showMinimapToggle = document.getElementById('show-minimap');
    const showUnderlinesToggle = document.getElementById('show-underlines');
    
    // Initialize marker toggle checkbox with saved setting (or default to ON)
    showMarkerToggle.checked = localStorage.getItem('showMarker') === 'false' ? false : true;
    SHOW_MARKER = showMarkerToggle.checked;
    
    // Initialize minimap toggle checkbox with saved setting (or default to ON)
    showMinimapToggle.checked = localStorage.getItem('showMinimap') === 'false' ? false : true;
    SHOW_MINIMAP = showMinimapToggle.checked;
    
    // Initialize underline toggle checkbox with saved setting (or default to OFF)
    showUnderlinesToggle.checked = localStorage.getItem('showUnderlines') === 'true' ? true : false;
    SHOW_UNDERLINES = showUnderlinesToggle.checked;
    
    // Initialize hover delay with saved setting (or default to 1 second)
    const hoverDelaySelect = document.getElementById('hover-delay');
    const savedHoverDelay = localStorage.getItem('hoverDelay');
    if (savedHoverDelay) {
        hoverDelaySelect.value = savedHoverDelay;
        HOVER_DELAY = parseFloat(savedHoverDelay) * 1000; // Convert to milliseconds
    } else {
        hoverDelaySelect.value = '1'; // Default to 1 second
        HOVER_DELAY = 1000;
    }
    
    // Apply the underline setting to the container
    const mainContainer = document.getElementById('main-container');
    if (SHOW_UNDERLINES) {
        mainContainer.classList.add('show-underlines');
    } else {
        mainContainer.classList.remove('show-underlines');
    }
    
    // If marker should be hidden initially, remove it
    if (!SHOW_MARKER && CURRENT_MARKER) {
        MAP.removeLayer(CURRENT_MARKER);
        CURRENT_MARKER = null;
    }
    
    // If minimap should be shown initially, initialize it
    if (SHOW_MINIMAP && !MINIMAP) {
        initializeMiniMap();
    } else if (!SHOW_MINIMAP && MINIMAP) {
        MINIMAP.remove();
        MINIMAP = null;
    }
    
    settingsButton.addEventListener('click', function() {
        settingsModal.style.display = 'flex';
    });
    
    // Save settings button handler with improved mobile support
    saveSettingsButton.addEventListener('click', function(event) {
        // Prevent default to ensure it doesn't submit a form or get blocked
        event.preventDefault();
        event.stopPropagation();

        // Save the settings to localStorage
        const settings = {
            defaultZoom: document.getElementById('default-zoom').value,
            mapStyle: document.getElementById('map-style').value,
            defaultYear: document.getElementById('default-year').value,
            showMarker: document.getElementById('show-marker').checked,
            showMinimap: document.getElementById('show-minimap').checked,
            showUnderlines: document.getElementById('show-underlines').checked,
            hoverDelay: document.getElementById('hover-delay').value
        };

        try {
            // Save to localStorage
            Object.keys(settings).forEach(key => {
                localStorage.setItem(key, settings[key]);
            });
            
            console.log('Settings saved:', settings);
            
            // Apply some settings immediately
            if (settings.defaultYear) {
                const year = parseInt(settings.defaultYear);
                if (!isNaN(year) && TIMESLIDER) {
                    TIMESLIDER.setDate(`${year}-01-01`);
                }
            }
            
            if (settings.defaultZoom) {
                const zoom = parseFloat(settings.defaultZoom);
                if (!isNaN(zoom)) {
                    MAP.setZoom(zoom);
                }
            }
            
            // Apply marker settings
            SHOW_MARKER = settings.showMarker;
            
            // If marker should be hidden, remove it
            if (!SHOW_MARKER && CURRENT_MARKER) {
                MAP.removeLayer(CURRENT_MARKER);
                CURRENT_MARKER = null;
            }
            // If marker should be shown and doesn't exist, add it at map center
            else if (SHOW_MARKER && !CURRENT_MARKER) {
                const center = MAP.getCenter();
                addMarkerToMap(center.lat, center.lng, "Current Location");
            }
            
            // Apply minimap settings
            SHOW_MINIMAP = settings.showMinimap;
            
            // If minimap should be hidden, remove it
            if (!SHOW_MINIMAP && MINIMAP) {
                MINIMAP.remove();
                MINIMAP = null;
            }
            // If minimap should be shown and doesn't exist, initialize it
            else if (SHOW_MINIMAP && !MINIMAP) {
                initializeMiniMap();
            }
            
            // Apply underline settings
            SHOW_UNDERLINES = settings.showUnderlines;
            
            // Update the container class based on the setting
            if (SHOW_UNDERLINES) {
                mainContainer.classList.add('show-underlines');
            } else {
                mainContainer.classList.remove('show-underlines');
            }
            
            // Apply hover delay setting
            HOVER_DELAY = parseFloat(settings.hoverDelay) * 1000; // Convert to milliseconds

            // Force close modal on both desktop and mobile
            settingsModal.style.display = 'none';
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    });
    
    resetSettingsButton.addEventListener('click', function(event) {
        // Prevent default to ensure it doesn't get blocked
        event.preventDefault();
        event.stopPropagation();
        
        document.getElementById('default-zoom').value = 13;
        document.getElementById('map-style').value = 'standard';
        document.getElementById('default-year').value = 2025;
        document.getElementById('show-marker').checked = true;
        document.getElementById('show-minimap').checked = true;
        document.getElementById('show-underlines').checked = false;
        document.getElementById('hover-delay').value = '1';
    });
    
    cancelSettingsButton.addEventListener('click', function(event) {
        // Prevent default to ensure it doesn't get blocked
        event.preventDefault();
        event.stopPropagation();
        
        settingsModal.style.display = 'none';
    });
    
    // Reset onboarding tutorial button
    resetTutorialButton.addEventListener('click', function() {
        if (window.resetOnboarding && typeof window.resetOnboarding === 'function') {
            window.resetOnboarding();
        } else {
            console.error('Reset onboarding function not found');
        }
    });
    
    // Close settings modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // User button functionality
    const userButton = document.getElementById('user-button');
    const userDropdown = document.getElementById('user-dropdown');
    const loginOption = document.getElementById('login-option');
    const registerOption = document.getElementById('register-option');
    const web3Option = document.getElementById('web3-option');
    
    // Modal elements
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const web3Modal = document.getElementById('web3-modal');
    const closeLoginModal = document.getElementById('close-login-modal');
    const closeRegisterModal = document.getElementById('close-register-modal');
    const closeWeb3Modal = document.getElementById('close-web3-modal');
    
    // Show/hide user dropdown
    userButton.addEventListener('click', function() {
        userDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    window.addEventListener('click', function(event) {
        if (!event.target.matches('#user-button') && 
            !event.target.matches('.fa-user')) {
            if (userDropdown.classList.contains('show')) {
                userDropdown.classList.remove('show');
            }
        }
    });
    
    // Login option click
    loginOption.addEventListener('click', function() {
        loginModal.style.display = 'flex';
        userDropdown.classList.remove('show');
    });
    
    // Register option click
    registerOption.addEventListener('click', function() {
        registerModal.style.display = 'flex';
        userDropdown.classList.remove('show');
    });
    
    // Web3 option click
    web3Option.addEventListener('click', function() {
        web3Modal.style.display = 'flex';
        userDropdown.classList.remove('show');
    });
    
    // Close modal buttons
    closeLoginModal.addEventListener('click', function() {
        loginModal.style.display = 'none';
    });
    
    closeRegisterModal.addEventListener('click', function() {
        registerModal.style.display = 'none';
    });
    
    closeWeb3Modal.addEventListener('click', function() {
        web3Modal.style.display = 'none';
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (event.target === registerModal) {
            registerModal.style.display = 'none';
        }
        if (event.target === web3Modal) {
            web3Modal.style.display = 'none';
        }
    });
    
    // Form submission placeholders (for demo purposes)
    document.getElementById('login-submit').addEventListener('click', function() {
        loginModal.style.display = 'none';
    });
    
    document.getElementById('register-submit').addEventListener('click', function() {
        registerModal.style.display = 'none';
    });
    
    document.getElementById('metamask-connect').addEventListener('click', function() {
        web3Modal.style.display = 'none';
    });
    
    document.getElementById('walletconnect').addEventListener('click', function() {
        web3Modal.style.display = 'none';
    });
    
    document.getElementById('coinbase-wallet').addEventListener('click', function() {
        web3Modal.style.display = 'none';
    });

    // Wikipedia search functionality
    let searchTimeout;

    searchBox.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = searchBox.value.trim();
            if (searchTerm.length > 0) {
                searchWikipedia(searchTerm);
            } else {
                searchResults.innerHTML = '';
            }
        }, 300);
    });

    function searchWikipedia(searchTerm) {
        searchResults.innerHTML = '<p class="loading-text">Searching...</p>';
        // Use the currently selected language for the Wikipedia API
        const url = `https://${currentLanguage}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&origin=*&utf8=1&srlimit=5`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (!data.query || !data.query.search) {
                    throw new Error('No results found');
                }
                searchResults.innerHTML = '';
                data.query.search.forEach(result => {
                    const div = document.createElement('div');
                    div.className = 'search-result';
                    const snippet = result.snippet.replace(/(<([^>]+)>)/gi, ""); // Remove HTML tags
                    // Truncate the snippet to 100 characters
                    const truncatedSnippet = snippet.length > 100 ? snippet.substring(0, 100) + '...' : snippet;
                    div.innerHTML = `
                        <h3>${result.title}</h3>
                        <p>${truncatedSnippet}</p>
                    `;
                    div.addEventListener('click', () => {
                        getWikipediaArticle(result.title, true);
                        searchResults.innerHTML = ''; // Clear search results
                        searchBox.value = ''; // Clear search box
                    });
                    searchResults.appendChild(div);
                });
            })
            .catch(error => {
                console.error('Error searching Wikipedia:', error);
                searchResults.innerHTML = `<p>Error searching Wikipedia: ${error.message}</p>`;
            });
    }

    function getWikipediaArticle(title, addToHistory = true) {
        if (pdfActive) {
            showWikipediaUI();
        }
        articleContent.innerHTML = '<p class="loading-text">Loading article...</p>';
        
        // Use the currently selected language for the Wikipedia API
        // Add mobileformat for mobile
        let apiUrl = `https://${currentLanguage}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&format=json&origin=*&prop=text|images|categories&formatversion=2&redirects=1&disableeditsection=true`;
        
        if (isMobile) {
            apiUrl += '&mobileformat=true';  
        }
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (!data.parse || !data.parse.text) {
                    throw new Error('Article not found');
                }
                
                // Add to history if this is a new article request (not navigation)
                if (addToHistory) {
                    // If we're in the middle of the history and navigating forward,
                    // remove all future items
                    if (currentArticleIndex >= 0 && currentArticleIndex < articleHistory.length - 1) {
                        articleHistory = articleHistory.slice(0, currentArticleIndex + 1);
                    }
                    
                    // Add the new article to history
                    articleHistory.push({ 
                        title: title,
                        language: currentLanguage
                    });
                    
                    // Update current index to point to the newly added article
                    currentArticleIndex = articleHistory.length - 1;
                }
                
                // Update navigation buttons state
                updateNavigationButtons();
                
                // Create a temporary container for the content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data.parse.text;

                // Remove unwanted elements
                ['mw-editsection', 'reference', 'reflist', 'mw-references-wrap'].forEach(className => {
                    const elements = tempDiv.getElementsByClassName(className);
                    while (elements.length > 0) {
                        elements[0].parentNode.removeChild(elements[0]);
                    }
                });

                // Fix image URLs in the temporary container
                const tempImages = tempDiv.getElementsByTagName('img');
                Array.from(tempImages).forEach(img => {
                    const srcset = img.getAttribute('srcset');
                    if (srcset) {
                        // Remove srcset to force using src attribute
                        img.removeAttribute('srcset');
                    }
                    
                    const src = img.getAttribute('src');
                    if (src) {
                        const languageDomain = `${currentLanguage}.wikipedia.org`;
                        if (src.startsWith('//')) {
                            img.src = 'https:' + src;
                        } else if (src.startsWith('/')) {
                            img.src = 'https://' + languageDomain + src;
                        } else if (!src.startsWith('http')) {
                            img.src = 'https://' + languageDomain + '/wiki/' + src;
                        }
                    }
                });

                // Process text nodes to add hover detection for words and years
                processTextNodes(tempDiv);

                // Update the article content
                articleContent.innerHTML = tempDiv.innerHTML;

                // Also update the historical info content with some basic data
                const historicalInfoContent = document.getElementById('historical-info-content');
                historicalInfoContent.innerHTML = `
                    <h3>${title}</h3>
                    <p>This panel can show related historical context for "${title}" as you explore the map.</p>
                `;

                // Setup hover and click events for words and years
                setupInteractions();

                // Fix Wikipedia links to use our navigation system
                const links = articleContent.getElementsByTagName('a');
                Array.from(links).forEach(link => {
                    if (link.href.includes('/wiki/')) {
                        const title = decodeURIComponent(link.href.split('/wiki/')[1]);
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            getWikipediaArticle(title, true);
                        });
                    } else if (link.href.includes('.wikipedia.org')) {
                        // For cross-language Wikipedia links, extract the title and load in current language
                        const matches = link.href.match(/\.wikipedia\.org\/wiki\/(.+)$/);
                        if (matches && matches[1]) {
                            const title = decodeURIComponent(matches[1]);
                            link.addEventListener('click', (e) => {
                                e.preventDefault();
                                getWikipediaArticle(title, true);
                            });
                        } else {
                            link.target = '_blank';
                        }
                    } else {
                        link.target = '_blank'; // Open external links in new tab
                    }
                });

                // Scroll to top of article
                articleContent.scrollTop = 0;
            })
            .catch(error => {
                console.error('Error fetching Wikipedia article:', error);
                articleContent.innerHTML = `<p class="loading-text">Error loading article: ${error.message}</p>`;
            });
    }

    // Function to process all text nodes in the article container
    function processTextNodes(container) {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip script and style contents
                    if (node.parentNode.nodeName === 'SCRIPT' || 
                        node.parentNode.nodeName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        textNodes.forEach(processTextNode);
    }

    // Enhanced function to process a text node and detect years and multi-word place names
    function processTextNode(node) {
        const text = node.textContent;
        
        // Improved place name detection to handle multi-word place names
        // Match: 1. Single capitalized words with 3+ chars
        //        2. Multiple consecutive capitalized words (e.g., "New York", "San Francisco")
        //        3. Special cases with non-capitalized parts (e.g., "Los Angeles", "Frankfurt am Main")
        const placeNameRegex = /\b(([A-Z][a-z]{2,})(\s+([A-Z][a-z]+|de|del|di|da|von|van|am|auf|la|le|el|al|der|den|das|du|des|do|of|on|in|by|sur|sous|aux)){0,3})\b/g;
        const placeNames = [];
        let placeMatch;
        
        // Find all potential place names
        while ((placeMatch = placeNameRegex.exec(text)) !== null) {
            placeNames.push({
                text: placeMatch[0],
                index: placeMatch.index,
                type: 'place'
            });
        }
        
        // Start with a simpler regex for decades
        const decadeRegex = /\b([0-9]{2,4})s\b/g;
        const standardYearRegex = /\b(-?[0-9]{1,5})\b/g;
        const bcRegex = /\b([0-9]{1,5})\s*(BC|BCE|a\.C\.|AEC)\b/gi;
        
        // Collect all matches
        const yearMatches = [];
        
        // Process decade matches
        let match;
        while ((match = decadeRegex.exec(text)) !== null) {
            const yearValue = parseInt(match[1]);
            if (yearValue >= 0 && yearValue <= 2025) {
                yearMatches.push({
                    text: match[0],
                    index: match.index,
                    type: 'year',
                    year: yearValue,
                    isDecade: true,
                    isBCEra: false
                });
            }
        }
        
        // Process BC/BCE matches
        while ((match = bcRegex.exec(text)) !== null) {
            const yearValue = parseInt(match[1]);
            if (yearValue >= 0 && yearValue <= 10000) {
                yearMatches.push({
                    text: match[0],
                    index: match.index,
                    type: 'year',
                    year: -yearValue, // Make negative for BC years
                    isDecade: false,
                    isBCEra: true
                });
            }
        }
        
        // Process standard year matches
        while ((match = standardYearRegex.exec(text)) !== null) {
            const yearValue = parseInt(match[1]);
            if (yearValue >= -10000 && yearValue <= 2025) {
                // Check if this match overlaps with any existing match
                const overlaps = yearMatches.some(existing => 
                    (match.index >= existing.index && match.index < existing.index + existing.text.length) ||
                    (existing.index >= match.index && existing.index < match.index + match[0].length)
                );
                
                if (!overlaps) {
                    yearMatches.push({
                        text: match[0],
                        index: match.index,
                        type: 'year',
                        year: yearValue,
                        isDecade: false,
                        isBCEra: false
                    });
                }
            }
        }
        
        // Combine place names and year matches
        const allMatches = [...placeNames, ...yearMatches];
        
        // Sort matches by index
        allMatches.sort((a, b) => a.index - b.index);
        
        if (allMatches.length === 0) return;
        
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        
        allMatches.forEach(match => {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }
            
            const span = document.createElement('span');
            
            if (match.type === 'place') {
                span.className = 'hoverable';
                span.dataset.place = match.text;
            } else { // 'year'
                span.className = 'year-hoverable';
                span.dataset.year = match.year; // The computed year value (for the map)
                span.dataset.yearText = match.text; // The original text
                span.dataset.isDecade = match.isDecade;
                span.dataset.isBCEra = match.isBCEra;
            }
            
            span.textContent = match.text;
            fragment.appendChild(span);
            lastIndex = match.index + match.text.length;
        });
        
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        
        node.parentNode.replaceChild(fragment, node);
    }

    // Function to search location using Nominatim
    const searchLocation = (placeName) => {
        try {
            // Show loading state
            const hoverElements = document.querySelectorAll(`[data-place="${placeName}"]`);
            hoverElements.forEach(el => el.classList.add('searching'));
            
            fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(placeName)}&` +
                `format=json&limit=1&addressdetails=1`
            )
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (data && data.length > 0) {
                    const location = data[0];
                    MAP.setView([location.lat, location.lon], 8);
                    
                    // Add a marker at the location if markers are enabled
                    if (SHOW_MARKER) {
                        addMarkerToMap(location.lat, location.lon, placeName);
                    }
                    
                    // Add success feedback
                    hoverElements.forEach(el => {
                        el.classList.remove('searching');
                        el.classList.add('found');
                        setTimeout(() => el.classList.remove('found'), 2000);
                    });
                } else {
                    // Add not-found feedback
                    hoverElements.forEach(el => {
                        el.classList.remove('searching');
                        el.classList.add('not-found');
                        setTimeout(() => el.classList.remove('not-found'), 2000);
                    });
                }
            })
            .catch(error => {
                console.error('Error searching location:', error);
                hoverElements.forEach(el => {
                    el.classList.remove('searching');
                    el.classList.add('error');
                    setTimeout(() => el.classList.remove('error'), 2000);
                });
            });
        } catch (error) {
            console.error('Error in searchLocation:', error);
        }
    };

    // Function to setup hover and click interactions for places and years
    function setupInteractions() {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        // Use the global HOVER_DELAY value for hover interaction
        
        // Setup place name interactions
        const hoverableWords = document.querySelectorAll('.hoverable');
        hoverableWords.forEach(element => {
            // Add hover functionality with delay
            let wordHoverTimer;
            element.addEventListener('mouseenter', () => {
                wordHoverTimer = setTimeout(() => {
                    searchLocation(element.dataset.place);
                }, HOVER_DELAY);
            });
            
            element.addEventListener('mouseleave', () => {
                clearTimeout(wordHoverTimer);
            });

            // Add click functionality for touch devices and for immediate action
            element.addEventListener('click', () => {
                searchLocation(element.dataset.place);
            });
        });

        // Setup year interactions with enhanced handling for various formats
        const hoverableYears = document.querySelectorAll('.year-hoverable');
        hoverableYears.forEach(element => {
            // Add hover functionality with delay
            let yearHoverTimer;
            element.addEventListener('mouseenter', () => {
                yearHoverTimer = setTimeout(() => {
                    const year = parseInt(element.dataset.year);
                    if (!isNaN(year)) {
                        // Add active class for visual feedback
                        element.classList.add('active');
                        
                        // Update the time slider
                        if (TIMESLIDER && TIMESLIDER.setDate) {
                            TIMESLIDER.setDate(`${year}-01-01`);
                        }
                        
                        // Update year indicator with the original format from the text
                        document.getElementById('year-indicator').textContent = element.dataset.yearText;
                    }
                }, HOVER_DELAY);
            });
            
            element.addEventListener('mouseleave', () => {
                clearTimeout(yearHoverTimer);
                element.classList.remove('active');
            });
            
            // Add click functionality
            element.addEventListener('click', () => {
                const year = parseInt(element.dataset.year);
                if (!isNaN(year)) {
                    // Add active class for visual feedback
                    hoverableYears.forEach(el => el.classList.remove('active'));
                    element.classList.add('active');
                    
                    // Update the time slider
                    if (TIMESLIDER && TIMESLIDER.setDate) {
                        TIMESLIDER.setDate(`${year}-01-01`);
                    }
                    
                    // Update year indicator with the original text format
                    document.getElementById('year-indicator').textContent = element.dataset.yearText;
                }
            });
        });
    }

    async function handlePdfUpload(file) {
        try {
            resetArticleHistory();
            showPdfUI();
            searchResults.innerHTML = '';
            if (pdfFileNameElement) {
                pdfFileNameElement.textContent = file.name;
            }
            articleContent.innerHTML = '<p class="loading-text">Preparing PDF viewer...</p>';

            const arrayBuffer = await file.arrayBuffer();
            const pdfDocument = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            if (pdfViewer) {
                pdfViewer.innerHTML = '';
            }

            const renderScale = isMobile ? 1.0 : 1.2;

            for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
                const page = await pdfDocument.getPage(pageNumber);
                const viewport = page.getViewport({ scale: renderScale });

                const pageContainer = document.createElement('div');
                pageContainer.className = 'pdf-page';
                pageContainer.dataset.pageLabel = `Page ${pageNumber}`;
                pageContainer.style.width = `${viewport.width}px`;
                pageContainer.style.height = `${viewport.height}px`;

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                canvas.className = 'pdf-canvas';
                pageContainer.appendChild(canvas);

                const textLayerDiv = document.createElement('div');
                textLayerDiv.className = 'pdf-text-layer textLayer';
                textLayerDiv.style.width = `${viewport.width}px`;
                textLayerDiv.style.height = `${viewport.height}px`;
                pageContainer.appendChild(textLayerDiv);

                if (pdfViewer) {
                    pdfViewer.appendChild(pageContainer);
                }

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                const textContent = await page.getTextContent();
                await window.pdfjsLib.renderTextLayer({
                    textContent,
                    container: textLayerDiv,
                    viewport,
                    textDivs: [],
                    enhanceTextSelection: true
                }).promise;

                processTextNodes(textLayerDiv);
            }

            setupInteractions();

            articleNavBar.style.display = 'none';
            const articleNavTitle = document.getElementById('article-nav-title');
            articleNavTitle.textContent = file.name.replace(/\.pdf$/i, '') || 'Uploaded PDF';

            articleContent.innerHTML = `
                <div class="pdf-summary">
                    <p><i class="fas fa-file-pdf"></i> The uploaded PDF is displayed above. Hover or tap recognised place names and years directly in the pages to explore the map.</p>
                </div>
            `;
            articleContent.scrollTop = 0;

            const historicalInfoContent = document.getElementById('historical-info-content');
            if (historicalInfoContent) {
                historicalInfoContent.innerHTML = `
                    <h3>${escapeHTML(file.name)}</h3>
                    <p>Interactive highlights come from the original PDF text so the map stays in sync with what you are reading.</p>
                `;
            }
        } catch (error) {
            console.error('Error processing PDF:', error);
            articleContent.innerHTML = `<p class="loading-text">Error processing PDF: ${escapeHTML(error.message)}</p>`;
            showWikipediaUI();
        }
    }

    // Initialize the import doc modal
    function setupGoogleDocImport() {
        const importDocBtn = document.getElementById('import-doc');
        const googleDocModal = document.getElementById('google-doc-modal');
        const closeGoogleDocModal = document.getElementById('close-google-doc-modal');
        const importDocButton = document.getElementById('import-doc-button');
        const importStatus = document.getElementById('import-status');
        
        // Show modal
        importDocBtn.addEventListener('click', function() {
            googleDocModal.style.display = 'flex';
            // Focus on the text area for immediate typing
            setTimeout(() => {
                const textArea = document.getElementById('manual-text-area');
                if (textArea) textArea.focus();
            }, 100);
        });
        
        // Close modal
        closeGoogleDocModal.addEventListener('click', function() {
            googleDocModal.style.display = 'none';
            importStatus.textContent = '';
            importStatus.className = 'import-status';
            document.getElementById('manual-text-area').value = '';
            document.getElementById('import-title').value = '';
        });
        
        // Close when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === googleDocModal) {
                googleDocModal.style.display = 'none';
                importStatus.textContent = '';
                importStatus.className = 'import-status';
                document.getElementById('manual-text-area').value = '';
                document.getElementById('import-title').value = '';
            }
        });
        
        // Import text button handler
        importDocButton.addEventListener('click', function() {
            const manualText = document.getElementById('manual-text-area').value.trim();
            const importTitle = document.getElementById('import-title').value.trim() || 'Imported Text';
            
            if (!manualText) {
                importStatus.textContent = 'Please enter some text to import';
                importStatus.className = 'import-status error';
                return;
            }
            
            try {
                // Process the text
                processManualText(manualText, importTitle);
                
                // Show success message
                importStatus.textContent = 'Text imported successfully!';
                importStatus.className = 'import-status success';
                
                // Close modal after a delay
                setTimeout(() => {
                    googleDocModal.style.display = 'none';
                    importStatus.textContent = '';
                    importStatus.className = 'import-status';
                    document.getElementById('manual-text-area').value = '';
                    document.getElementById('import-title').value = '';
                }, 1500);
                
            } catch (error) {
                console.error('Error processing text:', error);
                importStatus.textContent = 'Error processing text. Please try again.';
                importStatus.className = 'import-status error';
            }
        });
    }
    
    // Function to display Google Doc content in the wiki section
    function displayGoogleDocEmbed(docId, sourceUrl) {
        if (pdfActive) {
            showWikipediaUI();
        }
        const articleContent = document.getElementById('article-content');
        const searchResults = document.getElementById('search-results');
        const articleNavBar = document.getElementById('article-nav-bar');
        const articleNavTitle = document.getElementById('article-nav-title');
        
        // Clear search results
        searchResults.innerHTML = '';
        
        // Show loading state
        articleContent.innerHTML = '<p class="loading-text">Loading Google Doc content...</p>';
        
        // Fetch the Google Doc content using the export API directly (to avoid CORS issues)
        fetch(`https://docs.google.com/document/d/${docId}/export?format=txt`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch document. Make sure it\'s publicly accessible.');
                }
                return response.text();
            })
            .then(docText => {
                // Process the text to highlight countries and years
                const processedContent = processGoogleDocText(docText, sourceUrl);
                
                // Update article content
                articleContent.innerHTML = processedContent;
                
                // Update navigation bar
                articleNavTitle.textContent = 'Imported Google Doc';
                articleNavBar.style.display = 'flex';
                
                // Process the text for location and year detection
                processTextNodes(articleContent);
                setupInteractions();
                
                // Scroll to top of article
                articleContent.scrollTop = 0;
            })
            .catch(error => {
                console.error('Error fetching Google Doc:', error);
                
                // Show error message with alternative approach
                articleContent.innerHTML = `
                    <div class="google-doc-error">
                        <h3><i class="fas fa-exclamation-triangle"></i> Error Loading Document</h3>
                        <p class="error-message">${error.message}</p>
                        <div class="google-doc-extract">
                            <button id="extract-text-button" class="extract-button">
                                <i class="fas fa-magic"></i> Try Manual Import Instead
                            </button>
                            <p class="extract-tip">Click to manually paste document content</p>
                        </div>
                    </div>
                `;
                
                // Setup extract text button functionality for manual import
                const extractButton = document.getElementById('extract-text-button');
                if (extractButton) {
                    extractButton.addEventListener('click', function() {
                        showExtractModal(sourceUrl);
                    });
                }
            });
    }
    
    // Function to process manual text input
    function processManualText(text, title) {
        if (pdfActive) {
            showWikipediaUI();
        }
        const articleContent = document.getElementById('article-content');
        const searchResults = document.getElementById('search-results');
        const articleNavBar = document.getElementById('article-nav-bar');
        const articleNavTitle = document.getElementById('article-nav-title');
        
        // Clear search results
        searchResults.innerHTML = '';
        
        // Format the content for display with paragraphs
        const formattedContent = text.split('\n\n')
            .filter(paragraph => paragraph.trim() !== '') // Remove empty paragraphs
            .map(paragraph => {
                // Split paragraph into lines
                const lines = paragraph.split('\n').filter(line => line.trim() !== '');
                
                // Simple formatting for headings (lines that are all caps or end with colon might be headings)
                if (lines.length === 1 && (lines[0].trim().toUpperCase() === lines[0].trim() && lines[0].trim().length > 3)) {
                    return `<h2>${lines[0].trim()}</h2>`;
                } else if (lines.length === 1 && lines[0].trim().endsWith(':') && lines[0].trim().length < 50) {
                    return `<h3>${lines[0].trim()}</h3>`;
                } else {
                    // Join the lines back together with <br> tags
                    return `<p>${lines.join('<br>')}</p>`;
                }
            })
            .join('');
        
        // Create a wrapper with processed content
        const processedContent = `
            <div class="imported-content">
                <div class="imported-header">
                    <h2>${title}</h2>
                    <div class="processed-badge"><i class="fas fa-check-circle"></i> Map Interactions Enabled</div>
                </div>
                <div class="import-success">
                    <p><i class="fas fa-info-circle"></i> Text imported successfully! Hover over <span class="sample-highlight">place names</span> or <span class="sample-year">years</span> to interact with the map.</p>
                </div>
                <div class="imported-text">
                    ${formattedContent}
                </div>
            </div>
        `;
        
        // Update article content
        articleContent.innerHTML = processedContent;
        
        // Update navigation bar
        articleNavTitle.textContent = title;
        articleNavBar.style.display = 'flex';
        
        // Process the text for location and year detection
        processTextNodes(articleContent);
        setupInteractions();
        
        // Scroll to top of article
        articleContent.scrollTop = 0;
    }
    
    // Function to show extract modal for manual text import
    function showExtractModal(sourceUrl) {
        // Create a temporary textarea for the user to paste content
        const extractModal = document.createElement('div');
        extractModal.className = 'extract-modal';
        extractModal.innerHTML = `
            <div class="extract-modal-content">
                <h3><i class="fas fa-file-import"></i> Import Google Doc Content</h3>
                <p>Please follow these steps to import your document:</p>
                <ol>
                    <li>Open your <a href="${sourceUrl}" target="_blank">Google Doc</a> in a new tab</li>
                    <li>Select all text (Ctrl+A or Cmd+A)</li>
                    <li>Copy (Ctrl+C or Cmd+C)</li>
                    <li>Paste below (Ctrl+V or Cmd+V)</li>
                </ol>
                <div class="paste-container">
                    <textarea id="extracted-text" placeholder="Paste your document text here..."></textarea>
                </div>
                <div class="extract-info">
                    <p><i class="fas fa-info-circle"></i> After importing, place names and years will be automatically detected to enable map interactions.</p>
                </div>
                <div class="extract-buttons">
                    <button id="process-text-button"><i class="fas fa-check"></i> Import Text</button>
                    <button id="cancel-extract-button"><i class="fas fa-times"></i> Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(extractModal);
        
        // Auto-focus on the textarea for easy pasting
        setTimeout(() => {
            const textarea = document.getElementById('extracted-text');
            if (textarea) textarea.focus();
        }, 100);
        
        // Setup process and cancel buttons
        document.getElementById('process-text-button').addEventListener('click', function() {
            const text = document.getElementById('extracted-text').value;
            if (text.trim()) {
                processExtractedText(text, sourceUrl);
                extractModal.remove();
            } else {
                // Show error if textarea is empty
                const textarea = document.getElementById('extracted-text');
                textarea.classList.add('error');
                textarea.placeholder = 'Please paste your document text here before importing';
                
                // Remove error class after a few seconds
                setTimeout(() => {
                    textarea.classList.remove('error');
                    textarea.placeholder = 'Paste your document text here...';
                }, 3000);
            }
        });
        
        document.getElementById('cancel-extract-button').addEventListener('click', function() {
            extractModal.remove();
        });
        
        // Also close when clicking outside the modal content
        extractModal.addEventListener('click', function(e) {
            if (e.target === extractModal) {
                extractModal.remove();
            }
        });
    }
    
    // Function to process extracted text for map interactions
    function processExtractedText(text, sourceUrl) {
        const articleContent = document.getElementById('article-content');
        
        // Use the same processing function as for direct imports
        const processedContent = processGoogleDocText(text, sourceUrl);
        
        // Update article content
        articleContent.innerHTML = processedContent;
        
        // Process the text for location and year detection
        processTextNodes(articleContent);
        setupInteractions();
    }
    
    // Setup the info panel according to device type
    function setupInfoPanel() {
        const toggleInfoBtn = document.getElementById('toggle-info');
        const mapElement = document.getElementById('map');
        const infoContainer = document.getElementById('info-container');
        const closeInfoBtn = document.getElementById('close-info');
        
        if (!isMobile) {
            // Desktop behavior - slides up from bottom
            infoContainer.classList.add('desktop-panel');
            
            toggleInfoBtn.addEventListener('click', function() {
                infoContainer.classList.toggle('visible');
                mapElement.classList.toggle('desktop-panel-visible');
                
                // Invalidate map size after toggle
                setTimeout(() => {
                    MAP.invalidateSize();
                }, 300);
            });
            
            closeInfoBtn.addEventListener('click', function() {
                infoContainer.classList.remove('visible');
                mapElement.classList.remove('desktop-panel-visible');
                
                // Invalidate map size after toggle
                setTimeout(() => {
                    MAP.invalidateSize();
                }, 300);
            });
        } else {
            // Mobile behavior - fullscreen overlay
            toggleInfoBtn.addEventListener('click', function() {
                infoContainer.style.display = 'block';
            });
            
            closeInfoBtn.addEventListener('click', function() {
                infoContainer.style.display = 'none';
            });
        }
    }

    // For orientation changes & window resizing
    function handleResize() {
        const wasInMobileMode = isMobile;
        isMobile = window.innerWidth < 768;
        
        // Update UI if switching between mobile/desktop modes
        if (isMobile !== wasInMobileMode) {
            // Adjust language button
            const languageName = document.querySelector('.language-option.active').textContent.trim();
            
            if (isMobile) {
                document.getElementById('language-button').innerHTML = `<i class="fas fa-globe"></i>`;
            } else {
                document.getElementById('language-button').innerHTML = `<i class="fas fa-globe"></i> <span>${languageName}</span>`;
            }
            
            // Reset any mobile/desktop specific classes and styles
            const infoContainer = document.getElementById('info-container');
            const mapElement = document.getElementById('map');
            
            infoContainer.className = '';
            infoContainer.style.display = 'none';
            infoContainer.classList.remove('desktop-panel', 'visible');
            mapElement.classList.remove('desktop-panel-visible');
            
            // Setup the info panel again
            setupInfoPanel();
        }
        
        // Always adjust the map
        setTimeout(() => {
            MAP.invalidateSize();
        }, 200);
    }
    
    // Handle window resize and orientation changes
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Initialize with navigation hidden
    articleNavBar.style.display = 'none';
    
    // Load saved settings on startup
    function loadSavedSettings() {
        // Default settings
        const defaultSettings = {
            defaultZoom: 13,
            mapStyle: 'standard',
            defaultYear: 2025,
            showMarker: true,
            showMinimap: true,
            showUnderlines: false,
            hoverDelay: '1'
        };
        
        // Try to load settings from localStorage
        try {
            // Update UI with saved settings
            document.getElementById('default-zoom').value = 
                localStorage.getItem('defaultZoom') || defaultSettings.defaultZoom;
            document.getElementById('map-style').value = 
                localStorage.getItem('mapStyle') || defaultSettings.mapStyle;
            document.getElementById('default-year').value = 
                localStorage.getItem('defaultYear') || defaultSettings.defaultYear;
            document.getElementById('show-marker').checked = 
                (localStorage.getItem('showMarker') === 'false') ? false : defaultSettings.showMarker;
            document.getElementById('show-minimap').checked = 
                (localStorage.getItem('showMinimap') === 'false') ? false : defaultSettings.showMinimap;
            document.getElementById('show-underlines').checked = 
                (localStorage.getItem('showUnderlines') === 'true') ? true : defaultSettings.showUnderlines;
            document.getElementById('hover-delay').value = 
                localStorage.getItem('hoverDelay') || defaultSettings.hoverDelay;
            
            // Apply settings
            SHOW_MARKER = document.getElementById('show-marker').checked;
            SHOW_MINIMAP = document.getElementById('show-minimap').checked;
            SHOW_UNDERLINES = document.getElementById('show-underlines').checked;
            
            // Apply hover delay setting
            const hoverDelayValue = document.getElementById('hover-delay').value;
            HOVER_DELAY = parseFloat(hoverDelayValue) * 1000; // Convert to milliseconds
            
            // Apply underline setting to container
            const mainContainer = document.getElementById('main-container');
            if (SHOW_UNDERLINES) {
                mainContainer.classList.add('show-underlines');
            } else {
                mainContainer.classList.remove('show-underlines');
            }
            
            // Apply year setting
            const year = parseInt(document.getElementById('default-year').value);
            if (!isNaN(year) && TIMESLIDER) {
                TIMESLIDER.setDate(`${year}-01-01`);
                document.getElementById('year-indicator').textContent = year;
            }
            
            // Apply zoom setting
            const zoom = parseFloat(document.getElementById('default-zoom').value);
            if (!isNaN(zoom)) {
                MAP.setZoom(zoom);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    // Call to load settings
    loadSavedSettings();
    
    // Initialize Google Doc import functionality
    setupGoogleDocImport();
});
