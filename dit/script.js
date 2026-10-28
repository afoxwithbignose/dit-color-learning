(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

  const hexToRgb = (hex) => {
    const normalized = hex.replace("#", "");
    return [
      parseInt(normalized.slice(0, 2), 16),
      parseInt(normalized.slice(2, 4), 16),
      parseInt(normalized.slice(4, 6), 16)
    ];
  };

  const mixColor = (a, b, t) => {
    const first = hexToRgb(a);
    const second = hexToRgb(b);
    return `rgb(${first.map((value, index) => Math.round(mix(value, second[index], t))).join(",")})`;
  };

  const toast = $("#toast");
  let toastTimer;
  function showToast(message = "已复制") {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  // Reading progress.
  const readingBar = $("#readingBar");
  function updateReadingProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (readingBar) readingBar.style.width = `${clamp(progress * 100, 0, 100)}%`;
  }

  // Current chapter highlighting.
  const railLinks = $$("#railNav a");
  const topLinks = $$(".top-nav a");
  const topLinkMap = {
    "#role": "#ingest",
    "#ingest": "#ingest",
    "#dataset": "#ingest",
    "#pipeline": "#pipeline",
    "#onset": "#onset",
    "#qc": "#qc",
    "#delivery": "#qc",
    "#debug": "#qc",
    "#learn": "#learn"
  };

  if ("IntersectionObserver" in window) {
    const chapterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        railLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
        const mapped = topLinkMap[`#${entry.target.id}`];
        topLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === mapped));
      });
    }, { rootMargin: "-28% 0px -62% 0px", threshold: 0 });
    ["role", "ingest", "dataset", "pipeline", "onset", "qc", "delivery", "debug", "learn"].forEach((id) => {
      const section = document.getElementById(id);
      if (section) chapterObserver.observe(section);
    });
  }

  // Progressive reveal.
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

  // Mobile chapter menu.
  const menuButton = $("#menuButton");
  const mobileMenu = $("#mobileMenu");
  function setMenu(open) {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
  }

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });
  $$("a", mobileMenu).forEach((link) => link.addEventListener("click", () => setMenu(false)));

  // Hero: compare a flat camera Log view with a display-referred Show LUT.
  const heroCanvas = $("#heroCanvas");
  const heroSlider = $("#heroSlider");
  const heroState = $("#heroState");
  const heroLutState = $("#heroLutState");
  let heroFrame = 0;

  function drawHeroMonitor() {
    if (!heroCanvas || !heroSlider) return;
    const ctx = heroCanvas.getContext("2d");
    const width = heroCanvas.width;
    const height = heroCanvas.height;
    const amount = ease(Number(heroSlider.value) / 100);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, mixColor("#66706d", "#173b42", amount));
    sky.addColorStop(0.58, mixColor("#757b76", "#1b5e5a", amount));
    sky.addColorStop(1, mixColor("#565d59", "#122b29", amount));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Window / practical light.
    const windowX = width * 0.63;
    const windowY = height * 0.16;
    const windowW = width * 0.25;
    const windowH = height * 0.45;
    ctx.fillStyle = mixColor("#969c96", "#d9844e", amount);
    ctx.fillRect(windowX, windowY, windowW, windowH);
    ctx.fillStyle = mixColor("#777f79", "#201714", amount * 0.8);
    ctx.fillRect(windowX + windowW * 0.47, windowY, windowW * 0.04, windowH);
    ctx.fillRect(windowX, windowY + windowH * 0.52, windowW, windowH * 0.035);

    const practical = ctx.createRadialGradient(windowX + windowW * 0.46, windowY + windowH * 0.4, 2, windowX + windowW * 0.46, windowY + windowH * 0.4, width * 0.33);
    practical.addColorStop(0, `rgba(255,185,105,${0.05 + amount * 0.34})`);
    practical.addColorStop(0.28, `rgba(255,104,70,${amount * 0.16})`);
    practical.addColorStop(1, "rgba(255,104,70,0)");
    ctx.fillStyle = practical;
    ctx.fillRect(0, 0, width, height);

    // Foreground desk and practical props.
    ctx.fillStyle = mixColor("#4f5853", "#0d1917", amount);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.77);
    ctx.lineTo(width, height * 0.68);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = mixColor("#81867f", "#a86335", amount * 0.9);
    ctx.beginPath();
    ctx.roundRect(width * 0.13, height * 0.18, width * 0.11, height * 0.36, 8);
    ctx.fill();
    ctx.fillStyle = mixColor("#a3a8a0", "#ffc873", amount);
    ctx.beginPath();
    ctx.roundRect(width * 0.145, height * 0.18, width * 0.08, height * 0.36, 8);
    ctx.fill();

    // A person in silhouette gives the abstract scene a clear focal point.
    ctx.fillStyle = mixColor("#535b56", "#071312", amount);
    ctx.beginPath();
    ctx.ellipse(width * 0.42, height * 0.39, width * 0.105, height * 0.13, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(width * 0.27, height * 0.78);
    ctx.quadraticCurveTo(width * 0.28, height * 0.52, width * 0.42, height * 0.51);
    ctx.quadraticCurveTo(width * 0.58, height * 0.52, width * 0.62, height * 0.79);
    ctx.closePath();
    ctx.fill();

    // Skin patch makes the practical color shift readable without literal grading claims.
    ctx.fillStyle = mixColor("#8b8982", "#d28661", amount);
    ctx.beginPath();
    ctx.ellipse(width * 0.425, height * 0.335, width * 0.06, height * 0.066, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Monitor guide lines and safe area.
    ctx.strokeStyle = `rgba(255,255,255,${0.09 + amount * 0.05})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(width * 0.08, height * 0.08, width * 0.84, height * 0.84);
    ctx.beginPath();
    ctx.moveTo(width / 2 - 10, height / 2);
    ctx.lineTo(width / 2 + 10, height / 2);
    ctx.moveTo(width / 2, height / 2 - 10);
    ctx.lineTo(width / 2, height / 2 + 10);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.035)";
    for (let y = 0; y < height; y += 5) ctx.fillRect(0, y, width, 1);

    if (heroState) {
      heroState.textContent = amount < 0.22
        ? "LOG / 低对比监看"
        : amount < 0.62
          ? "LUT / 技术监看过渡"
          : amount < 0.9
            ? "SHOW LUT / 主监看"
            : "SHOW LUT / 创作 Look";
    }
    if (heroLutState) heroLutState.textContent = `SHOW LUT · ${Math.round(amount * 100)}%`;
  }

  heroSlider?.addEventListener("input", () => {
    cancelAnimationFrame(heroFrame);
    heroFrame = requestAnimationFrame(drawHeroMonitor);
  });
  drawHeroMonitor();

  // Transfer workload calculator.
  const cardSizeRange = $("#cardSizeRange");
  const cardCountRange = $("#cardCountRange");
  const copySpeedRange = $("#copySpeedRange");
  const copyCountRange = $("#copyCountRange");
  const cardSizeOut = $("#cardSizeOut");
  const cardCountOut = $("#cardCountOut");
  const copySpeedOut = $("#copySpeedOut");
  const copyCountOut = $("#copyCountOut");
  const copyHours = $("#copyHours");
  const writtenData = $("#writtenData");
  const workingStorage = $("#workingStorage");
  const mediaVolume = $("#mediaVolume");
  const dataCanvas = $("#dataCanvas");

  function formatSize(gigabytes) {
    if (gigabytes >= 1024) return `${(gigabytes / 1024).toFixed(1)} TB`;
    return `${Math.round(gigabytes)} GB`;
  }

  function drawDataDiagram(cards, copies) {
    if (!dataCanvas) return;
    const ctx = dataCanvas.getContext("2d");
    const width = dataCanvas.width;
    const height = dataCanvas.height;
    ctx.fillStyle = "#111413";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const shownCards = Math.min(cards, 9);
    for (let i = 0; i < shownCards; i += 1) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 28 + col * 51;
      const y = 55 + row * 78;
      ctx.fillStyle = i === 0 ? "#d8ff58" : "#2d3b37";
      ctx.fillRect(x, y, 36, 55);
      ctx.fillStyle = i === 0 ? "#111413" : "#91d9d2";
      ctx.fillRect(x + 7, y + 8, 22, 8);
      ctx.fillRect(x + 7, y + 21, 15, 2);
      ctx.fillRect(x + 7, y + 27, 19, 2);
      ctx.fillStyle = "rgba(255,255,255,0.48)";
      for (let pin = 0; pin < 5; pin += 1) ctx.fillRect(x + 6 + pin * 6, y + 40, 2, 6);
    }

    if (cards > shownCards) {
      ctx.fillStyle = "#ff6846";
      ctx.font = "700 10px Consolas, monospace";
      ctx.fillText(`+${cards - shownCards} CARDS`, 27, 289);
    }

    ctx.strokeStyle = "#d8ff58";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(217, 105);
    ctx.lineTo(260, 105);
    ctx.lineTo(260, 205);
    ctx.stroke();

    for (let i = 0; i < copies; i += 1) {
      const x = 265 + i * 25;
      const y = 57 + i * 39;
      ctx.fillStyle = i === 0 ? "#177b72" : "#d8ff58";
      ctx.fillRect(x, y, 76, 130);
      ctx.fillStyle = i === 0 ? "#d8ff58" : "#111413";
      ctx.font = "700 8px Consolas, monospace";
      ctx.fillText(i === 0 ? "WORK A" : `BACKUP ${i}`, x + 9, y + 18);
      ctx.fillStyle = i === 0 ? "rgba(255,255,255,0.36)" : "rgba(17,20,19,0.38)";
      for (let line = 0; line < 6; line += 1) ctx.fillRect(x + 9, y + 34 + line * 11, 52, 2);
    }
  }

  function updateTransferCalculator() {
    if (!cardSizeRange || !cardCountRange || !copySpeedRange || !copyCountRange) return;
    const size = Number(cardSizeRange.value);
    const cards = Number(cardCountRange.value);
    const speed = Number(copySpeedRange.value);
    const copies = Number(copyCountRange.value);
    const volume = size * cards;
    const written = volume * copies;
    const seconds = (written * 1024) / speed;
    const hours = seconds / 3600;

    if (cardSizeOut) cardSizeOut.textContent = `${size} GB`;
    if (cardCountOut) cardCountOut.textContent = `${cards} 张`;
    if (copySpeedOut) copySpeedOut.textContent = `${speed} MB/s`;
    if (copyCountOut) copyCountOut.textContent = `${copies} 份`;
    if (copyHours) copyHours.textContent = `${hours.toFixed(1)} h`;
    if (writtenData) writtenData.textContent = formatSize(written);
    if (workingStorage) workingStorage.textContent = formatSize(volume);
    if (mediaVolume) mediaVolume.textContent = formatSize(volume);
    drawDataDiagram(cards, copies);

    $$(".preset").forEach((button) => {
      button.classList.toggle(
        "active",
        Number(button.dataset.size) === size &&
        Number(button.dataset.count) === cards &&
        Number(button.dataset.speed) === speed &&
        Number(button.dataset.copies) === copies
      );
    });
  }

  [cardSizeRange, cardCountRange, copySpeedRange, copyCountRange].forEach((input) => {
    input?.addEventListener("input", updateTransferCalculator);
  });
  $$(".preset").forEach((button) => {
    button.addEventListener("click", () => {
      if (!cardSizeRange || !cardCountRange || !copySpeedRange || !copyCountRange) return;
      cardSizeRange.value = button.dataset.size;
      cardCountRange.value = button.dataset.count;
      copySpeedRange.value = button.dataset.speed;
      copyCountRange.value = button.dataset.copies;
      updateTransferCalculator();
    });
  });
  updateTransferCalculator();

  // Dailies QC reference image.
  const qcCanvas = $("#qcCanvas");
  function drawQcFrame() {
    if (!qcCanvas) return;
    const ctx = qcCanvas.getContext("2d");
    const width = qcCanvas.width;
    const height = qcCanvas.height;
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#122f34");
    sky.addColorStop(0.62, "#174d49");
    sky.addColorStop(1, "#0e1d1b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(355, 89, 2, 355, 89, 130);
    glow.addColorStop(0, "rgba(255,220,148,0.95)");
    glow.addColorStop(0.1, "rgba(255,104,70,0.75)");
    glow.addColorStop(1, "rgba(255,104,70,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#081312";
    ctx.beginPath();
    ctx.ellipse(214, 151, 42, 55, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(117, 300);
    ctx.quadraticCurveTo(129, 184, 214, 183);
    ctx.quadraticCurveTo(292, 185, 318, 300);
    ctx.fill();

    ctx.fillStyle = "#a25d3f";
    ctx.beginPath();
    ctx.ellipse(217, 129, 26, 29, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.19)";
    ctx.setLineDash([4, 5]);
    ctx.strokeRect(width * 0.08, height * 0.08, width * 0.84, height * 0.84);
    ctx.setLineDash([]);
  }
  drawQcFrame();

  // QC checklist.
  const qcChecks = $$("[data-qc]");
  const qcCount = $("#qcCount");
  const qcVerdict = $("#qcVerdict");
  function updateQc() {
    const checked = qcChecks.filter((item) => item.classList.contains("checked")).length;
    if (qcCount) qcCount.textContent = `${checked} / ${qcChecks.length}`;
    if (qcVerdict) {
      qcVerdict.textContent = checked === qcChecks.length
        ? "READY TO DELIVER"
        : checked >= 4
          ? "接近放行"
          : "等待质检";
    }
  }
  qcChecks.forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.toggle("checked");
      updateQc();
    });
  });
  updateQc();

  // Process tabs.
  $$(".tab-controls [role='tab']").forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      $$(".tab-controls [role='tab']").forEach((item) => {
        item.setAttribute("aria-selected", String(item === tab));
      });
      $$(".tab-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.panel === name);
      });
    });
  });

  // Copy-card checklist persisted locally.
  const sopChecks = $$("[data-sop]");
  const sopCount = $("#sopCount");
  const sopMeter = $("#sopMeter");
  const sopMessage = $("#sopMessage");
  let sopState = {};

  try {
    sopState = JSON.parse(localStorage.getItem("dit-offload-sop") || "{}");
  } catch {
    sopState = {};
  }

  function updateSop() {
    const checked = sopChecks.filter((item) => item.checked).length;
    if (sopCount) sopCount.textContent = `${checked} / ${sopChecks.length}`;
    if (sopMeter) sopMeter.style.width = `${(checked / sopChecks.length) * 100}%`;
    sopChecks.forEach((item) => item.closest(".step-item")?.classList.toggle("done", item.checked));
    const messages = [
      "从第一项开始，稳比快重要。",
      "来源已登记，继续守住复制和校验。",
      "双备份已启动，不要提前清卡。",
      "接近放行，播放抽检与报告不能漏。",
      "拷卡放行完成。现在进入代理与交付。"
    ];
    const messageIndex = checked === sopChecks.length ? 4 : Math.min(3, Math.floor((checked / sopChecks.length) * 4));
    if (sopMessage) sopMessage.textContent = messages[messageIndex];
  }

  sopChecks.forEach((item) => {
    item.checked = Boolean(sopState[item.id]);
    item.addEventListener("change", () => {
      sopState[item.id] = item.checked;
      try {
        localStorage.setItem("dit-offload-sop", JSON.stringify(sopState));
      } catch {
        // Storage may be unavailable for local files; the live checklist still works.
      }
      updateSop();
    });
  });
  updateSop();

  $("#resetSop")?.addEventListener("click", () => {
    sopChecks.forEach((item) => { item.checked = false; });
    sopState = {};
    try {
      localStorage.removeItem("dit-offload-sop");
    } catch {
      // Ignore restricted storage.
    }
    updateSop();
    showToast("清单已重置");
  });

  // Route shortcuts.
  $$(".route-node").forEach((node) => {
    node.addEventListener("click", () => {
      $$(".route-node").forEach((item) => item.classList.toggle("active", item === node));
      document.getElementById(node.dataset.target)?.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Clipboard helpers.
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    showToast("命令已复制");
  }

  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => {
      const code = button.previousElementSibling?.textContent || "";
      copyText(code.trim());
    });
  });

  // Knowledge check.
  const quizCards = $$(".quiz-card");
  const quizScore = $("#quizScore");
  let score = 0;
  quizCards.forEach((card) => {
    $$(".quiz-options button", card).forEach((button) => {
      button.addEventListener("click", () => {
        if (card.classList.contains("answered")) return;
        const correct = button.dataset.choice === card.dataset.answer;
        button.classList.add(correct ? "correct" : "wrong");
        if (correct) {
          score += 1;
          if (quizScore) quizScore.textContent = String(score);
        } else {
          $(`.quiz-options button[data-choice="${card.dataset.answer}"]`, card)?.classList.add("correct");
        }
        card.classList.add("answered");
      });
    });
  });

  // Print and keyboard shortcuts.
  const printPage = () => window.print();
  $("#printButton")?.addEventListener("click", printPage);
  $("#printButtonBottom")?.addEventListener("click", printPage);
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    if (!isTyping && event.key.toLowerCase() === "p") {
      event.preventDefault();
      printPage();
    }
    if (event.key === "Escape") setMenu(false);
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      drawHeroMonitor();
      updateTransferCalculator();
      drawQcFrame();
    }, 120);
  });

  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  updateReadingProgress();
})();
