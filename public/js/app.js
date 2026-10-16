/**
 * Car Rush: Web App Interaction Engine
 * Handles biome themes, sound effects, modal controllers, AJAX APIs & mobile dock
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── PAGE PRELOADER ───────────────────────────────────────────────────────
  const preloader = document.getElementById('page-preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      setTimeout(() => preloader.classList.add('hidden'), 800);
    });
    // Fallback: hide after 2.5s if load is slow
    setTimeout(() => preloader && preloader.classList.add('hidden'), 2500);
  }

  // ── SCROLL-TO-TOP BUTTON ─────────────────────────────────────────────────
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }, { passive: true });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── HAMBURGER MOBILE MENU ────────────────────────────────────────────────
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileNavOverlay = document.getElementById('mobileNavOverlay');
  const mobileNavClose = document.getElementById('mobileNavClose');

  const openMobileMenu = () => {
    hamburgerBtn && hamburgerBtn.classList.add('open');
    if (mobileNavOverlay) {
      mobileNavOverlay.style.display = 'flex';
      requestAnimationFrame(() => mobileNavOverlay.classList.add('open'));
      document.body.style.overflow = 'hidden';
    }
  };

  const closeMobileMenu = () => {
    hamburgerBtn && hamburgerBtn.classList.remove('open');
    if (mobileNavOverlay) {
      mobileNavOverlay.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!mobileNavOverlay.classList.contains('open')) {
          mobileNavOverlay.style.display = 'none';
        }
      }, 300);
    }
  };

  hamburgerBtn && hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
  });
  mobileNavClose && mobileNavClose.addEventListener('click', closeMobileMenu);

  // Close menu when a mobile nav link is clicked
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // ── SECTION FADE-IN (Intersection Observer) ──────────────────────────────
  const animateSections = document.querySelectorAll('.section-animate');
  if ('IntersectionObserver' in window && animateSections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    animateSections.forEach(el => observer.observe(el));
  } else {
    // Fallback: show all immediately
    animateSections.forEach(el => el.classList.add('in-view'));
  }

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

  // 9. Active Navigation Highlighting on Scroll (Navbar + Mobile Dock)
  const sections = document.querySelectorAll('section[id]');
  const dockLinks = document.querySelectorAll('.mobile-app-dock .dock-item');
  const navLinks = document.querySelectorAll('.Navbar-module__nav .Navbar-module__navLink');

  const onScroll = () => {
    let current = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop) {
        current = sec.getAttribute('id');
      }
    });

    // Update desktop navbar active link
    const v2SectionIds = ['v2-showcase', 'garage', 'infinite-mode', 'magic-inks', 'kinetic-hazards', 'camera-engine'];
    const v2DropdownBtn = document.getElementById('v2DropdownBtn');
    if (v2DropdownBtn) {
      if (v2SectionIds.includes(current)) {
        v2DropdownBtn.classList.add('Navbar-module__navLinkActive');
      } else {
        v2DropdownBtn.classList.remove('Navbar-module__navLinkActive');
      }
    }

    navLinks.forEach(link => {
      if (link.id === 'v2DropdownBtn') return;
      link.classList.remove('Navbar-module__navLinkActive');
      const href = link.getAttribute('href');
      if (href === `#${current}`) {
        link.classList.add('Navbar-module__navLinkActive');
      }
    });

    // Update mobile dock active link
    dockLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  // Run once on load to set initial active state
  onScroll();

  // ── WHAT'S NEW v2.0 DROPDOWN MENU INTERACTION ──────────────────────────
  const v2Dropdown = document.getElementById('v2Dropdown');
  const v2DropdownBtn = document.getElementById('v2DropdownBtn');
  const v2DropdownMenu = document.getElementById('v2DropdownMenu');

  if (v2Dropdown && v2DropdownBtn) {
    v2DropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = v2Dropdown.classList.toggle('open');
      v2DropdownBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close when clicking any link inside dropdown menu
    if (v2DropdownMenu) {
      v2DropdownMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          v2Dropdown.classList.remove('open');
          v2DropdownBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!v2Dropdown.contains(e.target)) {
        v2Dropdown.classList.remove('open');
        v2DropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        v2Dropdown.classList.remove('open');
        v2DropdownBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }


  // 10. Clean URL Smooth Scroll — No #hash in address bar
  // Intercepts all internal anchor (#section) clicks and scrolls smoothly
  // without letting the browser update the URL with the hash fragment.
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      // Ignore bare "#" links (e.g. modal triggers handled elsewhere)
      if (!href || href === '#') return;

      const targetId = href.slice(1);
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      e.preventDefault();

      // Scroll to section smoothly
      const headerOffset = 80; // fixed navbar height
      const top = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });

      // Keep URL clean — no hash shown
      history.replaceState(null, '', window.location.pathname);
    });
  });

  // ── 11. v2.0 INTERACTIVE GARAGE SHOWROOM ENGINE ─────────────────────────
  const vehicleCards = document.querySelectorAll('.garage-vehicle-card');
  const paintSwatches = document.querySelectorAll('.paint-swatch-btn');
  const stageRigName = document.getElementById('stageRigName');
  const stageRigClass = document.getElementById('stageRigClass');
  const stageRigPrice = document.getElementById('stageRigPrice');
  const stageRigEmoji = document.getElementById('stageRigEmoji');
  const btnTestDrive = document.getElementById('btnGarageTestDrive');
  const statSpeedBar = document.getElementById('statSpeedBar');
  const statTorqueBar = document.getElementById('statTorqueBar');
  const statBounceBar = document.getElementById('statBounceBar');
  const statGripBar = document.getElementById('statGripBar');
  const statWeightBar = document.getElementById('statWeightBar');
  const statSpeedVal = document.getElementById('statSpeedVal');
  const statTorqueVal = document.getElementById('statTorqueVal');
  const statBounceVal = document.getElementById('statBounceVal');
  const statGripVal = document.getElementById('statGripVal');
  const statWeightVal = document.getElementById('statWeightVal');

  let selectedVehicle = 'buggy';
  let selectedPaint = '#38b6ff';

  const updateGarageShowroom = (vId) => {
    selectedVehicle = vId;
    const cfg = window.VEHICLE_CONFIGS ? window.VEHICLE_CONFIGS[vId] : null;
    if (!cfg) return;

    // Update active tab card
    vehicleCards.forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-vehicle') === vId);
    });

    // Update Stage texts
    if (stageRigName) stageRigName.textContent = cfg.name;
    if (stageRigClass) stageRigClass.textContent = cfg.class;
    if (stageRigPrice) stageRigPrice.textContent = cfg.unlock;
    if (stageRigEmoji) stageRigEmoji.textContent = cfg.emoji;

    // Update Performance Metric Bars
    if (statSpeedBar) statSpeedBar.style.width = `${cfg.speed}%`;
    if (statTorqueBar) statTorqueBar.style.width = `${vId === 'monster' ? 98 : Math.round(cfg.speed * 0.9)}%`;
    if (statBounceBar) statBounceBar.style.width = `${cfg.bounce}%`;
    if (statGripBar) statGripBar.style.width = `${cfg.grip}%`;
    if (statWeightBar) statWeightBar.style.width = `${cfg.weight}%`;

    if (statSpeedVal) statSpeedVal.textContent = `${cfg.speed}`;
    if (statTorqueVal) statTorqueVal.textContent = `${vId === 'monster' ? 98 : Math.round(cfg.speed * 0.9)}`;
    if (statBounceVal) statBounceVal.textContent = `${cfg.bounce}`;
    if (statGripVal) statGripVal.textContent = `${cfg.grip}`;
    if (statWeightVal) statWeightVal.textContent = `${cfg.weight}`;

    // Update Pedestal Vehicle Visual Class
    const pedestalStage = document.getElementById('garagePedestalStage');
    if (pedestalStage) {
      pedestalStage.setAttribute('data-rig', vId);
    }

    // Play engine sound
    if (simulator && !audioMuted) {
      simulator.setVehicle(vId);
    }
  };

  vehicleCards.forEach(card => {
    card.addEventListener('click', () => {
      const v = card.getAttribute('data-vehicle');
      updateGarageShowroom(v);
    });
  });

  paintSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      paintSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      selectedPaint = swatch.getAttribute('data-color');

      // Update pedestal styling
      document.documentElement.style.setProperty('--garage-active-paint', selectedPaint);

      // Update pedestal vehicle SVG colors
      document.querySelectorAll('.pedestal-rig-color').forEach(el => {
        el.setAttribute('fill', selectedPaint);
      });

      // Update simulator
      if (simulator) {
        simulator.setVehicleColor(selectedPaint);
      }
    });
  });

  if (btnTestDrive) {
    btnTestDrive.addEventListener('click', (e) => {
      e.preventDefault();
      const simSec = document.getElementById('simulator');
      if (simSec) {
        const top = simSec.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
        setTimeout(() => {
          if (simulator) {
            simulator.setVehicle(selectedVehicle);
            simulator.setVehicleColor(selectedPaint);
            simulator.startDrive();
          }
        }, 500);
      }
    });
  }

  // ── 12. v2.0 MAGIC INKS INTERACTION ────────────────────────────────────
  const magicInkCards = document.querySelectorAll('.magic-ink-card');
  magicInkCards.forEach(card => {
    card.addEventListener('click', () => {
      magicInkCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const ink = card.getAttribute('data-ink');
      if (simulator) {
        simulator.setMagicInk(ink);
      }
    });
  });
});
