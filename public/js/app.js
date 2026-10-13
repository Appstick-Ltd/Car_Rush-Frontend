/**
 * Car Rush: Web App Interaction Engine
 * Handles biome themes, sound effects, modal controllers, AJAX APIs & mobile dock
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Simulator
  let simulator = null;
  const canvasEl = document.getElementById('physicsCanvas');
  if (canvasEl && window.CarRushSimulator) {
    simulator = new window.CarRushSimulator('physicsCanvas');
  }

  // 2. Audio Toggle Management
  const audioBtn = document.getElementById('audioToggleBtn');
  let audioMuted = localStorage.getItem('carrush_audio_muted') === 'true';

  const updateAudioUI = () => {
    if (!audioBtn) return;
    if (audioMuted) {
      audioBtn.classList.remove('active');
      audioBtn.innerHTML = '🔇';
      audioBtn.title = 'Sound Muted (Click to Unmute)';
      if (simulator) simulator.soundEnabled = false;
    } else {
      audioBtn.classList.add('active');
      audioBtn.innerHTML = '🔊';
      audioBtn.title = 'Sound On (Click to Mute)';
      if (simulator) simulator.soundEnabled = true;
    }
  };

  updateAudioUI();

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      audioMuted = !audioMuted;
      localStorage.setItem('carrush_audio_muted', audioMuted);
      updateAudioUI();
      if (!audioMuted && simulator) {
        simulator.playSound('star');
      }
    });
  }

  // 3. Simulator Screen Tab Switcher (Demo Canvas vs Screenshot View)
  const simTabs = document.querySelectorAll('.sim-tab-btn');
  const simViews = document.querySelectorAll('.simulator-view');

  simTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      simTabs.forEach(t => t.classList.remove('active'));
      simViews.forEach(v => v.classList.remove('active'));

      tab.classList.add('active');
      const activeView = document.getElementById(`simView-${target}`);
      if (activeView) activeView.classList.add('active');

      if (navigator.vibrate) navigator.vibrate(10);
    });
  });

  // 4. Biome Theme Switcher
  const biomeCards = document.querySelectorAll('.biome-card');
  biomeCards.forEach(card => {
    card.addEventListener('click', () => {
      const biome = card.getAttribute('data-biome');
      document.body.setAttribute('data-biome', biome);
      biomeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      if (simulator && !audioMuted) {
        simulator.playSound('engine');
      }
      if (navigator.vibrate) navigator.vibrate(15);
    });
  });

  // 5. FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    if (header) {
      header.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // Close others
        faqItems.forEach(i => i.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    }
  });

  // 6. Generic Modal Handlers
  const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = (modal) => {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      // Reset feedback alerts
      const alerts = modal.querySelectorAll('.modal-feedback-alert');
      alerts.forEach(a => a.className = 'modal-feedback-alert');
    }
  };

  // Triggers
  document.querySelectorAll('[data-open-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = trigger.getAttribute('data-open-modal');
      openModal(modalId);
    });
  });

  // Close Buttons & Backdrop Clicks
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });

    const closeBtn = backdrop.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(backdrop));
    }
  });

  // 7. Data Deletion Form AJAX Submission
  const deletionForm = document.getElementById('dataDeletionForm');
  if (deletionForm) {
    deletionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = deletionForm.querySelector('button[type="submit"]');
      const alertBox = document.getElementById('deletionAlert');
      const deviceId = document.getElementById('deletionDeviceId').value.trim();
      const email = document.getElementById('deletionEmail').value.trim();
      const reason = document.getElementById('deletionReason').value.trim();

      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch('/api/data-deletion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, email, reason })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          alertBox.className = 'modal-feedback-alert success';
          alertBox.innerHTML = `<strong>Success!</strong> ${data.message} <br/><small>Ticket ID: ${data.ticketId}</small>`;
          deletionForm.reset();
        } else {
          alertBox.className = 'modal-feedback-alert error';
          alertBox.textContent = data.message || 'Error processing request.';
        }
      } catch (err) {
        alertBox.className = 'modal-feedback-alert error';
        alertBox.textContent = 'Network error. Please try again later.';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // 8. Contact / Feedback Form AJAX Submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const alertBox = document.getElementById('contactAlert');
      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const subject = document.getElementById('contactSubject').value.trim();
      const message = document.getElementById('contactMessage').value.trim();

      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, subject, message })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          alertBox.className = 'modal-feedback-alert success';
          alertBox.innerHTML = `<strong>Sent!</strong> ${data.message}`;
          contactForm.reset();
        } else {
          alertBox.className = 'modal-feedback-alert error';
          alertBox.textContent = data.message || 'Error submitting feedback.';
        }
      } catch (err) {
        alertBox.className = 'modal-feedback-alert error';
        alertBox.textContent = 'Network error. Please try again later.';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // 9. Mobile Bottom Dock Active Navigation on Scroll
  const sections = document.querySelectorAll('section[id]');
  const dockLinks = document.querySelectorAll('.mobile-app-dock .dock-item');

  const onScroll = () => {
    let current = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop) {
        current = sec.getAttribute('id');
      }
    });

    dockLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
});
