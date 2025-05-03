// Onboarding Popup System for GlobStory
// This script creates a series of guided popups for first-time users

// Track current step
let currentOnboardingStep = 0;

// Check if this is the first visit
function isFirstVisit() {
  return localStorage.getItem('globstoryOnboardingCompleted') !== 'true';
}

// Define the onboarding steps
const onboardingSteps = [
  {
    title: "Welcome to GlobStory",
    content: "GlobStory is an interactive historical map that connects Wikipedia content with geographical locations and timelines. Let's explore its key features together!",
    position: "center",
    highlightElement: null
  },
  {
    title: "Interactive Map",
    content: "This interactive map shows historical locations. You can zoom, pan, and explore different geographical areas throughout history.",
    position: "left",
    highlightElement: "#map"
  },
  {
    title: "Time Navigation",
    content: "The year indicator shows the current historical period. As you explore content, you can travel through time by clicking on years mentioned in articles.",
    position: "right-top",
    highlightElement: "#year-indicator"
  },
  {
    title: "Wikipedia Integration",
    content: "Search and explore Wikipedia articles directly within GlobStory. The content is connected to the map and timeline for interactive learning.",
    position: "right",
    highlightElement: "#search-box"
  },
  {
    title: "Interactive Content",
    content: "Place names in articles can be clicked to locate them on the map. Years can be clicked to navigate the timeline. Hovering over these items will preview their effects.",
    position: "right",
    highlightElement: "#wiki-section"
  },
  {
    title: "Language Options",
    content: "Change the Wikipedia language to explore content from different cultural perspectives.",
    position: "top-right",
    highlightElement: "#language-button"
  },
  {
    title: "Settings & Customization",
    content: "Customize the application with your preferred settings, including map style, default year, and interface options.",
    position: "top-right",
    highlightElement: "#settings-button"
  },
  {
    title: "Ready to Explore!",
    content: "You're all set to begin your journey through history with GlobStory. Start by searching for a historical topic, place, or period that interests you!",
    position: "center",
    highlightElement: null
  }
];

