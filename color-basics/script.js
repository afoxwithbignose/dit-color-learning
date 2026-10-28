(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

  const toast = $("#toast");
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
  }

  function readStorage(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The interactive tools remain usable when local storage is restricted.
    }
  }

  // Reading progress.
  const readingBar = $("#readingBar");
  function updateReadingProgress() {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const progress = available > 0 ? window.scrollY / available : 0;
    if (readingBar) readingBar.style.width = `${clamp(progress * 100, 0, 100)}%`;
  }

  // Current section in two navigation systems.
  const railLinks = $$("#railNav a");
  const topLinks = $$(".top-nav a");
  const sectionToTop = {
    role: "#map",
    map: "#map",
    science: "#science",
    management: "#management",
    tools: "#tools",
    nodes: "#nodes",
    workflow: "#workflow",
    looks: "#workflow",
    delivery: "#workflow",
    learn: "#learn",
    debug: "#learn"
  };

  if ("IntersectionObserver" in window) {
    const chapterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        railLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
        const activeTop = sectionToTop[entry.target.id];
        topLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === activeTop));
      });
    }, { rootMargin: "-28% 0px -62% 0px", threshold: 0 });

    ["role", "map", "science", "management", "tools", "nodes", "workflow", "looks", "delivery", "learn", "debug"].forEach((id) => {
      const section = document.getElementById(id);
      if (section) chapterObserver.observe(section);
    });
  }

  // Reveal content progressively.
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  // Mobile navigation.
  const menuButton = $("#menuButton");
  const mobileMenu = $("#mobileMenu");
  function setMenu(open) {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
  }

  menuButton?.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  $$("a", mobileMenu).forEach((link) => link.addEventListener("click", () => setMenu(false)));

  const hexToRgb = (hex) => {
    const value = hex.replace("#", "");
    return [
      parseInt(value.slice(0, 2), 16),
      parseInt(value.slice(2, 4), 16),
      parseInt(value.slice(4, 6), 16)
    ];
  };

  const mixColor = (a, b, t) => {
    const first = hexToRgb(a);
    const second = hexToRgb(b);
    return `rgb(${first.map((channel, index) => Math.round(mix(channel, second[index], t))).join(",")})`;
  };

  function adjustColor(hex, exposure = 0, temperature = 0, tint = 0, saturation = 1) {
    const channels = hexToRgb(hex).map((channel) => clamp(channel / 255, 0, 1));
    const exposureScale = Math.pow(2, exposure * 0.9);
    channels[0] = channels[0] * exposureScale + temperature * 0.00065;
    channels[2] = channels[2] * exposureScale - temperature * 0.00065;
    channels[1] = channels[1] * exposureScale + tint * 0.00048;
    channels[0] = channels[0] - tint * 0.00014;
    channels[2] = channels[2] - tint * 0.00014;
    const luma = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    return `rgb(${channels.map((channel) => {
      const saturated = luma + (channel - luma) * saturation;
      return Math.round(clamp(saturated, 0, 1) * 255);
    }).join(",")})`;
  }

  // The hero is a before/after wipe of one abstract cinematic scene.
  const gradeCanvas = $("#gradeCanvas");
  const gradeSlider = $("#gradeSlider");
  const gradeState = $("#gradeState");
  let gradeFrame = 0;

  function drawCinematicScene(ctx, width, height, variant = "base", balance = {}) {
    const graded = variant === "final";
    const exposure = balance.exposure || 0;
    const temperature = balance.temperature || 0;
    const tint = balance.tint || 0;
    const color = (baseHex, finalHex) => adjustColor(
      graded ? finalHex : baseHex,
      exposure,
      temperature,
      tint,
      graded ? 1.08 : 0.78
    );

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, color("#6d7775", "#123943"));
    sky.addColorStop(0.58, color("#838985", "#175a58"));
    sky.addColorStop(1, color("#5d6561", "#122824"));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // A warm practical light behind the subject.
    const lightX = width * 0.72;
    const lightY = height * 0.31;
    const glow = ctx.createRadialGradient(lightX, lightY, 2, lightX, lightY, width * 0.33);
    glow.addColorStop(0, graded ? "rgba(255,214,136,0.92)" : "rgba(188,190,181,0.65)");
    glow.addColorStop(0.12, graded ? "rgba(255,110,70,0.62)" : "rgba(150,157,150,0.34)");
    glow.addColorStop(0.48, graded ? "rgba(255,85,55,0.12)" : "rgba(146,152,145,0.08)");
    glow.addColorStop(1, "rgba(255,80,50,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Window grid.
    const wx = width * 0.64;
    const wy = height * 0.17;
    const ww = width * 0.27;
    const wh = height * 0.43;
    ctx.fillStyle = color("#9ea29b", "#c67d52");
    ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = color("#707873", "#1c1b19");
    ctx.fillRect(wx + ww * 0.48, wy, ww * 0.035, wh);
    ctx.fillRect(wx, wy + wh * 0.53, ww, wh * 0.035);

    // Background architecture.
    ctx.fillStyle = color("#555d59", "#091817");
    ctx.beginPath();
    ctx.moveTo(0, height * 0.63);
    ctx.lineTo(width * 0.26, height * 0.53);
    ctx.lineTo(width * 0.38, height * 0.74);
    ctx.lineTo(0, height * 0.81);
    ctx.closePath();
    ctx.fill();

    // Main character.
    ctx.fillStyle = color("#4d5550", "#061311");
    ctx.beginPath();
    ctx.ellipse(width * 0.43, height * 0.38, width * 0.09, height * 0.14, -0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(width * 0.27, height * 0.87);
    ctx.quadraticCurveTo(width * 0.29, height * 0.49, width * 0.44, height * 0.49);
    ctx.quadraticCurveTo(width * 0.61, height * 0.51, width * 0.64, height * 0.88);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color("#918f88", "#c2785a");
    ctx.beginPath();
    ctx.ellipse(width * 0.435, height * 0.325, width * 0.052, height * 0.073, -0.12, 0, Math.PI * 2);
    ctx.fill();

    // Desk, practical prop, and foreground.
    ctx.fillStyle = color("#4d5652", "#071513");
    ctx.beginPath();
    ctx.moveTo(0, height * 0.77);
    ctx.lineTo(width, height * 0.67);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color("#878c85", "#a65f32");
    ctx.beginPath();
    ctx.roundRect(width * 0.13, height * 0.43, width * 0.075, height * 0.3, 7);
    ctx.fill();
    ctx.fillStyle = color("#b7bab1", "#ffc170");
    ctx.beginPath();
    ctx.roundRect(width * 0.142, height * 0.43, width * 0.046, height * 0.3, 7);
    ctx.fill();

    // Subtle display structure.
    ctx.fillStyle = "rgba(255,255,255,0.032)";
    for (let y = 0; y < height; y += 5) ctx.fillRect(0, y, width, 1);
  }

  function drawHero() {
    if (!gradeCanvas || !gradeSlider) return;
    const ctx = gradeCanvas.getContext("2d");
    const width = gradeCanvas.width;
    const height = gradeCanvas.height;
    const split = clamp(Number(gradeSlider.value) / 100, 0, 1);

    drawCinematicScene(ctx, width, height, "final");
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width * split, height);
    ctx.clip();
    drawCinematicScene(ctx, width, height, "base");
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * split, 0);
    ctx.lineTo(width * split, height);
    ctx.stroke();
    ctx.fillStyle = "#d8ff58";
    ctx.fillRect(width * split - 2, height / 2 - 12, 4, 24);

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.strokeRect(width * 0.07, height * 0.08, width * 0.86, height * 0.84);

    if (gradeState) gradeState.textContent = `WIPE ${Math.round(split * 100)}% · BALANCE → LOOK`;
  }

  gradeSlider?.addEventListener("input", () => {
    cancelAnimationFrame(gradeFrame);
    gradeFrame = requestAnimationFrame(drawHero);
  });
  drawHero();

  // Scope illustrations.
  function canvasSetup(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0b0e0d";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += width / 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += height / 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    return { ctx, width, height };
  }

  function drawWaveform(canvas) {
    const setup = canvasSetup(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;
    for (let row = 0; row < 36; row += 1) {
      const normalized = row / 35;
      const center = height * (0.12 + normalized * 0.74);
      const spread = height * (0.012 + Math.sin(normalized * Math.PI) * 0.035);
      ctx.strokeStyle = `rgba(216,255,88,${0.075 + Math.sin(normalized * Math.PI) * 0.11})`;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 3) {
        const y = center + Math.sin(x * 0.047 + row) * spread + Math.sin(x * 0.011 + row * 0.3) * spread * 0.5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function drawParade(canvas) {
    const setup = canvasSetup(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;
    const colors = ["#ff6d55", "#d8ff58", "#6f97ff"];
    const offsets = [-9, 1, 8];
    colors.forEach((color, channel) => {
      const start = channel * width / 3;
      const end = (channel + 1) * width / 3;
      for (let row = 0; row < 28; row += 1) {
        const normalized = row / 27;
        const center = height * (0.13 + normalized * 0.73 + offsets[channel] * 0.0015);
        ctx.strokeStyle = `${color}${row % 3 === 0 ? "38" : "1d"}`;
        ctx.beginPath();
        for (let x = start; x < end; x += 3) {
          const y = center + Math.sin(x * 0.055 + row + channel) * height * 0.02;
          if (x === start) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(width / 3, 0);
    ctx.lineTo(width / 3, height);
    ctx.moveTo(width * 2 / 3, 0);
    ctx.lineTo(width * 2 / 3, height);
    ctx.stroke();
  }

  function drawVector(canvas) {
    const setup = canvasSetup(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.4;
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    const labels = [
      ["R", 0, "#ff6d55"], ["Y", 60, "#f5d95b"], ["G", 120, "#9fd65e"],
      ["C", 180, "#57c9c2"], ["B", 240, "#668fff"], ["M", 300, "#df6abe"]
    ];
    labels.forEach(([label, angle, color]) => {
      const radians = (angle - 90) * Math.PI / 180;
      const x = cx + Math.cos(radians) * radius * 1.08;
      const y = cy + Math.sin(radians) * radius * 1.08;
      ctx.fillStyle = color;
      ctx.font = "7px Consolas, monospace";
      ctx.fillText(label, x - 3, y + 2);
    });

    ctx.strokeStyle = "rgba(255,255,255,0.32)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx + radius * 0.13, cy - radius * 0.38);
    ctx.lineTo(cx + radius * 0.76, cy + radius * 0.29);
    ctx.stroke();
    ctx.setLineDash([]);

    const points = [[0.35, -0.24], [0.46, -0.11], [0.55, 0.03], [0.28, -0.33], [0.61, 0.12], [0.18, -0.18], [-0.3, 0.22], [-0.12, 0.36], [0.4, 0.25]];
    points.forEach(([x, y], index) => {
      ctx.fillStyle = index % 2 ? "rgba(216,255,88,0.65)" : "rgba(255,104,70,0.7)";
      ctx.beginPath();
      ctx.arc(cx + x * radius, cy + y * radius, 1.5 + (index % 3), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawWaveform($("#scienceWave"));
  drawParade($("#scienceParade"));
  drawVector($("#scienceVector"));

  // Interactive knowledge map.
  const mindData = {
    science: {
      kicker: "01 / COLOR SCIENCE",
      title: "色彩科学",
      text: "理解场景参考与显示参考、色域与 Gamma、视觉适应与记忆色。它决定了你为什么这样看示波器，以及为什么同一个数值在不同环境里感受不同。",
      tags: ["光与视觉", "Gamut", "Gamma", "Bit Depth", "示波器"],
      link: "#science"
    },
    management: {
      kicker: "02 / COLOR MANAGEMENT",
      title: "色彩管理",
      text: "定义输入、工作、显示和交付空间。正确的项目色彩管理让不同相机素材有共同语言，并确保输出变换只发生一次。",
      tags: ["Input", "Working", "Display", "ACES", "Gamut Mapping"],
      link: "#management"
    },
    tools: {
      kicker: "03 / TOOLKIT",
      title: "调色工具",
      text: "色轮建立整体关系，曲线控制分布，限定器选择颜色，窗口选择空间，跟踪器保持运动。工具的选择来自问题，不来自按钮数量。",
      tags: ["Primaries", "Curves", "Qualifier", "Window", "Warper"],
      link: "#tools"
    },
    nodes: {
      kicker: "04 / NODE GRAPH",
      title: "节点架构",
      text: "串联累积、并行汇合、图层合成、Key Mixer 组合遮罩。一个好节点图把技术转换、平衡、匹配、局部和风格清楚地区分开。",
      tags: ["Serial", "Parallel", "Layer", "Key", "Single Responsibility"],
      link: "#nodes"
    },
    match: {
      kicker: "05 / SHOT MATCHING",
      title: "镜头匹配",
      text: "先选 Hero Shot，再统一曝光、对比、白点和肤色。镜头匹配追求连续关系，不追求每个镜头单独成为一张海报。",
      tags: ["Hero Shot", "RGB Parade", "Continuity", "Skin", "Scene"],
      link: "#workflow"
    },
    look: {
      kicker: "06 / LOOK DEVELOPMENT",
      title: "风格创造",
      text: "通过主辅色、阴影与高光倾向、对比曲线、滚降、Halation 和颗粒表达叙事。风格必须有取舍，也要保留面部与环境的信息。",
      tags: ["Color Story", "Roll-off", "Texture", "Halation", "Grain"],
      link: "#looks"
    },
    delivery: {
      kicker: "07 / DELIVERY",
      title: "交付质检",
      text: "母版、目标色彩空间、编码、范围和字幕必须形成可播放、可回套、可验证的文件。最终 QC 永远检查实际输出文件。",
      tags: ["Output Transform", "Codec", "Color Tags", "QC", "Version"],
      link: "#delivery"
    },
    learn: {
      kicker: "08 / LEARNING PATH",
      title: "学习路线",
      text: "从观察、工具、关系走向交付。每周产出可检查的成果，用 Hero Shot、节点模板、Still 和输出文件证明能力，而不是只看完教程。",
      tags: ["30 Days", "Deliberate Practice", "Still Review", "Projects"],
      link: "#learn"
    }
  };

  const mindBranches = $$(".mind-branch");
  const mindKicker = $("#mindKicker");
  const mindTitle = $("#mindTitle");
  const mindText = $("#mindText");
  const mindKeywords = $("#mindKeywords");
  const mindLink = $("#mindLink");

  function activateMind(key) {
    const data = mindData[key];
    if (!data) return;
    mindBranches.forEach((branch) => branch.classList.toggle("active", branch.dataset.mind === key));
    if (mindKicker) mindKicker.textContent = data.kicker;
    if (mindTitle) mindTitle.textContent = data.title;
    if (mindText) mindText.textContent = data.text;
    if (mindKeywords) mindKeywords.innerHTML = data.tags.map((tag) => `<span>${tag}</span>`).join("");
    if (mindLink) {
      mindLink.href = data.link;
      mindLink.textContent = `进入 ${data.title} ↓`;
    }
  }

  mindBranches.forEach((branch) => {
    branch.addEventListener("click", () => activateMind(branch.dataset.mind));
    branch.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateMind(branch.dataset.mind);
      }
    });
  });

  $("#downloadMindMap")?.addEventListener("click", () => {
    const source = $("#mindMap");
    if (!source) return;
    const clone = source.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", "1400");
    clone.setAttribute("height", "980");
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
      svg{background:#f8f5ed}
      path{fill:none;stroke:#8b8e88;stroke-width:1.5;stroke-dasharray:5 5}
      .mind-branch{outline:none}
      .mind-branch rect{fill:#fffef9;stroke:#757a75;stroke-width:1.2}
      .mind-branch circle{fill:#ff6846}
      .mind-branch.active rect{fill:#171a19;stroke:#171a19}
      .mind-branch.active .mind-title{fill:#f2efe6}
      .mind-branch.active .mind-sub{fill:#aeb1ac}
      .mind-branch.active circle,.mind-branch.active .mind-num{fill:#d8ff58}
      .mind-num{fill:#171a19;font:7px Consolas,monospace;text-anchor:middle}
      .mind-title{fill:#171a19;font:700 20px "Microsoft YaHei",sans-serif}
      .mind-sub{fill:#555a55;font:9px "Microsoft YaHei",sans-serif}
      .mind-center rect{fill:#171a19;stroke:#d8ff58;stroke-width:2}
      .mind-center text{fill:#f2efe6;font:700 24px "Microsoft YaHei",sans-serif;text-anchor:middle}
      .mind-center .center-sub{fill:#d8ff58;font:7px Consolas,monospace}
    `;
    clone.insertBefore(style, clone.firstChild);
    const data = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "达芬奇调色学习思维导图.svg";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("思维导图 SVG 已下载");
  });

  // Node recipe tabs.
  const recipeLab = $(".recipe-lab");
  $$("[role='tab']", recipeLab).forEach((tab) => {
    tab.addEventListener("click", () => {
      $$("[role='tab']", recipeLab).forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
      $$(".recipe-panel", recipeLab).forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab.dataset.tab));
    });
  });

  // Balance simulator.
  const balanceCanvas = $("#balanceCanvas");
  const exposureRange = $("#exposureRange");
  const temperatureRange = $("#temperatureRange");
  const tintRange = $("#tintRange");
  const exposureOut = $("#exposureOut");
  const temperatureOut = $("#temperatureOut");
  const tintOut = $("#tintOut");
  const balanceState = $("#balanceState");

  function updateBalance() {
    if (!balanceCanvas || !exposureRange || !temperatureRange || !tintRange) return;
    const exposure = Number(exposureRange.value);
    const temperature = Number(temperatureRange.value);
    const tint = Number(tintRange.value);
    const ctx = balanceCanvas.getContext("2d");
    drawCinematicScene(ctx, balanceCanvas.width, balanceCanvas.height, "base", { exposure, temperature, tint });

    if (exposureOut) exposureOut.textContent = exposure.toFixed(2);
    if (temperatureOut) temperatureOut.textContent = String(temperature);
    if (tintOut) tintOut.textContent = String(tint);
    if (balanceState) {
      balanceState.textContent = Math.abs(exposure) < 0.06 && Math.abs(temperature) < 6 && Math.abs(tint) < 6
        ? "NEUTRAL"
        : exposure > 0.3
          ? "WATCH HIGHLIGHTS"
          : exposure < -0.3
            ? "WATCH SHADOWS"
            : "CUSTOM BALANCE";
    }
  }

  [exposureRange, temperatureRange, tintRange].forEach((input) => input?.addEventListener("input", updateBalance));
  $("#resetBalance")?.addEventListener("click", () => {
    if (!exposureRange || !temperatureRange || !tintRange) return;
    exposureRange.value = "0";
    temperatureRange.value = "0";
    tintRange.value = "0";
    updateBalance();
  });
  updateBalance();

  // Delivery QC.
  const qcItems = $$("[data-qc]");
  const qcCount = $("#qcCount");
  const qcVerdict = $("#qcVerdict");
  const qcState = readStorage("color-atlas-qc", {});
  qcItems.forEach((item, index) => {
    item.classList.toggle("checked", Boolean(qcState[index]));
    item.addEventListener("click", () => {
      item.classList.toggle("checked");
      qcState[index] = item.classList.contains("checked");
      writeStorage("color-atlas-qc", qcState);
      updateQc();
    });
  });
  function updateQc() {
    const complete = qcItems.filter((item) => item.classList.contains("checked")).length;
    if (qcCount) qcCount.textContent = `${complete} / ${qcItems.length}`;
    if (qcVerdict) {
      qcVerdict.textContent = complete === qcItems.length ? "READY TO DELIVER" : complete >= 4 ? "ALMOST READY" : "WAITING FOR QC";
    }
  }
  updateQc();

  // Practice checklist.
  const drillInputs = $$("[data-drill]");
  const drillCount = $("#drillCount");
  const savedDrills = readStorage("color-atlas-drills", {});
  function updateDrills() {
    const checked = drillInputs.filter((input) => input.checked).length;
    if (drillCount) drillCount.textContent = `${checked} / ${drillInputs.length}`;
  }
  drillInputs.forEach((input, index) => {
    input.checked = Boolean(savedDrills[index]);
    input.addEventListener("change", () => {
      savedDrills[index] = input.checked;
      writeStorage("color-atlas-drills", savedDrills);
      updateDrills();
    });
  });
  updateDrills();

  // Quiz.
  const quizCards = $$(".quiz-card");
  const quizScore = $("#quizScore");
  let quizTotal = 0;
  quizCards.forEach((card) => {
    $$(".quiz-options button", card).forEach((button) => {
      button.addEventListener("click", () => {
        if (card.classList.contains("answered")) return;
        const correct = button.dataset.choice === card.dataset.answer;
        button.classList.add(correct ? "correct" : "wrong");
        if (correct) {
          quizTotal += 1;
          if (quizScore) quizScore.textContent = String(quizTotal);
        } else {
          $(`.quiz-options button[data-choice="${card.dataset.answer}"]`, card)?.classList.add("correct");
        }
        card.classList.add("answered");
      });
    });
  });

  // Printing and global keyboard behavior.
  const printPage = () => window.print();
  $("#printButton")?.addEventListener("click", printPage);
  $("#printButtonBottom")?.addEventListener("click", printPage);
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    if (!typing && event.key.toLowerCase() === "p") {
      event.preventDefault();
      printPage();
    }
    if (event.key === "Escape") setMenu(false);
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      drawHero();
      updateBalance();
      drawWaveform($("#scienceWave"));
      drawParade($("#scienceParade"));
      drawVector($("#scienceVector"));
    }, 120);
  });

  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  updateReadingProgress();
})();
