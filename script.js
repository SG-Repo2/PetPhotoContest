// Check for previous votes and reset status
async function checkVoteStatus() {
  const lastVoteTime = localStorage.getItem('voteTimestamp');
  if (!lastVoteTime) return; // No previous vote
  
  try {
    const res = await fetch('votes.json');
    if (!res.ok) throw new Error('Could not check vote status');
    const data = await res.json();
    
    // If there's no reset timestamp or the last vote was after the reset
    if (!data.resetTimestamp || lastVoteTime > data.resetTimestamp) {
      // Instead of redirecting, set view-only mode
      localStorage.setItem('viewOnlyMode', 'true');
    } else {
      // Clear the vote status since there was a reset
      localStorage.removeItem('hasVoted');
      localStorage.removeItem('voteTimestamp');
      localStorage.removeItem('viewOnlyMode');
    }
  } catch (err) {
    console.error('Error checking vote status:', err);
  }
}

// Run the check before initializing
checkVoteStatus();

// script.js - Updated for proper image display and card sizing
(function() {
  const petGrid       = document.getElementById('pet-grid');
  const loadingEl     = document.getElementById('loading');
  const errorEl       = document.getElementById('error-container');
  const submitBtn     = document.getElementById('submit-btn');
  const counterNumber = document.querySelector('.counter-number');
  // Remove view toggle and carousel buttons references
  let pets            = {};
  let selectedPets    = [];
  const MAX_SELECTIONS = 3;

  // Move this function to ensure it runs after DOM is fully loaded
  function init() {
    // First make sure DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
      });
    } else {
      initializeApp();
    }
  }

  // Create a new function to handle all initialization
  function initializeApp() {
    fetchPets();
    
    // Set up modal functionality first to ensure it exists
    setupImageModal();
    
    // Then handle other interactions
    submitBtn.addEventListener('click', submitVotes);
    
    // Check if in view-only mode
    if (localStorage.getItem('viewOnlyMode') === 'true') {
      enableViewOnlyMode();
    }
  }

  async function fetchPets() {
    try {
      const res = await fetch('votes.json');
      if (!res.ok) throw new Error('Could not load pets.');
      const data = await res.json();
      
      // Handle both the old structure and new structure with resetTimestamp
      pets = data.pets || data;
      renderPets();
    } catch (err) {
      showError(err.message);
    } finally {
      loadingEl.style.display = 'none';
    }
  }

  function renderPets() {
    petGrid.innerHTML = '';
    const isViewOnly = localStorage.getItem('viewOnlyMode') === 'true';
    
    // Always use grid view
    petGrid.className = 'pet-grid grid-view';
    
    Object.entries(pets).forEach(([id, data]) => {
      const card = document.createElement('div');
      const isSel = selectedPets.includes(id);
      card.className = `pet-card${isSel ? ' selected' : ''}`;
      
      // Include caption without truncation in HTML
      card.innerHTML = `
        <div class="pet-image-container">
          <img src="assets/pets/${data.image}" alt="${data.photoTitle}" class="pet-image">
        </div>
        <div class="pet-info">
          <h3 class="photo-title">${data.photoTitle}</h3>
          <p class="photo-caption">${data.photoCaption || ''}</p>
        </div>
        ${!isViewOnly ? `
        <button class="btn btn-vote${isSel ? ' selected' : ''}"
                ${selectedPets.length >= MAX_SELECTIONS && !isSel ? 'disabled' : ''}>
           <img src="assets/img/voteButton.png" alt="Vote" class="vote-button-img">
        </button>` : ''}`;
      petGrid.appendChild(card);

      // Apply responsive font size based on title length
      const titleElement = card.querySelector('.photo-title');
      adjustTitleFontSize(titleElement);
      
      // Check if caption needs "read more" functionality after rendering
      const captionElement = card.querySelector('.photo-caption');
      addReadMoreIfNeeded(captionElement);

      // Only add event listener if not in view-only mode
      if (!isViewOnly) {
        const voteButton = card.querySelector('.btn-vote');
        if (voteButton) {
          voteButton.addEventListener('click', () => toggleSelection(id));
        }
      }

      // Add click event to images for modal functionality
      const petImage = card.querySelector('.pet-image');
      if (petImage) {
        petImage.addEventListener('click', () => {
          const modal = document.getElementById('imageModal');
          const modalImg = document.getElementById('modalImage');
          const captionText = document.getElementById('modalCaption');
          
          if (modal && modalImg) {
            modal.style.display = "block";
            document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
            modalImg.src = petImage.src;
            
            if (captionText) {
              const title = data.photoTitle || '';
              const caption = data.photoCaption || '';
              captionText.innerHTML = `<strong>${title}</strong><br>${caption}`;
            }
          }
        });
      }
    });

    submitBtn.disabled = isViewOnly || selectedPets.length === 0;
    counterNumber.textContent = selectedPets.length;
  }

  // Advanced function to precisely scale font size based on text length
  function adjustTitleFontSize(element) {
    const text = element.textContent;
    const chars = text.length;
    
    // Base font size calculations
    // Start with 1.5rem (24px) for short titles, scale down for longer ones
    let fontSize = 1.5; // Default in rem
    
    if (chars > 20) {
      // Gradually reduce font size as text gets longer
      // This formula scales from 1.5rem down to 0.9rem
      fontSize = Math.max(0.9, 1.5 - ((chars - 20) * 0.025));
    }
    
    // Apply the calculated font size
    element.style.fontSize = `${fontSize}rem`;
    
    // Ensure minimum height for consistent card sizing
    element.style.minHeight = `${Math.ceil(fontSize * 2.4)}rem`;
  }

  // Function to check if a caption needs a read more button and add it if necessary
  function addReadMoreIfNeeded(captionElement) {
    // Skip if no caption or empty
    if (!captionElement || !captionElement.textContent.trim()) return;
    
    // Get element height and check if it exceeds the max height in CSS
    const actualHeight = captionElement.scrollHeight;
    const visibleHeight = captionElement.clientHeight;
    
    // Add a 10% buffer before deciding to add the read more button
    // This allows slightly more text to be visible without triggering the button
    const buffer = Math.min(10, visibleHeight * 0.1); // 10% buffer or 10px max
    
    if (actualHeight > (visibleHeight + buffer)) {
      // Caption is too long, add read more functionality
      const gradient = document.createElement('span');
      gradient.className = 'photo-caption-gradient';
      gradient.style.display = 'block';
      captionElement.appendChild(gradient);
      
      // Create and add the read more button
      const readMoreBtn = document.createElement('button');
      readMoreBtn.className = 'read-more-btn';
      readMoreBtn.textContent = 'Read more';
      captionElement.parentNode.insertBefore(readMoreBtn, captionElement.nextSibling);
      
      // Add click event
      readMoreBtn.addEventListener('click', function() {
        captionElement.classList.toggle('expanded');
        this.textContent = captionElement.classList.contains('expanded') ? 'Read less' : 'Read more';
        gradient.style.display = captionElement.classList.contains('expanded') ? 'none' : 'block';
      });
    }
  }

  function toggleSelection(id) {
    const idx = selectedPets.indexOf(id);
    if (idx === -1 && selectedPets.length < MAX_SELECTIONS) {
      selectedPets.push(id);
    } else if (idx > -1) {
      selectedPets.splice(idx, 1);
    }
    renderPets();
  }

  async function submitVotes() {
    if (!selectedPets.length) return;
    submitBtn.disabled = true;
    
    const originalButtonContent = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Submitting...';

    try {
      const res = await fetch('submit_vote.php', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ photo_ids: selectedPets })
      });
      
      if (!res.ok) throw new Error('Network response was not ok');
      
      const json = await res.json();
      if (json.success) {
        // Store both the vote flag and timestamp
        localStorage.setItem('hasVoted', 'true');
        localStorage.setItem('voteTimestamp', String(Math.floor(Date.now() / 1000)));
        localStorage.setItem('viewOnlyMode', 'true'); // Set view-only mode
        
        // Instead of redirecting, show success message and switch to view-only mode
        enableViewOnlyMode();
        showSuccess('Thank you for voting! You can continue browsing the gallery.');
        
        // Reset the selected pets
        selectedPets = [];
        renderPets();
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      showError(err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalButtonContent;
    }
  }

  // New function to enable view-only mode
  function enableViewOnlyMode() {
    // Disable the submit button
    submitBtn.disabled = true;
    
    // Add a view-only message
    const container = document.querySelector('.container');
    const instructionsEl = document.querySelector('.instructions');
    
    const viewOnlyMessage = document.createElement('div');
    viewOnlyMessage.className = 'view-only-message';
    viewOnlyMessage.innerHTML = 'You have already voted! You are now in view-only mode.';
    
    // Insert after instructions
    if (instructionsEl) {
      instructionsEl.insertAdjacentElement('afterend', viewOnlyMessage);
    } else {
      container.insertBefore(viewOnlyMessage, container.firstChild);
    }
    
    // Hide the counter
    const counterEl = document.getElementById('selection-counter');
    if (counterEl) {
      counterEl.style.display = 'none';
    }
  }
  
  // Add a function to show success messages
  function showSuccess(msg) {
    const successEl = document.createElement('div');
    successEl.className = 'success-message';
    successEl.innerHTML = `<p>${msg}</p>`;
    
    // Find a good spot to insert the message
    const errorEl = document.getElementById('error-container');
    errorEl.innerHTML = ''; // Clear any errors
    errorEl.appendChild(successEl);
    
    // Auto-hide after a few seconds
    setTimeout(() => {
      successEl.style.opacity = '0';
      setTimeout(() => {
        if (errorEl.contains(successEl)) {
          errorEl.removeChild(successEl);
        }
      }, 1000);
    }, 5000);
  }

  function showError(msg) {
    errorEl.innerHTML = `<div class="error"><p>${msg}</p></div>`;
  }

  // Update the setupImageModal function
  function setupImageModal() {
    console.log("Setting up image modal..."); // Debug log
    
    // Check if modal exists in DOM
    let modal = document.getElementById('imageModal');
    
    // If modal doesn't exist, create it
    if (!modal) {
      console.log("Modal not found, creating it dynamically");
      modal = document.createElement('div');
      modal.id = 'imageModal';
      modal.className = 'image-modal';
      modal.innerHTML = `
        <span class="close-modal">&times;</span>
        <img class="modal-content" id="modalImage">
        <div id="modalCaption"></div>
      `;
      document.body.appendChild(modal);
    }
    
    const closeBtn = modal.querySelector('.close-modal');
    
    // Close modal when clicking the X
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        console.log("Close button clicked"); // Debug log
        modal.style.display = "none";
        document.body.style.overflow = "auto"; // Re-enable scrolling
      });
    }
    
    // Close modal when clicking anywhere on it
    modal.addEventListener('click', (e) => {
      // Only close if clicking directly on the modal background, not its children
      if (e.target === modal) {
        console.log("Modal background clicked"); // Debug log
        modal.style.display = "none";
        document.body.style.overflow = "auto"; // Re-enable scrolling
      }
    });
    
    // Enable keyboard escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        console.log("Escape key pressed"); // Debug log
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }
    });
  }

  init();
})();