// Create and show the onboarding popup
function createOnboardingPopup(step) {
  try {
    // Remove any existing onboarding elements
    const existingOverlay = document.querySelector('.onboarding-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    removeHighlight();
    
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'onboarding-popup';
    
    // Store step data for reference
    popup.dataset.step = step;
    
    // Delay to allow for DOM setup before positioning
    setTimeout(() => {
      try {
        positionPopup(popup, onboardingSteps[step]);
        popup.classList.add('visible');
      } catch (e) {
        console.error('Error in popup positioning:', e);
      }
    }, 100);
  
  const title = document.createElement('h2');
  title.textContent = onboardingSteps[step].title;
  
  const content = document.createElement('p');
  content.textContent = onboardingSteps[step].content;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'onboarding-buttons';
  
  // Skip button only on first step
  if (step === 0) {
    const skipButton = document.createElement('button');
    skipButton.className = 'onboarding-button onboarding-skip';
    skipButton.textContent = 'Skip Tour';
    skipButton.addEventListener('click', () => {
      completeOnboarding();
      overlay.remove();
    });
    buttonContainer.appendChild(skipButton);
  } else {
    const backButton = document.createElement('button');
    backButton.className = 'onboarding-button onboarding-skip';
    backButton.textContent = 'Back';
    backButton.addEventListener('click', () => {
      overlay.remove();
      removeHighlight();
      showOnboardingStep(step - 1);
    });
    buttonContainer.appendChild(backButton);
  }
  
  // Next or Finish button
  const isLastStep = step === onboardingSteps.length - 1;
  const nextButton = document.createElement('button');
  nextButton.className = `onboarding-button ${isLastStep ? 'onboarding-finish' : 'onboarding-next'}`;
  nextButton.textContent = isLastStep ? 'Get Started!' : 'Next';
  nextButton.addEventListener('click', () => {
    overlay.remove();
    removeHighlight();
    
    if (isLastStep) {
      completeOnboarding();
    } else {
      showOnboardingStep(step + 1);
    }
  });
  buttonContainer.appendChild(nextButton);
  
  // Progress dots
  const progressContainer = document.createElement('div');
  progressContainer.className = 'onboarding-progress';
  
  for (let i = 0; i < onboardingSteps.length; i++) {
    const dot = document.createElement('div');
    dot.className = `progress-dot ${i === step ? 'active' : ''}`;
    progressContainer.appendChild(dot);
  }
  
  popup.appendChild(title);
  popup.appendChild(content);
  popup.appendChild(buttonContainer);
  popup.appendChild(progressContainer);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
  // Add highlight if applicable
  if (onboardingSteps[step].highlightElement) {
    highlightElement(onboardingSteps[step].highlightElement);
  }
  } catch (e) {
    console.error('Error creating onboarding popup:', e);
    removeHighlight();
    // Try to clean up any partial UI elements
    const partialOverlay = document.querySelector('.onboarding-overlay');
    if (partialOverlay) partialOverlay.remove();
  }
}

// Position the popup based on the step configuration
function positionPopup(popup, step) {
  try {
    if (step.position === 'center') {
      popup.style.top = '50%';
      popup.style.left = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
      return;
    }
    
    if (step.highlightElement) {
      const element = document.querySelector(step.highlightElement);
      if (!element) {
        console.warn(`Element not found: ${step.highlightElement}, defaulting to center`);
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        return;
      }
      
      const rect = element.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      
      // Reset any previous positioning
      popup.style.top = '';
      popup.style.right = '';
      popup.style.bottom = '';
      popup.style.left = '';
      popup.style.transform = '';
      
      switch (step.position) {
        case 'left':
          popup.style.right = `${window.innerWidth - rect.left + 20}px`;
          popup.style.top = `${rect.top + rect.height/2}px`;
          popup.style.transform = 'translateY(-50%)';
          break;
        case 'right':
          popup.style.left = `${rect.right + 20}px`;
          popup.style.top = `${rect.top + rect.height/2}px`;
          popup.style.transform = 'translateY(-50%)';
          break;
        case 'top':
          popup.style.bottom = `${window.innerHeight - rect.top + 20}px`;
          popup.style.left = `${rect.left + rect.width/2}px`;
          popup.style.transform = 'translateX(-50%)';
          break;
        case 'bottom':
          popup.style.top = `${rect.bottom + 20}px`;
          popup.style.left = `${rect.left + rect.width/2}px`;
          popup.style.transform = 'translateX(-50%)';
          break;
        case 'right-top':
          popup.style.left = `${rect.right + 20}px`;
          popup.style.top = `${rect.top}px`;
          break;
        case 'top-right':
          popup.style.bottom = `${window.innerHeight - rect.top + 20}px`;
          popup.style.right = `${window.innerWidth - rect.right}px`;
          break;
        default:
          // Default to center if position is not recognized
          popup.style.top = '50%';
          popup.style.left = '50%';
          popup.style.transform = 'translate(-50%, -50%)';
      }
      
      // Adjust for mobile
      if (isMobile) {
        // Reset positioning for better mobile experience
        popup.style.left = '50%';
        popup.style.right = 'auto';
        popup.style.top = step.position.includes('top') ? '70px' : '50%';
        popup.style.bottom = 'auto';
        popup.style.transform = 'translateX(-50%)';
      }
    } else {
      // No highlight element, center the popup
      popup.style.top = '50%';
      popup.style.left = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
    }
    
    // Make sure popup is visible within viewport after a short delay to allow positioning to settle
    setTimeout(() => {
      try {
        const popupRect = popup.getBoundingClientRect();
        
        // Check left edge
        if (popupRect.left < 10) {
          popup.style.left = '10px';
          popup.style.transform = popup.style.transform.replace('translateX(-50%)', '');
        }
        
        // Check right edge
        if (popupRect.right > window.innerWidth - 10) {
          popup.style.right = '10px';
          popup.style.left = 'auto';
          popup.style.transform = popup.style.transform.replace('translateX(-50%)', '');
        }
        
        // Check top edge (account for header)
        if (popupRect.top < 60) {
          popup.style.top = '60px';
          popup.style.transform = popup.style.transform.replace('translateY(-50%)', '');
        }
        
        // Check bottom edge
        if (popupRect.bottom > window.innerHeight - 10) {
          popup.style.bottom = '10px';
          popup.style.top = 'auto';
          popup.style.transform = popup.style.transform.replace('translateY(-50%)', '');
        }
      } catch (e) {
        console.error('Error adjusting popup within viewport:', e);
      }
    }, 10);
  } catch (e) {
    console.error('Error positioning popup:', e);
    // Fallback to center positioning
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
  }
}

// Highlight an element
function highlightElement(selector) {
  try {
    removeHighlight(); // Remove any existing highlight
    
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element not found for highlighting: ${selector}`);
      return;
    }
    
    const rect = element.getBoundingClientRect();
    
    const highlight = document.createElement('div');
    highlight.className = 'onboarding-highlight';
    highlight.style.width = `${rect.width + 10}px`;
    highlight.style.height = `${rect.height + 10}px`;
    highlight.style.top = `${rect.top - 5}px`;
    highlight.style.left = `${rect.left - 5}px`;
    
    highlight.id = 'current-highlight';
    document.body.appendChild(highlight);
    
    // Reposition highlight if window is resized
    window.addEventListener('resize', repositionHighlight);
  } catch (e) {
    console.error('Error highlighting element:', e);
  }
}

// Reposition highlight on window resize
function repositionHighlight() {
  const highlight = document.getElementById('current-highlight');
  if (!highlight) return;
  
  try {
    const currentStep = onboardingSteps[currentOnboardingStep];
    if (currentStep?.highlightElement) {
      const element = document.querySelector(currentStep.highlightElement);
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      highlight.style.width = `${rect.width + 10}px`;
      highlight.style.height = `${rect.height + 10}px`;
      highlight.style.top = `${rect.top - 5}px`;
      highlight.style.left = `${rect.left - 5}px`;
    }
  } catch (e) {
    console.error('Error repositioning highlight:', e);
  }
}

// Remove any existing highlight
function removeHighlight() {
  try {
    const highlight = document.getElementById('current-highlight');
    if (highlight) {
      window.removeEventListener('resize', repositionHighlight);
      highlight.remove();
    }
  } catch (e) {
    console.error('Error removing highlight:', e);
  }
}

// Show a specific onboarding step
function showOnboardingStep(step) {
  try {
    if (step >= 0 && step < onboardingSteps.length) {
      currentOnboardingStep = step; // Track current step
      createOnboardingPopup(step);
    } else {
      console.warn(`Invalid step number: ${step}`);
    }
  } catch (e) {
    console.error('Error showing onboarding step:', e);
    // Try to recover by showing first step
    if (step !== 0) {
      try {
        currentOnboardingStep = 0;
        createOnboardingPopup(0);
      } catch (innerError) {
        console.error('Could not recover onboarding:', innerError);
      }
    }
  }
}

// Mark the onboarding as completed
function completeOnboarding() {
  localStorage.setItem('globstoryOnboardingCompleted', 'true');
}

// Reset the onboarding (for testing)
function resetOnboarding() {
  localStorage.removeItem('globstoryOnboardingCompleted');
  window.location.reload();
}

// Initialize the onboarding system
function initOnboarding() {
  try {
    if (isFirstVisit()) {
      // Check if elements are ready
      const checkElementsAndStart = () => {
        try {
          // Check for critical elements
          const mapElement = document.querySelector('#map');
          const searchBox = document.querySelector('#search-box');
          
          if (mapElement && searchBox) {
            console.log('Key elements found, starting onboarding...');
            showOnboardingStep(0);
          } else {
            console.log('Key elements not ready yet, will retry...');
            // Retry after a short delay
            setTimeout(checkElementsAndStart, 1000);
          }
        } catch (e) {
          console.error('Error checking for elements:', e);
          setTimeout(() => showOnboardingStep(0), 2000);
        }
      };
      
      // Start checking after initial wait
      setTimeout(checkElementsAndStart, 1000);
    }
  } catch (e) {
    console.error('Error initializing onboarding:', e);
  }
}

// Add a method to manually start onboarding if needed
window.startOnboarding = function() {
  showOnboardingStep(0);
};

// Add a method to reset onboarding for testing
window.resetOnboarding = resetOnboarding;

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  try {
    // Waiting a bit longer to ensure the map and all components are loaded
    setTimeout(initOnboarding, 2000);
    
    // Add a failsafe initialization
    setTimeout(function() {
      if (isFirstVisit() && !document.querySelector('.onboarding-overlay')) {
        console.log('Failsafe: Starting onboarding after extended wait...');
        showOnboardingStep(0);
      }
    }, 5000);
  } catch (e) {
    console.error('Error in main initialization:', e);
  }
});
