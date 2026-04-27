document.addEventListener('DOMContentLoaded', () => {
  const navBtns = document.querySelectorAll('.nav-btn');
  const viewSections = document.querySelectorAll('.view-section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons and sections
      navBtns.forEach(b => b.classList.remove('active'));
      viewSections.forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
      });

      // Add active class to clicked button
      btn.classList.add('active');

      // Show target section
      const targetId = btn.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');
      }
    });
  });

  // Optional: Add interactivity to volunteer cards
  function attachCardListeners() {
    const volunteerCards = document.querySelectorAll('.volunteer-card');
    volunteerCards.forEach(card => {
      card.addEventListener('click', () => {
        volunteerCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  }
  attachCardListeners();

  // Backend Integration
  async function loadBackendData() {
    try {
      const response = await fetch('http://localhost:3000/api/volunteers');
      const volunteers = await response.json();
      
      const volunteerList = document.querySelector('.volunteer-list');
      if (volunteerList && volunteers.length > 0) {
        volunteerList.innerHTML = ''; // clear static data
        
        volunteers.forEach((v, index) => {
          const isSelected = index === 0 ? 'selected' : '';
          const imageNum = (index % 10) + 1; // dummy avatar
          
          const cardHtml = `
            <div class="volunteer-card ${isSelected}" data-id="${v.id}">
              <img src="https://i.pravatar.cc/150?img=${imageNum}" alt="${v.name}" class="vol-avatar">
              <div class="vol-info">
                <h4>${v.name}</h4>
                <p>${v.skills.join(', ')}</p>
                <span class="distance">${v.distance_mi} mi away • ${v.status}</span>
              </div>
            </div>
          `;
          volunteerList.insertAdjacentHTML('beforeend', cardHtml);
        });
        
        attachCardListeners();
      }
    } catch (error) {
      console.error("Failed to load backend data:", error);
    }
  }

  // Load dynamic data on startup
  loadBackendData();
});
