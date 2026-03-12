/**
 * GreenMind — AI Green Computing Dashboard
 * script.js
 *
 * Modules:
 *  1. Particle System       — Animated background particles
 *  2. AI Carbon Analyzer    — Code analysis & scoring
 *  3. Live Energy Monitor   — Real-time simulated chart
 *  4. Eco Mode Toggle       — Reduce-motion / power-save feature
 *  5. Sustainability Carousel — Rotating AI-generated tips
 *  6. Counter Animations    — Animated numeric stats
 */

'use strict';

/* ═══════════════════════════════════════════════════
   1. PARTICLE SYSTEM
   Injects floating micro-dots into the background.
═══════════════════════════════════════════════════ */
(function initParticles() {
  const bgLayer = document.querySelector('.bg-layer');
  if (!bgLayer) return;

  const PARTICLE_COUNT = 18;
  const COLORS = [
    'rgba(143, 206, 106, 0.5)',
    'rgba(62, 207, 173, 0.4)',
    'rgba(122, 180, 138, 0.45)',
    'rgba(168, 213, 181, 0.35)',
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    const size   = Math.random() * 5 + 2;            // 2–7 px
    const left   = Math.random() * 100;               // 0–100%
    const delay  = Math.random() * 15;                // stagger start
    const dur    = Math.random() * 12 + 8;            // 8–20s
    const color  = COLORS[Math.floor(Math.random() * COLORS.length)];

    p.style.cssText = `
      width:${size}px;
      height:${size}px;
      left:${left}%;
      bottom:-10px;
      background:${color};
      animation-delay:${delay}s;
      animation-duration:${dur}s;
    `;

    bgLayer.appendChild(p);
  }
})();


