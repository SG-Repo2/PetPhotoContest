// Check for previous votes and reset status
async function checkVoteStatus() {
  const lastVoteTime = localStorage.getItem('voteTimestamp');
  if (!lastVoteTime) return; // No previous vote
  
  try {
    const res = await fetch('votes.json');
    if (!res.ok) throw new Error('Could not check vote status');
    const data = await res.json();
    
    // If there's no reset timestamp or the last vote was after the reset, redirect
    if (!data.resetTimestamp || lastVoteTime > data.resetTimestamp) {
      window.location.href = 'thank-you.html';
    } else {
      // Clear the vote status since there was a reset
      localStorage.removeItem('hasVoted');
      localStorage.removeItem('voteTimestamp');
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
  const viewToggleEl  = document.getElementById('view-toggle');
  const prevBtn       = document.getElementById('prevBtn');
  const nextBtn       = document.getElementById('nextBtn');
  let pets            = {};
  let selectedPets    = [];
  const MAX_SELECTIONS = 3;

  init();

  function init() {
    fetchPets();
    submitBtn.addEventListener('click', submitVotes);
    
    // Add view toggle functionality
    if (viewToggleEl) {
      const viewButtons = viewToggleEl.querySelectorAll('.view-button');
      viewButtons.forEach(button => {
        button.addEventListener('click', () => {
          const view = button.getAttribute('data-view');
          setActiveView(view, viewButtons);
        });
      });
    }

    // Add carousel navigation listeners
    if (prevBtn) prevBtn.addEventListener('click', () => scrollCarousel('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollCarousel('next'));
  }

  // Function to handle carousel scrolling
  function scrollCarousel(direction) {
    const cardWidth = petGrid.querySelector('.pet-card')?.offsetWidth || 0;
    const scrollAmount = cardWidth + 20; // card width + gap
    
    if (direction === 'prev') {
      petGrid.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    } else {
      petGrid.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }

    // Update button states after scrolling
    updateCarouselButtons();
  }

  // Function to update carousel button states
  function updateCarouselButtons() {
    if (!petGrid || !prevBtn || !nextBtn) return;

    const isAtStart = petGrid.scrollLeft <= 0;
    const isAtEnd = petGrid.scrollLeft + petGrid.offsetWidth >= petGrid.scrollWidth;

    prevBtn.disabled = isAtStart;
    nextBtn.disabled = isAtEnd;
  }

  // Function to handle view toggling
  function setActiveView(view, buttons) {
    // Toggle active class on buttons
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });
    
    // Update pet grid classes
    petGrid.classList.remove('grid-view', 'carousel-view');
    petGrid.classList.add(`${view}-view`);

    // Show/hide and update carousel navigation
    const carouselNav = document.querySelector('.carousel-nav');
    if (carouselNav) {
      carouselNav.style.display = view === 'carousel' ? 'block' : 'none';
      if (view === 'carousel') {
        updateCarouselButtons();
        // Add scroll event listener for carousel
        petGrid.addEventListener('scroll', updateCarouselButtons);
      } else {
        petGrid.removeEventListener('scroll', updateCarouselButtons);
      }
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
        <button class="btn btn-vote${isSel ? ' selected' : ''}"
                ${selectedPets.length >= MAX_SELECTIONS && !isSel ? 'disabled' : ''}>
           <img src="assets/img/voteButton.png" alt="Vote" class="vote-button-img">
        </button>`;
      petGrid.appendChild(card);

      // Apply responsive font size based on title length
      const titleElement = card.querySelector('.photo-title');
      adjustTitleFontSize(titleElement);
      
      // Check if caption needs "read more" functionality after rendering
      const captionElement = card.querySelector('.photo-caption');
      addReadMoreIfNeeded(captionElement);

      card.querySelector('.btn-vote')
          .addEventListener('click', () => toggleSelection(id));
    });

    submitBtn.disabled = selectedPets.length === 0;
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
        window.location.href = 'thank-you.html';
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      showError(err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalButtonContent;
    }
  }

  function showError(msg) {
    errorEl.innerHTML = `<div class="error"><p>${msg}</p></div>`;
  }
})();
