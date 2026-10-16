/**
 * Car Rush: Interactive Playable Canvas Physics Simulator v2.0
 * Replicates the "Draw & Drive" gameplay directly inside the web browser!
 * Features 5 Custom Vehicle Rigs, 5 Magic Inks, Gold Coin Economy, and Live Drawing!
 */

// Vehicle Physics & Appearance Configurations
const VEHICLE_CONFIGS = {
  buggy: {
    id: 'buggy',
    name: 'Speedy Buggy',
    emoji: '🏎️',
    class: 'Classic All-Rounder',
    speed: 82,
    grip: 85,
    bounce: 80,
    weight: 70,
    vx: 3.0,
    wheelSize: 7.5,
    heightOffset: 0,
    wobble: false,
    soundFreq: 120,
    unlock: 'Default Free'
  },
  monster: {
    id: 'monster',
    name: 'Mega Monster Truck',
    emoji: '🛞',
    class: 'Heavy Boulder Crusher',
    speed: 75,
    grip: 98,
    bounce: 95,
    weight: 98,
    vx: 2.7,
    wheelSize: 12.5,
    heightOffset: -6,
    wobble: true,
    soundFreq: 75,
    unlock: '🪙 1,200 Coins'
  },
  apex: {
    id: 'apex',
    name: 'Apex Turbo',
    emoji: '🏎️💨',
    class: 'F1 Downforce Supercar',
    speed: 99,
    grip: 96,
    bounce: 50,
    weight: 60,
    vx: 4.6,
    wheelSize: 6.5,
    heightOffset: 4,
    wobble: false,
    soundFreq: 180,
    unlock: '🪙 2,500 Coins'
  },
  camper: {
    id: 'camper',
    name: 'Hippie Cruiser',
    emoji: '🚐',
    class: 'Retro Camper Van',
    speed: 68,
    grip: 72,
    bounce: 92,
    weight: 85,
    vx: 2.4,
    wheelSize: 8,
    heightOffset: -2,
    wobble: true,
    soundFreq: 95,
    unlock: '🪙 500 Coins'
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Pulse',
    emoji: '⚡',
    class: 'Polygon Anti-Gravity Hypercar',
    speed: 95,
    grip: 90,
    bounce: 70,
    weight: 72,
    vx: 3.8,
    wheelSize: 7,
    heightOffset: 1,
    wobble: false,
    soundFreq: 240,
    unlock: '🪙 5,000 Coins'
  }
};

// 5 Magic Inks Configurations
const INK_CONFIGS = {
  asphalt: {
    id: 'asphalt',
    name: 'Normal Asphalt',
    emoji: '🛣️',
    color: '#4ade80',
    glow: 'rgba(74, 222, 128, 0.45)',
    core: '#ffffff',
    desc: 'Classic solid grip road',
    speedMult: 1.0,
    bounceMult: 1.0
  },
  spring: {
    id: 'spring',
    name: 'Bouncy Spring',
    emoji: '🌸',
    color: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.55)',
    core: '#ffe4e6',
    desc: 'High-launch trampoline',
    speedMult: 1.1,
    bounceMult: 2.2
  },
  boost: {
    id: 'boost',
    name: 'Boost Accelerator',
    emoji: '⚡',
    color: '#facc15',
    glow: 'rgba(250, 204, 21, 0.6)',
    core: '#ffffff',
    desc: 'Super-speed nitro launch pad',
    speedMult: 1.7,
    bounceMult: 0.9
  },
  armor: {
    id: 'armor',
    name: 'Heavy Armor',
    emoji: '🛡️',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.5)',
    core: '#e0f2fe',
    desc: 'Reinforced boulder shield',
    speedMult: 0.95,
    bounceMult: 0.5
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost Bridge',
    emoji: '👻',
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.45)',
    core: '#f3e8ff',
    desc: 'Vanishing phantom mist',
    speedMult: 1.05,
    bounceMult: 1.0
  }
};

class CarRushSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Canvas scaling
    this.width = this.canvas.width = this.canvas.parentElement.clientWidth || 320;
    this.height = this.canvas.height = this.canvas.parentElement.clientHeight || 560;

    // v2.0 State
    this.currentVehicle = 'buggy';
    this.vehicleColor = '#38b6ff';
    this.magicInk = 'asphalt';

    // Game state
    this.isDrawing = false;
    this.points = [];
    this.carState = 'idle'; // 'idle', 'driving', 'won', 'crashed'
    this.soundEnabled = true;

    // Ink management
    this.maxInk = 1200;
    this.usedInk = 0;

    // Platforms
    this.startPlatform = { x: 0, y: 380, width: 85, height: 180 };
    this.finishPlatform = { x: this.width - 85, y: 380, width: 85, height: 180 };

    // Physics & Car
    this.car = {
      x: 35,
      y: 358,
      vx: 0,
      vy: 0,
      width: 44,
      height: 26,
      angle: 0,
      wheelRot: 0,
      wobbleOffset: 0,
      boostTimer: 0
    };

    // Particles & Confetti
    this.particles = [];
    this.confetti = [];

    // Collectibles: 3 Stars + 3 Gold Coins
    this.stars = [
      { x: this.width * 0.35, y: 300, collected: false },
      { x: this.width * 0.50, y: 260, collected: false },
      { x: this.width * 0.65, y: 300, collected: false }
    ];

    this.coins = [
      { x: this.width * 0.26, y: 345, collected: false, rot: 0 },
      { x: this.width * 0.50, y: 320, collected: false, rot: 0 },
      { x: this.width * 0.74, y: 345, collected: false, rot: 0 }
    ];

    this.collectedCoins = 0;

    // Web Audio Synthesizer
    this.initAudio();

    // Event Listeners
    this.initEvents();

    // Auto-draw a welcoming bridge on initial load!
    this.drawPresetBridge();

    // Start animation loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch (e) {
      this.audioCtx = null;
    }
  }

  playSound(type) {
    if (!this.soundEnabled || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    if (type === 'draw') {
      const ink = INK_CONFIGS[this.magicInk] || INK_CONFIGS.asphalt;
      osc.type = this.magicInk === 'spring' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(this.magicInk === 'boost' ? 330 : 220, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.05);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === 'engine') {
      const cfg = VEHICLE_CONFIGS[this.currentVehicle] || VEHICLE_CONFIGS.buggy;
      osc.type = this.currentVehicle === 'cyber' ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(cfg.soundFreq, t);
      osc.frequency.exponentialRampToValueAtTime(cfg.soundFreq * 2.2, t + 0.35);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
    } else if (type === 'star') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880, t + 0.08); // A5
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
    } else if (type === 'coin') {
      // Golden coin pickup chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, t); // B5
      osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.start(t);
      osc.stop(t + 0.28);
    } else if (type === 'boost') {
      // Nitro whoosh
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.4);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    } else if (type === 'victory') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C
      notes.forEach((freq, idx) => {
        const o = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        o.connect(g);
        g.connect(this.audioCtx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t + idx * 0.1);
        g.gain.setValueAtTime(0.15, t + idx * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.35);
        o.start(t + idx * 0.1);
        o.stop(t + idx * 0.1 + 0.35);
      });
    } else if (type === 'fall') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.4);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    }
  }

  setVehicle(vehicleId) {
    if (!VEHICLE_CONFIGS[vehicleId]) return;
    this.currentVehicle = vehicleId;
    this.playSound('engine');
    this.resetCar(false);

    // Update simulator HUD badge
    const badge = document.getElementById('simScoreBadge');
    if (badge) {
      const cfg = VEHICLE_CONFIGS[vehicleId];
      badge.innerHTML = `<span>${cfg.emoji} ${cfg.name}</span>`;
    }

    // Sync active chips in HUD if present
    document.querySelectorAll('.sim-vehicle-chip').forEach(chip => {
      if (chip.getAttribute('data-vehicle') === vehicleId) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  setVehicleColor(hexColor) {
    this.vehicleColor = hexColor;
  }

  setMagicInk(inkId) {
    if (!INK_CONFIGS[inkId]) return;
    this.magicInk = inkId;
    this.playSound('draw');

    // Sync active ink chips
    document.querySelectorAll('.sim-ink-chip').forEach(chip => {
      if (chip.getAttribute('data-ink') === inkId) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    const badge = document.getElementById('simScoreBadge');
    if (badge) {
      const ink = INK_CONFIGS[inkId];
      badge.innerHTML = `<span>${ink.emoji} ${ink.name}</span>`;
    }
  }

  initEvents() {
    // Resize handling
    window.addEventListener('resize', () => {
      if (this.canvas.parentElement) {
        this.width = this.canvas.width = this.canvas.parentElement.clientWidth || 320;
        this.height = this.canvas.height = this.canvas.parentElement.clientHeight || 560;
        this.finishPlatform.x = this.width - 85;
        this.stars[0].x = this.width * 0.35;
        this.stars[1].x = this.width * 0.50;
        this.stars[2].x = this.width * 0.65;
        this.coins[0].x = this.width * 0.26;
        this.coins[1].x = this.width * 0.50;
        this.coins[2].x = this.width * 0.74;
      }
    });

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (this.canvas.width / rect.width),
        y: (clientY - rect.top) * (this.canvas.height / rect.height)
      };
    };

    // v2.0 Dynamic Live Drawing: You can draw while the car is moving!
    const startDraw = (e) => {
      this.isDrawing = true;
      const pos = getPos(e);
      if (this.carState !== 'driving') {
        this.points = [pos];
        this.usedInk = 0;
        this.resetCar(false);
      } else {
        // Draw while driving on the fly!
        this.points.push(pos);
      }
      this.playSound('draw');
    };

    const drawMove = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      const last = this.points[this.points.length - 1];
      if (last) {
        const dist = Math.hypot(pos.x - last.x, pos.y - last.y);
        if (dist > 5 && this.usedInk + dist <= this.maxInk) {
          this.points.push(pos);
          this.usedInk += dist;
          this.updateInkUI();
          if (this.points.length % 4 === 0) this.playSound('draw');
        }
      }
    };

    const endDraw = () => {
      this.isDrawing = false;
      this.smoothPoints();
    };

    this.canvas.addEventListener('mousedown', startDraw);
    window.addEventListener('mousemove', drawMove);
    window.addEventListener('mouseup', endDraw);

    this.canvas.addEventListener('touchstart', startDraw, { passive: false });
    window.addEventListener('touchmove', drawMove, { passive: false });
    window.addEventListener('touchend', endDraw);

    // Drive Button
    const driveBtn = document.getElementById('btnCanvasDrive');
    if (driveBtn) {
      driveBtn.addEventListener('click', () => this.startDrive());
    }

    // Clear Button
    const clearBtn = document.getElementById('btnCanvasClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.points = [];
        this.usedInk = 0;
        this.updateInkUI();
        this.resetCar(true);
      });
    }

    // Demo Preset Button
    const presetBtn = document.getElementById('btnCanvasPreset');
    if (presetBtn) {
      presetBtn.addEventListener('click', () => this.drawPresetBridge());
    }

    // HUD Simulator Vehicle Chips (if present in DOM)
    document.querySelectorAll('.sim-vehicle-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const v = chip.getAttribute('data-vehicle');
        this.setVehicle(v);
      });
    });

    // HUD Simulator Ink Chips (if present in DOM)
    document.querySelectorAll('.sim-ink-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const ink = chip.getAttribute('data-ink');
        this.setMagicInk(ink);
      });
    });
  }

  drawPresetBridge() {
    this.points = [];
    this.usedInk = 0;
    const startX = 70;
    const startY = 370;
    const endX = this.width - 65;
    const endY = 370;

    for (let i = 0; i <= 25; i++) {
      const t = i / 25;
      const x = startX + (endX - startX) * t;
      // Arch curve
      const arch = Math.sin(t * Math.PI) * 55;
      const y = startY - arch;
      this.points.push({ x, y });
    }
    this.usedInk = 380;
    this.updateInkUI();
    this.resetCar(true);
  }

  smoothPoints() {
    if (this.points.length < 3) return;
    const smoothed = [this.points[0]];
    for (let i = 1; i < this.points.length - 1; i++) {
      smoothed.push({
        x: (this.points[i - 1].x + this.points[i].x + this.points[i + 1].x) / 3,
        y: (this.points[i - 1].y + this.points[i].y + this.points[i + 1].y) / 3
      });
    }
    smoothed.push(this.points[this.points.length - 1]);
    this.points = smoothed;
  }

  updateInkUI() {
    const inkFill = document.getElementById('simInkFill');
    if (inkFill) {
      const pct = Math.max(0, 100 - (this.usedInk / this.maxInk) * 100);
      inkFill.style.width = `${pct}%`;
    }
  }

  startDrive() {
    if (this.carState === 'driving') return;
    if (this.points.length < 2) {
      this.drawPresetBridge();
    }
    this.carState = 'driving';
    this.car.pathIndex = 0;
    this.car.x = 35;
    this.car.y = 358;
    this.car.angle = 0;
    const cfg = VEHICLE_CONFIGS[this.currentVehicle] || VEHICLE_CONFIGS.buggy;
    const ink = INK_CONFIGS[this.magicInk] || INK_CONFIGS.asphalt;
    this.car.vx = cfg.vx * ink.speedMult;
    this.car.vy = 0;
    this.car.boostTimer = 0;
    this.playSound('engine');
  }

  resetCar(resetCollectibles = true) {
    this.carState = 'idle';
    this.car.x = 35;
    this.car.y = 358;
    this.car.vx = 0;
    this.car.vy = 0;
    this.car.angle = 0;
    this.car.wheelRot = 0;
    this.car.wobbleOffset = 0;
    this.car.boostTimer = 0;
    this.particles = [];
    this.confetti = [];
    if (resetCollectibles) {
      this.stars.forEach(s => s.collected = false);
      this.coins.forEach(c => c.collected = false);
      this.collectedCoins = 0;
      this.updateCoinsHUD();
    }
  }

  updateCoinsHUD() {
    const coinEl = document.getElementById('simCoinCount');
    if (coinEl) {
      coinEl.textContent = `🪙 ${this.collectedCoins * 50}`;
    }
  }

  triggerVictory() {
    this.carState = 'won';
    this.playSound('victory');
    // Spawn confetti explosion
    for (let i = 0; i < 45; i++) {
      this.confetti.push({
        x: this.finishPlatform.x + 35,
        y: 330,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 8 - 3,
        color: ['#00f5d4', '#4ade80', '#ffd166', '#38b6ff', '#f97316', '#c084fc'][Math.floor(Math.random() * 6)],
        size: Math.random() * 6 + 4,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  update(dt) {
    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.04;
      p.size = Math.max(0, p.size - 0.2);
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // Update Confetti
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.2; // gravity
      c.rot += c.rotSpeed;
      if (c.y > this.height + 20) this.confetti.splice(i, 1);
    }

    // Rotate Coins
    this.coins.forEach(c => {
      c.rot = (c.rot || 0) + 0.05;
    });

    const cfg = VEHICLE_CONFIGS[this.currentVehicle] || VEHICLE_CONFIGS.buggy;
    const ink = INK_CONFIGS[this.magicInk] || INK_CONFIGS.asphalt;

    if (this.carState === 'driving') {
      this.car.wheelRot += 0.28;

      // Suspension wobble
      if (cfg.wobble) {
        this.car.wobbleOffset = Math.sin(performance.now() * 0.015) * 2.2;
      } else {
        this.car.wobbleOffset = 0;
      }

      // Exhaust particles
      if (Math.random() < 0.65) {
        let pColor = Math.random() > 0.5 ? '#f97316' : '#ffd166';
        if (this.currentVehicle === 'cyber') pColor = '#00f5d4';
        if (this.magicInk === 'boost') pColor = '#facc15';

        this.particles.push({
          x: this.car.x - Math.cos(this.car.angle) * 20,
          y: this.car.y + Math.sin(this.car.angle) * 20 + 5,
          vx: -Math.cos(this.car.angle) * 2.2 + (Math.random() - 0.5),
          vy: Math.sin(this.car.angle) * 2.2 + (Math.random() - 0.5),
          size: this.magicInk === 'boost' ? 7 : 5,
          alpha: 1,
          color: pColor
        });
      }

      // 1. On starting platform
      if (this.car.x < this.startPlatform.width) {
        this.car.x += cfg.vx * ink.speedMult;
        this.car.y = 358 + cfg.heightOffset;
        this.car.angle = 0;
      }
      // 2. Traversing bridge
      else if (this.car.x < this.finishPlatform.x) {
        const currentX = this.car.x + cfg.vx * ink.speedMult;
        let found = false;

        for (let i = 0; i < this.points.length - 1; i++) {
          const p1 = this.points[i];
          const p2 = this.points[i + 1];
          if (currentX >= Math.min(p1.x, p2.x) - 10 && currentX <= Math.max(p1.x, p2.x) + 10) {
            const ratio = (currentX - p1.x) / (p2.x - p1.x || 1);
            let targetY = p1.y + (p2.y - p1.y) * ratio - 14 + cfg.heightOffset + this.car.wobbleOffset;

            // Extra bounce if spring ink!
            if (this.magicInk === 'spring') {
              targetY -= Math.sin(currentX * 0.1) * 6;
            }

            const targetAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            this.car.x = currentX;
            this.car.y += (targetY - this.car.y) * 0.48;
            this.car.angle += (targetAngle - this.car.angle) * 0.35;
            found = true;
            break;
          }
        }

        if (!found) {
          // Freefall gravity
          this.car.vy += 0.38;
          this.car.x += cfg.vx * 0.8;
          this.car.y += this.car.vy;
          this.car.angle += 0.05;

          if (this.car.y > this.height + 40) {
            this.playSound('fall');
            this.carState = 'crashed';
            setTimeout(() => this.resetCar(false), 1200);
          }
        }
      }
      // 3. Reached finish platform
      else {
        this.car.x += cfg.vx * 0.9;
        this.car.y = 358 + cfg.heightOffset;
        this.car.angle = 0;

        if (this.car.x >= this.finishPlatform.x + 30) {
          this.triggerVictory();
        }
      }

      // Check Star Collisions
      this.stars.forEach(star => {
        if (!star.collected && Math.hypot(this.car.x - star.x, this.car.y - star.y) < 28) {
          star.collected = true;
          this.playSound('star');
          for (let s = 0; s < 12; s++) {
            this.particles.push({
              x: star.x,
              y: star.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              size: 4,
              alpha: 1,
              color: '#ffd166'
            });
          }
        }
      });

      // Check Coin Collisions
      this.coins.forEach(coin => {
        if (!coin.collected && Math.hypot(this.car.x - coin.x, this.car.y - coin.y) < 26) {
          coin.collected = true;
          this.collectedCoins += 1;
          this.playSound('coin');
          this.updateCoinsHUD();
          for (let s = 0; s < 14; s++) {
            this.particles.push({
              x: coin.x,
              y: coin.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              size: 4.5,
              alpha: 1,
              color: '#facc15'
            });
          }
        }
      });
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Sky & Clouds Background
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#0f2038');
    skyGrad.addColorStop(1, '#091220');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Drifting clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.beginPath();
    this.ctx.arc(60, 110, 45, 0, Math.PI * 2);
    this.ctx.arc(100, 100, 55, 0, Math.PI * 2);
    this.ctx.arc(140, 110, 40, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(this.width - 70, 180, 50, 0, Math.PI * 2);
    this.ctx.arc(this.width - 30, 170, 40, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Chasm Danger Bottom
    const hazardGrad = this.ctx.createLinearGradient(0, this.height - 40, 0, this.height);
    hazardGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    hazardGrad.addColorStop(1, 'rgba(239, 68, 68, 0.25)');
    this.ctx.fillStyle = hazardGrad;
    this.ctx.fillRect(0, this.height - 40, this.width, 40);

    // 3. Draw Platforms
    this.renderPlatform(this.startPlatform, 'start');
    this.renderPlatform(this.finishPlatform, 'finish');

    // 4. Draw Collectibles: Coins & Stars
    this.renderCoins();
    this.renderStars();

    // 5. Draw Hand-Drawn Glowing Bridge Path with Selected Magic Ink
    this.renderBridge();

    // 6. Draw Particles
    this.renderParticles();

    // 7. Draw Active Rig
    this.renderCar();

    // 8. Draw Victory Overlay
    if (this.carState === 'won') {
      this.renderVictoryOverlay();
    }
  }

  renderPlatform(p, type) {
    const ctx = this.ctx;
    const rockGrad = ctx.createLinearGradient(p.x, p.y, p.x, this.height);
    rockGrad.addColorStop(0, '#5a3d31');
    rockGrad.addColorStop(1, '#2c1810');
    ctx.fillStyle = rockGrad;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    ctx.fillStyle = '#00c896';
    ctx.fillRect(p.x, p.y, p.width, 14);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(p.x, p.y, p.width, 4);

    if (type === 'finish') {
      const fx = p.x + 35;
      const fy = p.y - 42;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(fx, fy, 4, 44);
      const sq = 5.5;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0f172a';
          ctx.fillRect(fx + 4 + c * sq, fy + r * sq, sq, sq);
        }
      }
    }
  }

  renderStars() {
    const ctx = this.ctx;
    const time = performance.now() * 0.003;

    this.stars.forEach(star => {
      if (star.collected) return;
      const bob = Math.sin(time + star.x) * 4;
      const x = star.x;
      const y = star.y + bob;

      ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outer = 11;
        const inner = 5;
        const a1 = (i * 72 - 90) * Math.PI / 180;
        const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
        ctx.lineTo(x + Math.cos(a1) * outer, y + Math.sin(a1) * outer);
        ctx.lineTo(x + Math.cos(a2) * inner, y + Math.sin(a2) * inner);
      }
      ctx.closePath();
      ctx.fill();
    });
  }

  renderCoins() {
    const ctx = this.ctx;
    const time = performance.now() * 0.003;

    this.coins.forEach(coin => {
      if (coin.collected) return;
      const bob = Math.cos(time + coin.x) * 3;
      const x = coin.x;
      const y = coin.y + bob;
      const rot = coin.rot || 0;
      const scaleX = Math.abs(Math.cos(rot));

      ctx.save();
      ctx.translate(x, y);

      // Gold Glow
      ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Coin Body
      ctx.scale(Math.max(scaleX, 0.15), 1);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Star emblem inside coin
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 7px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 0);

      ctx.restore();
    });
  }

  renderBridge() {
    if (this.points.length < 2) return;
    const ctx = this.ctx;
    const ink = INK_CONFIGS[this.magicInk] || INK_CONFIGS.asphalt;

    // Glowing Neon Outer Aura
    ctx.strokeStyle = ink.glow;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();

    // Bright Core Line
    ctx.strokeStyle = ink.color;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Center Thread
    ctx.strokeStyle = ink.core;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Extra decoration for Boost ink (directional nitro chevrons)
    if (this.magicInk === 'boost') {
      ctx.fillStyle = '#ffffff';
      for (let i = 1; i < this.points.length; i += 4) {
        const p = this.points[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderParticles() {
    const ctx = this.ctx;
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    this.confetti.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 1.5);
      ctx.restore();
    });
  }

  renderCar() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.car.x, this.car.y);
    ctx.rotate(this.car.angle);

    const color = this.vehicleColor || '#38b6ff';

    switch (this.currentVehicle) {
      case 'monster':
        this.renderMonsterTruck(ctx, color);
        break;
      case 'apex':
        this.renderApexTurbo(ctx, color);
        break;
      case 'camper':
        this.renderHippieCruiser(ctx, color);
        break;
      case 'cyber':
        this.renderCyberPulse(ctx, color);
        break;
      case 'buggy':
      default:
        this.renderSpeedyBuggy(ctx, color);
        break;
    }

    ctx.restore();
  }

  // Rig 1: Speedy Buggy
  renderSpeedyBuggy(ctx, color) {
    // Chassis
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-22, -10, 44, 20, [8, 8, 4, 4]);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-20, -12, 40, 18, [8, 8, 3, 3]);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.roundRect(-10, -21, 24, 13, [8, 8, 0, 0]);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, -15, 4, 0, Math.PI * 2);
    ctx.arc(10, -15, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(3, -15, 2, 0, Math.PI * 2);
    ctx.arc(11, -15, 2, 0, Math.PI * 2);
    ctx.fill();

    // Roof hat
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.roundRect(-7, -23, 18, 4, 2);
    ctx.fill();

    // Number 7
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('7', -10, -3);

    // Headlight
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(19, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    this.drawWheel(ctx, -13, 8, 7.5, color);
    this.drawWheel(ctx, 13, 8, 7.5, color);
  }

  // Rig 2: Mega Monster Truck
  renderMonsterTruck(ctx, color) {
    // Lifted suspension rods
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.lineTo(-14, 10);
    ctx.moveTo(14, -2);
    ctx.lineTo(14, 10);
    ctx.stroke();

    // Lifted Heavy Chassis
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-24, -18, 48, 18, [6, 8, 3, 3]);
    ctx.fill();

    // Cabin
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-14, -28, 26, 12, [6, 6, 0, 0]);
    ctx.fill();

    // Cabin Windows
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(-11, -26, 20, 8, 3);
    ctx.fill();

    // Roof Light Bar (3 Amber Lights)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(-6, -30, 2.5, 0, Math.PI * 2);
    ctx.arc(0, -30, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -30, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Front Grille & Bull Bar
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(21, -14, 4, 12);

    // Massive Knobby Tires
    this.drawMonsterWheel(ctx, -14, 10, 12.5, color);
    this.drawMonsterWheel(ctx, 14, 10, 12.5, color);
  }

  // Rig 3: Apex Turbo (Formula 1 Supercar)
  renderApexTurbo(ctx, color) {
    // Ultra-low chassis
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(26, 1);
    ctx.lineTo(8, -6);
    ctx.lineTo(-22, -6);
    ctx.lineTo(-26, 2);
    ctx.closePath();
    ctx.fill();

    // Front Wing
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, -1, 7, 3);

    // Cockpit & Helmet
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-4, -12, 14, 8, [6, 6, 2, 2]);
    ctx.fill();

    // Yellow Helmet
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(3, -9, 4, 0, Math.PI * 2);
    ctx.fill();

    // Rear High Downforce Spoiler
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-26, -16, 8, 4);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-22, -6);
    ctx.lineTo(-22, -12);
    ctx.stroke();

    // Racing Slicks
    this.drawWheel(ctx, -16, 4, 6.5, '#ef4444');
    this.drawWheel(ctx, 16, 4, 6.5, '#ef4444');
  }

  // Rig 4: Hippie Cruiser (Retro Camper Van)
  renderHippieCruiser(ctx, color) {
    // Two-tone Van Body
    ctx.fillStyle = '#f8fafc'; // Cream Top
    ctx.beginPath();
    ctx.roundRect(-22, -26, 44, 14, [10, 10, 0, 0]);
    ctx.fill();

    ctx.fillStyle = color; // Colored Bottom
    ctx.beginPath();
    ctx.roundRect(-22, -12, 44, 16, [0, 0, 4, 4]);
    ctx.fill();

    // Windows (Side & Front)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-16, -22, 12, 8);
    ctx.fillRect(0, -22, 14, 8);

    // Roof Luggage Rack
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-16, -29, 32, 4);

    // Spare Wheel on Back
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(-22, -7, 5, 0, Math.PI * 2);
    ctx.fill();

    // Headlight
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(21, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    this.drawWheel(ctx, -12, 7, 7.5, '#f8fafc');
    this.drawWheel(ctx, 13, 7, 7.5, '#f8fafc');
  }

  // Rig 5: Cyber Pulse (Polygon Hypercar)
  renderCyberPulse(ctx, color) {
    // Neon Cyan Underglow Beam
    ctx.fillStyle = 'rgba(0, 245, 212, 0.4)';
    ctx.fillRect(-22, 5, 44, 4);

    // Angular Polygon Chassis
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(12, -9);
    ctx.lineTo(-10, -9);
    ctx.lineTo(-24, -3);
    ctx.lineTo(-24, 4);
    ctx.lineTo(25, 4);
    ctx.closePath();
    ctx.fill();

    // Neon Accent Strakes
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(22, -2);
    ctx.lineTo(10, -7);
    ctx.lineTo(-8, -7);
    ctx.lineTo(-20, -3);
    ctx.stroke();

    // Cyber Visor Cockpit
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(2, -14);
    ctx.lineTo(-8, -12);
    ctx.lineTo(-6, -8);
    ctx.closePath();
    ctx.fill();

    // Geometric Wheels
    this.drawWheel(ctx, -14, 5, 7, color);
    this.drawWheel(ctx, 14, 5, 7, color);
  }

  drawWheel(ctx, wx, wy, radius, rimColor) {
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(this.car.wheelRot);

    // Tire
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Rim
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Accent Bolt
    ctx.fillStyle = rimColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawMonsterWheel(ctx, wx, wy, radius, accentColor) {
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(this.car.wheelRot);

    // Outer Knobby Tire with 8 rubber teeth
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Knobbies
    ctx.fillStyle = '#1e293b';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const kx = Math.cos(angle) * radius;
      const ky = Math.sin(angle) * radius;
      ctx.fillRect(kx - 2, ky - 2, 4, 4);
    }

    // Heavy Metal Rim
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
    ctx.fill();

    // Center Hub
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderVictoryOverlay() {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    const cardW = Math.min(this.width - 40, 270);
    const cardH = 220;
    const cardX = (this.width - cardW) / 2;
    const cardY = 150;

    // Victory Reward Card
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();

    // Top Green Banner
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(cardX + 20, cardY - 18, cardW - 40, 36, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', this.width / 2, cardY + 6);

    // 3 Golden Stars
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 26px Fredoka, sans-serif';
    ctx.fillText('★ ★ ★', this.width / 2, cardY + 54);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Fredoka, sans-serif';
    ctx.fillText('Level 1 Cleared!', this.width / 2, cardY + 84);

    // v2.0 Coins Earned Reward Banner
    const coinsEarned = 150 + this.collectedCoins * 50;
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 13px Fredoka, sans-serif';
    ctx.fillText(`+${coinsEarned} Gold Coins Earned! 🪙`, this.width / 2, cardY + 110);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Outfit, sans-serif';
    ctx.fillText('Ink Efficiency: 92% • 5-Streak Active', this.width / 2, cardY + 130);

    // Replay Button
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.roundRect(cardX + 20, cardY + 155, (cardW - 55) / 2, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Fredoka, sans-serif';
    ctx.fillText('🔄 Replay', cardX + 20 + (cardW - 55) / 4, cardY + 177);

    // Next Level Button
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(cardX + 35 + (cardW - 55) / 2, cardY + 155, (cardW - 55) / 2, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Next ➔', cardX + 35 + (cardW - 55) / 2 + (cardW - 55) / 4, cardY + 177);

    ctx.restore();
  }

  loop(timestamp) {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  }
}

// Global Export
window.CarRushSimulator = CarRushSimulator;
window.VEHICLE_CONFIGS = VEHICLE_CONFIGS;
window.INK_CONFIGS = INK_CONFIGS;
