// script.js - Updated for proper image display and card sizing
(function() {
  const petGrid       = document.getElementById('pet-grid');
  const loadingEl     = document.getElementById('loading');
  const errorEl       = document.getElementById('error-container');
  const submitBtn     = document.getElementById('submit-btn');
  const counterNumber = document.querySelector('.counter-number');
  const viewToggleEl  = document.getElementById('view-toggle');
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
  }

  async function fetchPets() {
    try {
      const res = await fetch('votes.json');
      if (!res.ok) throw new Error('Could not load pets.');
      pets = await res.json();
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
      card.innerHTML = `
        <div class="pet-image-container">
          <img src="assets/pets/${data.image}" alt="${data.petName}" class="pet-image">
        </div>
        <div class="pet-info">
          <h3 class="pet-name">${data.petName}</h3>

        </div>
        <button class="btn btn-vote${isSel ? ' selected' : ''}"
                ${selectedPets.length >= MAX_SELECTIONS && !isSel ? 'disabled' : ''}>
           <img src="assets/img/voteButton.png" alt="Vote" class="vote-button-img">
        </button>`;
      petGrid.appendChild(card);

      card.querySelector('.btn-vote')
          .addEventListener('click', () => toggleSelection(id));
    });

    submitBtn.disabled = selectedPets.length === 0;
    counterNumber.textContent = selectedPets.length;
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
    
    // Store the original content so we can restore it if needed
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