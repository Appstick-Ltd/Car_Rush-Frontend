/**
 * Car Rush: Interactive Playable Canvas Physics Simulator
 * Replicates the "Draw & Drive" gameplay directly inside the web browser!
 */

class CarRushSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Canvas scaling
    this.width = this.canvas.width = this.canvas.parentElement.clientWidth || 320;
    this.height = this.canvas.height = this.canvas.parentElement.clientHeight || 560;

    // Game state
    this.isDrawing = false;
    this.points = [];
    this.carState = 'idle'; // 'idle', 'driving', 'won', 'crashed'
    this.soundEnabled = true;

    // Ink management
    this.maxInk = 1200;
    this.usedInk = 0;

    // Physics & Car Properties
    this.startPlatform = { x: 0, y: 380, width: 85, height: 180 };
    this.finishPlatform = { x: this.width - 85, y: 380, width: 85, height: 180 };

    this.car = {
      x: 35,
      y: 358,
      vx: 0,
      vy: 0,
      width: 44,
      height: 26,
      angle: 0,
      wheelRot: 0,
      pathIndex: 0
    };

    // Particles (exhaust flames, victory stars)
    this.particles = [];
    this.confetti = [];

    // Stars to collect
    this.stars = [
      { x: this.width * 0.35, y: 310, collected: false },
      { x: this.width * 0.50, y: 280, collected: false },
      { x: this.width * 0.65, y: 310, collected: false }
    ];

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
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.05);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (type === 'engine') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.3);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === 'star') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880, t + 0.08); // A5
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
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

    const startDraw = (e) => {
      if (this.carState === 'driving') return;
      this.isDrawing = true;
      this.points = [];
      this.usedInk = 0;
      this.resetCar(false);
      const pos = getPos(e);
      this.points.push(pos);
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
      // Gentle arch curve
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
    this.car.vx = 2.4;
    this.car.vy = 0;
    this.playSound('engine');
  }

  resetCar(resetStars = true) {
    this.carState = 'idle';
    this.car.x = 35;
    this.car.y = 358;
    this.car.vx = 0;
    this.car.vy = 0;
    this.car.angle = 0;
    this.car.wheelRot = 0;
    this.particles = [];
    this.confetti = [];
    if (resetStars) {
      this.stars.forEach(s => s.collected = false);
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
        color: ['#00f5d4', '#4ade80', '#ffd166', '#38b6ff', '#f97316'][Math.floor(Math.random() * 5)],
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

    if (this.carState === 'driving') {
      this.car.wheelRot += 0.25;

      // Spawn exhaust fire particle
      if (Math.random() < 0.6) {
        this.particles.push({
          x: this.car.x - Math.cos(this.car.angle) * 18,
          y: this.car.y + Math.sin(this.car.angle) * 18 + 5,
          vx: -Math.cos(this.car.angle) * 2 + (Math.random() - 0.5),
          vy: Math.sin(this.car.angle) * 2 + (Math.random() - 0.5),
          size: 5,
          alpha: 1,
          color: Math.random() > 0.5 ? '#f97316' : '#ffd166'
        });
      }

      // 1. On starting platform
      if (this.car.x < this.startPlatform.width) {
        this.car.x += 2.8;
        this.car.y = 358;
        this.car.angle = 0;
      }
      // 2. Travesing user's drawn bridge
      else if (this.car.x < this.finishPlatform.x) {
        // Find nearest line segment in path
        const currentX = this.car.x + 3.0;
        let found = false;

        for (let i = 0; i < this.points.length - 1; i++) {
          const p1 = this.points[i];
          const p2 = this.points[i + 1];
          if (currentX >= Math.min(p1.x, p2.x) - 10 && currentX <= Math.max(p1.x, p2.x) + 10) {
            // Interpolate target Y
            const ratio = (currentX - p1.x) / (p2.x - p1.x || 1);
            const targetY = p1.y + (p2.y - p1.y) * ratio - 14;
            const targetAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            this.car.x = currentX;
            this.car.y += (targetY - this.car.y) * 0.45;
            this.car.angle += (targetAngle - this.car.angle) * 0.3;
            found = true;
            break;
          }
        }

        if (!found) {
          // If no line under wheels, simulate freefall gravity
          this.car.vy += 0.35;
          this.car.x += 2.0;
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
        this.car.x += 2.5;
        this.car.y = 358;
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
          // Mini sparkle burst
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

    // Subtle drifting background clouds
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

    // 2. Chasm Danger Bottom (Hazard Glow)
    const hazardGrad = this.ctx.createLinearGradient(0, this.height - 40, 0, this.height);
    hazardGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    hazardGrad.addColorStop(1, 'rgba(239, 68, 68, 0.25)');
    this.ctx.fillStyle = hazardGrad;
    this.ctx.fillRect(0, this.height - 40, this.width, 40);

    // 3. Draw Platforms (Cliff edges)
    this.renderPlatform(this.startPlatform, 'start');
    this.renderPlatform(this.finishPlatform, 'finish');

    // 4. Draw Collectible Stars
    this.renderStars();

    // 5. Draw Hand-Drawn Glowing Bridge Path
    this.renderBridge();

    // 6. Draw Particles (Fire & Confetti)
    this.renderParticles();

    // 7. Draw Cute Blue Toy Car
    this.renderCar();

    // 8. Draw Finish Banner / Victory Message
    if (this.carState === 'won') {
      this.renderVictoryOverlay();
    }
  }

  renderPlatform(p, type) {
    const ctx = this.ctx;
    // Rock body
    const rockGrad = ctx.createLinearGradient(p.x, p.y, p.x, this.height);
    rockGrad.addColorStop(0, '#5a3d31');
    rockGrad.addColorStop(1, '#2c1810');
    ctx.fillStyle = rockGrad;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    // Vibrant Grass layer on top
    ctx.fillStyle = '#00c896';
    ctx.fillRect(p.x, p.y, p.width, 14);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(p.x, p.y, p.width, 4);

    // If finish platform, draw Checkered Finish Flag
    if (type === 'finish') {
      const fx = p.x + 35;
      const fy = p.y - 42;
      // Pole
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(fx, fy, 4, 44);
      // Checkered Flag
      const flagW = 32;
      const flagH = 22;
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

      // Glow halo
      ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();

      // Star shape
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

  renderBridge() {
    if (this.points.length < 2) return;
    const ctx = this.ctx;

    // Glowing Neon Outer Aura
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();

    // Neon Bright Core Line
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();

    // Highlight Center Thread
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  renderParticles() {
    const ctx = this.ctx;
    // Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Confetti
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

    // Car Body (Cute Blue Toy Car #7)
    // Main Chassis
    ctx.fillStyle = '#0072c6';
    ctx.beginPath();
    ctx.roundRect(-22, -10, 44, 20, [8, 8, 4, 4]);
    ctx.fill();

    ctx.fillStyle = '#38b6ff';
    ctx.beginPath();
    ctx.roundRect(-20, -12, 40, 18, [8, 8, 3, 3]);
    ctx.fill();

    // Cabin Dome / Windshield
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.roundRect(-10, -21, 24, 13, [8, 8, 0, 0]);
    ctx.fill();

    // Big expressive cartoon eyes on windshield!
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, -15, 4, 0, Math.PI * 2);
    ctx.arc(10, -15, 4, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(3, -15, 2, 0, Math.PI * 2);
    ctx.arc(11, -15, 2, 0, Math.PI * 2);
    ctx.fill();

    // Yellow Roof Hat
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.roundRect(-7, -23, 18, 4, 2);
    ctx.fill();

    // White Racing Stripe & Number 7
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

    // Wheels (Front & Back)
    const drawWheel = (wx, wy) => {
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(this.car.wheelRot);

      // Tire
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Rim
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Bolt
      ctx.fillStyle = '#38b6ff';
      ctx.beginPath();
      ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawWheel(-13, 8);
    drawWheel(13, 8);

    ctx.restore();
  }

  renderVictoryOverlay() {
    const ctx = this.ctx;
    ctx.save();

    // Translucent Dark Screen Dim
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, this.width, this.height);

    const cardW = Math.min(this.width - 40, 260);
    const cardH = 200;
    const cardX = (this.width - cardW) / 2;
    const cardY = 160;

    // Victory Reward Card
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.stroke();

    // Top Green Victory Banner
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(cardX + 20, cardY - 18, cardW - 40, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', this.width / 2, cardY + 6);

    // 3 Golden Stars
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 28px Fredoka, sans-serif';
    ctx.fillText('★ ★ ★', this.width / 2, cardY + 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Fredoka, sans-serif';
    ctx.fillText('Level 1 Cleared!', this.width / 2, cardY + 95);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Outfit, sans-serif';
    ctx.fillText('Ink Efficiency: 88% (3 Stars)', this.width / 2, cardY + 118);

    // Action Replay / Next Buttons
    // Replay
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.roundRect(cardX + 20, cardY + 140, (cardW - 55) / 2, 36, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Fredoka, sans-serif';
    ctx.fillText('🔄 Replay', cardX + 20 + (cardW - 55) / 4, cardY + 162);

    // Next
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(cardX + 35 + (cardW - 55) / 2, cardY + 140, (cardW - 55) / 2, 36, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Next ➔', cardX + 35 + (cardW - 55) / 2 + (cardW - 55) / 4, cardY + 162);

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

// Export for app.js
window.CarRushSimulator = CarRushSimulator;