/* ═══════════════════════════════════════════════════
   2. AI CARBON ANALYZER
   Analyzes code heuristics to produce a 0-100
   "Carbon Efficiency Score" and AI suggestions.
═══════════════════════════════════════════════════ */
(function initAnalyzer() {
  const codeInput      = document.getElementById('codeInput');
  const analyzeBtn     = document.getElementById('analyzeBtn');
  const clearBtn       = document.getElementById('clearBtn');
  const analyzeBtnText = document.getElementById('analyzeBtnText');
  const analyzeSpinner = document.getElementById('analyzeSpinner');
  const scoreDisplay   = document.getElementById('scoreDisplay');
  const scoreValue     = document.getElementById('scoreValue');
  const scoreGrade     = document.getElementById('scoreGrade');
  const scoreBar       = document.getElementById('scoreBar');
  const scoreBarTrack  = document.getElementById('scoreBarTrack');
  const suggestionsList = document.getElementById('suggestionsList');

  if (!analyzeBtn) return;

  /* --- Heuristic rule definitions ---
     Each rule deducts or adds penalty points to the carbon score.
     Pattern: regex that matches inefficient code patterns.
  */
  const RULES = [
    {
      id: 'nested-loops',
      pattern: /for\s*\(.*\)\s*\{[\s\S]*?for\s*\(/g,
      penalty: 18,
      icon: '🔄',
      message: 'Minimize nested loops — O(n²) complexity dramatically increases CPU cycles and energy draw.',
    },
    {
      id: 'sync-xhr',
      pattern: /XMLHttpRequest|new\s+XHR|\.open\s*\(\s*['"]GET['"],/g,
      penalty: 12,
      icon: '📡',
      message: 'Replace synchronous XHR with async/await fetch() — blocking I/O wastes CPU idle time.',
    },
    {
      id: 'console-spam',
      pattern: /console\.(log|warn|error|info)\s*\(/g,
      penalty: 5,
      icon: '📝',
      message: 'Remove or gate console statements in production — I/O operations consume measurable energy at scale.',
    },
    {
      id: 'large-timers',
      pattern: /setInterval\s*\(|setTimeout\s*\(/g,
      penalty: 8,
      icon: '⏱️',
      message: 'Debounce or batch timer callbacks — frequent polling keeps the CPU awake and increases watt-hours.',
    },
    {
      id: 'dom-thrash',
      pattern: /document\.(querySelector|getElementById|getElementsBy)\s*\([^)]+\)\s*;[\s\S]{0,60}(style|classList|innerHTML)/g,
      penalty: 10,
      icon: '🖼️',
      message: 'Cache DOM references outside loops — repeated queries trigger layout recalculations and raise GPU load.',
    },
    {
      id: 'global-vars',
      pattern: /^var\s+/gm,
      penalty: 7,
      icon: '🌐',
      message: 'Prefer const/let over var — global scope leaks persist in memory longer, increasing heap pressure.',
    },
    {
      id: 'eval-usage',
      pattern: /\beval\s*\(/g,
      penalty: 20,
      icon: '☠️',
      message: 'Avoid eval() — it disables JIT compilation, forcing the engine into an energy-intensive interpreter mode.',
    },
    {
      id: 'long-functions',
      pattern: /function[\s\S]{800,}/g,
      penalty: 8,
      icon: '📏',
      message: 'Split monolithic functions — smaller, pure functions are easier for the JIT compiler to optimize.',
    },
    {
      id: 'deep-nesting',
      pattern: /\{[^{}]*\{[^{}]*\{[^{}]*\{/g,
      penalty: 12,
      icon: '🪆',
      message: 'Flatten deeply nested blocks using early returns — reduces stack depth and improves branch prediction.',
    },
    {
      id: 'string-concat',
      pattern: /\+=\s*['"]/g,
      penalty: 6,
      icon: '🔗',
      message: 'Use template literals or Array.join() instead of string concatenation — fewer object allocations, less GC pressure.',
    },
    {
      id: 'missing-async',
      pattern: /\.then\s*\([\s\S]*?\)\.catch/g,
      penalty: 4,
      icon: '⚡',
      message: 'Migrate .then/.catch chains to async/await — cleaner control flow reduces accidental microtask proliferation.',
    },
  ];

  /* Bonus rules that improve the score */
  const BONUSES = [
    { pattern: /const\s+/g,             bonus: 5,  label: 'Uses const declarations' },
    { pattern: /requestAnimationFrame/g, bonus: 8,  label: 'Uses rAF for rendering' },
    { pattern: /worker\s*=|new\s+Worker/gi, bonus: 10, label: 'Offloads work to Web Workers' },
    { pattern: /\bPromise\.all\b/g,      bonus: 6,  label: 'Batches async operations' },
    { pattern: /IntersectionObserver/g,  bonus: 7,  label: 'Uses lazy rendering' },
    { pattern: /\/\/\s*@optimize/gi,     bonus: 5,  label: 'Annotated optimization hints' },
  ];

  /** Grade a numeric score 0-100 */
  function getGrade(score) {
    if (score >= 85) return { grade: 'A+', cls: 'score-excellent', barCls: 'bar-excellent' };
    if (score >= 70) return { grade: 'B',  cls: 'score-good',      barCls: 'bar-good'      };
    if (score >= 50) return { grade: 'C',  cls: 'score-warn',      barCls: 'bar-warn'      };
    return            { grade: 'D',  cls: 'score-bad',       barCls: 'bar-bad'       };
  }

  /** Core analysis function */
  function analyzeCode(code) {
    let totalPenalty = 0;
    let totalBonus   = 0;
    const hits       = [];   // triggered suggestions

    if (!code.trim()) {
      return { score: null, suggestions: [], error: 'Please paste some code first.' };
    }

    // Apply penalty rules
    RULES.forEach(rule => {
      const matches = code.match(rule.pattern);
      if (matches && matches.length > 0) {
        // Scale penalty by frequency (capped)
        const scale   = Math.min(matches.length, 3);
        const penalty = rule.penalty * (1 + (scale - 1) * 0.4);
        totalPenalty += penalty;
        hits.push({ icon: rule.icon, message: rule.message, severity: rule.penalty });
      }
    });

    // Apply bonus modifiers
    BONUSES.forEach(b => {
      if (b.pattern.test(code)) {
        totalBonus += b.bonus;
      }
    });

    // Base score: lines of code factor
    const lines       = code.split('\n').filter(l => l.trim()).length;
    const complexity  = Math.min(lines / 10, 10);    // 0–10
    const baseScore   = Math.max(0, 100 - totalPenalty - complexity + totalBonus);
    const score       = Math.round(Math.min(100, Math.max(0, baseScore)));

    // Sort suggestions by severity descending
    hits.sort((a, b) => b.severity - a.severity);

    // If no issues found, add a positive note
    if (hits.length === 0) {
      hits.push({
        icon: '✅',
        message: 'No common anti-patterns detected. Consider profiling with browser DevTools to identify runtime hotspots.',
        severity: 0,
      });
    }

    return { score, suggestions: hits, error: null };
  }

  /** Animate the score number counting up */
  function animateCount(el, from, to, duration = 1000) {
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);   // ease-out cubic
      el.textContent = Math.round(from + (to - from) * eased) + '/100';
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /** Render analysis results to the DOM */
  function renderResults(result) {
    if (result.error) {
      scoreDisplay.classList.remove('visible');
      alert(result.error);
      return;
    }

    const { score, suggestions } = result;
    const { grade, cls, barCls }  = getGrade(score);

    // Score value + grade
    scoreValue.className = `score-value ${cls}`;
    scoreGrade.className = `score-value ${cls}`;
    scoreGrade.textContent = grade;

    // Animate count
    animateCount(scoreValue, 0, score, 1200);

    // Animate bar
    scoreBar.className = `score-bar-fill ${barCls}`;
    scoreBarTrack.setAttribute('aria-valuenow', score);
    requestAnimationFrame(() => {
      scoreBar.style.width = '0%';
      requestAnimationFrame(() => {
        scoreBar.style.width = score + '%';
      });
    });

    // Render suggestions
    suggestionsList.innerHTML = '';
    suggestions.slice(0, 5).forEach((s, i) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.style.animationDelay = `${i * 0.08}s`;
      item.innerHTML = `
        <span class="suggestion-icon" aria-hidden="true">${s.icon}</span>
        <span>${s.message}</span>
      `;
      suggestionsList.appendChild(item);
    });

    // Show result panel
    scoreDisplay.classList.add('visible');

    // Increment hero analyses counter
    incrementAnalysesCounter();
  }

  /** Simulates async AI analysis with a loading delay */
  function runAnalysis() {
    const code = codeInput.value;

    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtn.setAttribute('aria-busy', 'true');
    analyzeBtnText.textContent = 'Analyzing…';
    analyzeSpinner.classList.add('visible');

    // Simulate AI processing latency (800–1500ms)
    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      const result = analyzeCode(code);
      renderResults(result);

      // Reset button state
      analyzeBtn.disabled = false;
      analyzeBtn.setAttribute('aria-busy', 'false');
      analyzeBtnText.textContent = 'Analyze Carbon Impact';
      analyzeSpinner.classList.remove('visible');
    }, delay);
  }

  // Event listeners
  analyzeBtn.addEventListener('click', runAnalysis);

  clearBtn.addEventListener('click', () => {
    codeInput.value = '';
    scoreDisplay.classList.remove('visible');
    codeInput.focus();
  });

  // Allow Ctrl+Enter to run analysis
  codeInput.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runAnalysis();
  });

  /** Counter for hero stat — analyses run this session */
  let analysesCount = 0;
  function incrementAnalysesCounter() {
    analysesCount++;
    const el = document.getElementById('heroStatAnalyses');
    if (el) el.textContent = analysesCount;
  }
})();


/* ═══════════════════════════════════════════════════
   3. LIVE ENERGY MONITOR
   Draws a custom canvas line chart with simulated
   real-time data center efficiency data.
═══════════════════════════════════════════════════ */
(function initEnergyMonitor() {
  const canvas = document.getElementById('energyChart');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  const metricPUE   = document.getElementById('metricPUE');
  const metricCPU   = document.getElementById('metricCPU');
  const metricRenew = document.getElementById('metricRenew');

  // Data buffer — last 40 data points
  const MAX_POINTS = 40;
  const dataEff    = [];   // 0–100 efficiency
  const dataCPU    = [];   // 0–100 cpu load
  const dataRenew  = [];   // 0–100 renewable %

  // Seed initial data
  for (let i = 0; i < MAX_POINTS; i++) {
    dataEff.push(68 + Math.random() * 20);
    dataCPU.push(55 + Math.random() * 30);
    dataRenew.push(75 + Math.random() * 15);
  }

  /** Simulate next data point with smooth random walk */
  function nextVal(current, min, max, volatility = 3) {
    const delta = (Math.random() - 0.5) * volatility * 2;
    return Math.max(min, Math.min(max, current + delta));
  }

  /** Resize canvas to match CSS size */
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  /** Draw a single data series as a smooth line */
  function drawLine(data, color, fillColor, cssWidth, cssHeight) {
    const step = cssWidth / (data.length - 1);

    ctx.beginPath();
    data.forEach((val, i) => {
      const x = i * step;
      const y = cssHeight - (val / 100) * cssHeight;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });

    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    ctx.stroke();

    // Fill under the line
    ctx.lineTo(cssWidth, cssHeight);
    ctx.lineTo(0, cssHeight);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  /** Draw grid lines */
  function drawGrid(cssWidth, cssHeight) {
    ctx.strokeStyle = 'rgba(74, 92, 82, 0.3)';
    ctx.lineWidth   = 1;

    // Horizontal grid lines at 25%, 50%, 75%
    [0.25, 0.5, 0.75].forEach(pct => {
      const y = cssHeight * (1 - pct);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cssWidth, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle   = 'rgba(122, 180, 138, 0.6)';
      ctx.font        = '10px DM Mono, monospace';
      ctx.fillText(`${Math.round(pct * 100)}%`, 4, y - 4);
    });
  }

  /** Main render function */
  function render() {
    const cssWidth  = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(cssWidth, cssHeight);

    // Draw renewable (background)
    drawLine(
      dataRenew,
      'rgba(62, 207, 173, 0.7)',
      'rgba(62, 207, 173, 0.06)',
      cssWidth, cssHeight
    );

    // Draw CPU load
    drawLine(
      dataCPU,
      'rgba(232, 197, 106, 0.6)',
      'rgba(232, 197, 106, 0.04)',
      cssWidth, cssHeight
    );

    // Draw efficiency (top layer)
    drawLine(
      dataEff,
      'rgba(143, 206, 106, 0.9)',
      'rgba(143, 206, 106, 0.12)',
      cssWidth, cssHeight
    );

    // Legend
    const legendY = 14;
    const items = [
      { color: '#8fce6a', label: 'Efficiency' },
      { color: '#e8c56a', label: 'CPU Load' },
      { color: '#3ecfad', label: 'Renewable' },
    ];
    items.forEach((item, i) => {
      const x = 16 + i * 90;
      ctx.fillStyle = item.color;
      ctx.fillRect(x, legendY - 6, 12, 3);
      ctx.fillStyle = 'rgba(244, 249, 246, 0.6)';
      ctx.font = '9px DM Mono, monospace';
      ctx.fillText(item.label, x + 16, legendY);
    });
  }

  /** Update metrics display */
  function updateMetrics() {
    const lastEff   = dataEff[dataEff.length - 1];
    const lastCPU   = dataCPU[dataCPU.length - 1];
    const lastRenew = dataRenew[dataRenew.length - 1];

    // PUE: Power Usage Effectiveness — lower is better (ideal ~1.0)
    const pue = (1 + (1 - lastEff / 100) * 0.6).toFixed(2);
    if (metricPUE)   metricPUE.textContent   = pue;
    if (metricCPU)   metricCPU.textContent   = Math.round(lastCPU) + '%';
    if (metricRenew) metricRenew.textContent = Math.round(lastRenew) + '%';
  }

  /** Tick: add new data point and re-render */
  function tick() {
    // Push new values
    dataEff.push(nextVal(dataEff[dataEff.length - 1], 50, 98, 2.5));
    dataCPU.push(nextVal(dataCPU[dataCPU.length - 1], 30, 95, 4));
    dataRenew.push(nextVal(dataRenew[dataRenew.length - 1], 60, 100, 1.5));

    // Trim to max buffer
    if (dataEff.length   > MAX_POINTS) dataEff.shift();
    if (dataCPU.length   > MAX_POINTS) dataCPU.shift();
    if (dataRenew.length > MAX_POINTS) dataRenew.shift();

    render();
    updateMetrics();
  }

  // Initialise
  resizeCanvas();
  render();
  updateMetrics();

  // Update every 1.5 seconds
  setInterval(tick, 1500);

  // Handle resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
      render();
    }, 150);
  });
})();


/* ═══════════════════════════════════════════════════
   4. ECO MODE TOGGLE
   Syncs multiple toggle inputs and applies body class.
   Also tracks simulated energy savings.
═══════════════════════════════════════════════════ */
(function initEcoMode() {
  const toggleMain  = document.getElementById('ecoToggleMain');
  const togglePanel = document.getElementById('ecoTogglePanel');
  const savingsNum  = document.getElementById('savingsNum');
  const checks      = [
    document.getElementById('check1'),
    document.getElementById('check2'),
    document.getElementById('check3'),
    document.getElementById('check4'),
  ];

  if (!toggleMain) return;

  let isEcoActive    = false;
  let savingsWh      = 0;
  let savingsTimer   = null;

  /** Apply eco state to both toggles and body */
  function applyEcoMode(active) {
    isEcoActive = active;
    document.body.classList.toggle('eco-mode', active);

    // Sync both checkboxes
    [toggleMain, togglePanel].forEach(t => {
      if (t) {
        t.checked = active;
        t.setAttribute('aria-checked', String(active));
      }
    });

    // Update check icons in panel
    const icon = active ? '✓' : '○';
    checks.forEach(c => {
      if (c) c.textContent = icon;
    });

    // Start/stop energy savings counter
    if (active) {
      savingsTimer = setInterval(() => {
        savingsWh += 0.14 + Math.random() * 0.08;   // ~0.14–0.22 Wh/sec simulated
        if (savingsNum) {
          savingsNum.textContent = savingsWh < 1
            ? (savingsWh * 1000).toFixed(0) + ' mWh'
            : savingsWh.toFixed(2) + ' Wh';
        }
      }, 1000);
    } else {
      clearInterval(savingsTimer);
    }
  }

  // Sync panel toggle to main, and vice versa
  if (toggleMain)  toggleMain.addEventListener('change',  () => applyEcoMode(toggleMain.checked));
  if (togglePanel) togglePanel.addEventListener('change', () => applyEcoMode(togglePanel.checked));

  // Keyboard accessibility — space/enter on label areas
  document.querySelectorAll('.eco-toggle-nav').forEach(label => {
    label.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        applyEcoMode(!isEcoActive);
      }
    });
  });
})();


/* ═══════════════════════════════════════════════════
   5. SUSTAINABILITY TIPS CAROUSEL
   Auto-advances every 7 seconds. Supports keyboard
   and click navigation.
═══════════════════════════════════════════════════ */
(function initCarousel() {
  const track    = document.getElementById('carouselTrack');
  const dotsEl   = document.getElementById('carouselDots');
  const prevBtn  = document.getElementById('prevBtn');
  const nextBtn  = document.getElementById('nextBtn');

  if (!track) return;

  /** AI-generated sustainability tips data */
  const TIPS = [
    {
      category: 'Algorithm Design',
      headline: 'Choose the right algorithm first.',
      body: 'Algorithmic efficiency dwarfs hardware optimizations. Upgrading from O(n²) to O(n log n) sorting on 10,000 records reduces operations from 100 million to ~130,000 — saving more energy than any hardware upgrade can provide.',
      impact: 'Up to 99.9% fewer CPU cycles',
      icon: '🧮',
    },
    {
      category: 'Network Efficiency',
      headline: 'Every byte transferred burns energy.',
      body: 'HTTP/2 multiplexing, Brotli compression, and aggressive caching can cut network payloads by 60–80%. Data centers consume ~200 TWh annually — reducing data transfer is one of the highest-leverage green software actions.',
      impact: '60–80% bandwidth reduction',
      icon: '📶',
    },
    {
      category: 'Memory Management',
      headline: 'Garbage collection is an energy tax.',
      body: 'Excessive object allocation triggers frequent GC pauses, which spike CPU usage. Use object pooling, prefer stack allocations, and reuse arrays with .length = 0 rather than creating new ones in hot paths.',
      impact: 'Reduce GC pauses by ~40%',
      icon: '♻️',
    },
    {
      category: 'Rendering Strategy',
      headline: 'Paint less, save more.',
      body: 'Avoid layout thrash by batching DOM reads before writes. Use CSS transforms over position changes (GPU vs CPU rendering). Virtualise long lists — rendering 50 rows instead of 10,000 cuts GPU watt-hours proportionally.',
      impact: '70% lower GPU utilization',
      icon: '🎨',
    },
    {
      category: 'Cloud Architecture',
      headline: 'Serverless is not always greener.',
      body: 'Cold starts waste energy. For predictable loads, right-sized containerized services beat serverless. For bursty traffic, serverless wins. Always measure: use cloud carbon footprint APIs to quantify architectural choices.',
      impact: 'Match architecture to workload',
      icon: '☁️',
    },
    {
      category: 'Data Storage',
      headline: 'Dark data has a real carbon cost.',
      body: 'Unused data sitting in cloud storage still consumes energy for replication and availability. Implement data lifecycle policies — archive after 30 days, delete after 2 years. Data minimisation is both a privacy and green imperative.',
      impact: '30% storage energy savings',
      icon: '🗄️',
    },
  ];

  let currentSlide    = 0;
  let autoPlayTimer   = null;
  const AUTOPLAY_DELAY = 7000;

  /** Build all slide elements */
  function buildSlides() {
    track.innerHTML = '';
    TIPS.forEach(tip => {
      const slide = document.createElement('div');
      slide.className = 'tip-slide';
      slide.setAttribute('role', 'tabpanel');
      slide.innerHTML = `
        <div class="tip-category">${tip.icon} ${tip.category}</div>
        <div class="tip-headline">${tip.headline}</div>
        <p class="tip-body">${tip.body}</p>
        <div class="tip-meta">
          <span>⚡ Impact:</span>
          <span style="color: var(--accent-lime);">${tip.impact}</span>
        </div>
      `;
      track.appendChild(slide);
    });
  }

  /** Build navigation dots */
  function buildDots() {
    dotsEl.innerHTML = '';
    TIPS.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to tip ${i + 1}`);
      dot.setAttribute('aria-selected', String(i === 0));
      dot.addEventListener('click', () => goToSlide(i));
      dotsEl.appendChild(dot);
    });
  }

  /** Navigate to a specific slide */
  function goToSlide(index) {
    currentSlide = (index + TIPS.length) % TIPS.length;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    // Update dots
    dotsEl.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
      dot.setAttribute('aria-selected', String(i === currentSlide));
    });

    // Update aria-live region
    track.setAttribute('aria-label', `Tip ${currentSlide + 1} of ${TIPS.length}: ${TIPS[currentSlide].headline}`);

    resetAutoPlay();
  }

  /** Start/reset auto-advance timer */
  function resetAutoPlay() {
    clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(() => goToSlide(currentSlide + 1), AUTOPLAY_DELAY);
  }

  // Init
  buildSlides();
  buildDots();
  resetAutoPlay();

  // Arrow controls
  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

  // Keyboard navigation on carousel section
  const carouselSection = document.getElementById('tips');
  if (carouselSection) {
    carouselSection.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  goToSlide(currentSlide - 1);
      if (e.key === 'ArrowRight') goToSlide(currentSlide + 1);
    });
  }

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoPlayTimer));
  track.addEventListener('mouseleave', resetAutoPlay);
})();


/* ═══════════════════════════════════════════════════
   6. COUNTER ANIMATIONS
   Animates hero stat numbers on page load.
═══════════════════════════════════════════════════ */
(function initCounters() {
  /**
   * Animate a number from 0 to a target value.
   * @param {HTMLElement} el  — target element
   * @param {number} target   — final value
   * @param {string} suffix   — optional suffix (e.g., 'kg', '%')
   * @param {number} decimals — decimal places
   * @param {number} delay    — start delay in ms
   */
  function animateNum(el, target, suffix = '', decimals = 0, delay = 0) {
    if (!el) return;
    const duration = 1800;
    setTimeout(() => {
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / duration, 1);
        // Ease out quart
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
  }

  // Trigger counters when visible (IntersectionObserver)
  const statusCards = document.querySelectorAll('.status-card');
  if (!statusCards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Animate status card values
        animateNum(document.getElementById('sc1'), 12.4, ' kg',  1, 0);
        animateNum(document.getElementById('sc2'), 847,  ' kWh', 0, 100);
        animateNum(document.getElementById('sc3'), 1204, '',     0, 200);
        animateNum(document.getElementById('sc4'), 94,   '%',    0, 300);
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });

  observer.observe(statusCards[0]);
})();


/* ═══════════════════════════════════════════════════
   7. SMOOTH SCROLL — Nav links
═══════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


/* ═══════════════════════════════════════════════════
   8. PREFERS-REDUCED-MOTION — Honour system setting
═══════════════════════════════════════════════════ */
(function respectReducedMotion() {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    document.body.classList.add('eco-mode');
    const toggleMain  = document.getElementById('ecoToggleMain');
    const togglePanel = document.getElementById('ecoTogglePanel');
    if (toggleMain)  { toggleMain.checked  = true; toggleMain.setAttribute('aria-checked',  'true'); }
    if (togglePanel) { togglePanel.checked = true; togglePanel.setAttribute('aria-checked', 'true'); }
  }
})();
