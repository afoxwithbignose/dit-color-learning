(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const mix = (a, b, t) => a + (b - a) * t;

  const toast = $("#toast");
  let toastTimer;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
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
      // Local storage is an enhancement; the controls still work without it.
    }
  }

  const readingBar = $("#readingBar");
  function updateReadingProgress() {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const progress = available > 0 ? window.scrollY / available : 0;
    if (readingBar) readingBar.style.width = `${clamp(progress * 100, 0, 100)}%`;
  }

  const railLinks = $$("#railNav a");
  const topLinks = $$(".top-nav a");
  const topMap = {
    premise: "#map",
    map: "#map",
    aesthetic: "#aesthetic",
    analysis: "#analysis",
    reproduce: "#reproduce",
    advanced: "#advanced",
    workshop: "#workshop",
    learn: "#workshop",
    debug: "#workshop"
  };

  if ("IntersectionObserver" in window) {
    const chapterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        railLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
        const mapped = topMap[entry.target.id];
        topLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === mapped));
      });
    }, { rootMargin: "-28% 0px -62% 0px", threshold: 0 });
    ["premise", "map", "aesthetic", "analysis", "reproduce", "advanced", "workshop", "learn", "debug"].forEach((id) => {
      const section = document.getElementById(id);
      if (section) chapterObserver.observe(section);
    });
  }

  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

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
    return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
  };

  function gradedColor(hex, params = {}) {
    const exposure = params.exposure || 0;
    const contrast = params.contrast || 0;
    const temperature = params.temperature || 0;
    const saturation = params.saturation ?? 1;
    const channels = hexToRgb(hex).map((channel) => channel / 255);
    channels[0] = channels[0] * Math.pow(2, exposure * 0.9) + temperature * 0.0006;
    channels[2] = channels[2] * Math.pow(2, exposure * 0.9) - temperature * 0.0006;
    const luma = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    return `rgb(${channels.map((channel) => {
      let result = luma + (channel - luma) * saturation;
      result = (result - 0.5) * (1 + contrast * 0.8) + 0.5;
      return Math.round(clamp(result, 0, 1) * 255);
    }).join(",")})`;
  }

  function drawReferenceScene(ctx, width, height, params = {}) {
    ctx.clearRect(0, 0, width, height);
    const saturation = params.saturation ?? 1;
    const contrast = params.contrast || 0;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, gradedColor("#25484c", params));
    sky.addColorStop(0.61, gradedColor("#1c5b57", params));
    sky.addColorStop(1, gradedColor("#101c19", params));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const lightX = width * 0.72;
    const lightY = height * 0.29;
    const glow = ctx.createRadialGradient(lightX, lightY, 3, lightX, lightY, width * 0.34);
    const halation = (params.halation || 0) / 100;
    glow.addColorStop(0, "rgba(255,230,166,0.95)");
    glow.addColorStop(0.08, `rgba(255,132,82,${0.62 + halation * 0.28})`);
    glow.addColorStop(0.31 + halation * 0.18, `rgba(255,84,55,${0.08 + halation * 0.16})`);
    glow.addColorStop(1, "rgba(255,80,45,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const windowX = width * 0.63;
    const windowY = height * 0.14;
    const windowW = width * 0.26;
    const windowH = height * 0.5;
    ctx.fillStyle = gradedColor("#d09b67", params);
    ctx.fillRect(windowX, windowY, windowW, windowH);
    ctx.fillStyle = gradedColor("#1d2522", params);
    ctx.fillRect(windowX + windowW * 0.47, windowY, windowW * 0.035, windowH);
    ctx.fillRect(windowX, windowY + windowH * 0.55, windowW, windowH * 0.035);

    ctx.fillStyle = gradedColor("#11201e", params);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.62);
    ctx.lineTo(width * 0.22, height * 0.52);
    ctx.lineTo(width * 0.37, height * 0.77);
    ctx.lineTo(0, height * 0.84);
    ctx.closePath();
    ctx.fill();

    // Subject silhouette and skin.
    ctx.fillStyle = gradedColor("#122523", params);
    ctx.beginPath();
    ctx.ellipse(width * 0.42, height * 0.38, width * 0.082, height * 0.14, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(width * 0.26, height * 0.9);
    ctx.quadraticCurveTo(width * 0.28, height * 0.49, width * 0.43, height * 0.49);
    ctx.quadraticCurveTo(width * 0.61, height * 0.52, width * 0.65, height * 0.9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = gradedColor("#bd795b", params);
    ctx.beginPath();
    ctx.ellipse(width * 0.425, height * 0.328, width * 0.048, height * 0.07, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Desk and practical prop.
    ctx.fillStyle = gradedColor("#0c1816", params);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.78);
    ctx.lineTo(width, height * 0.68);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = gradedColor("#ae6636", params);
    ctx.beginPath();
    ctx.roundRect(width * 0.125, height * 0.43, width * 0.073, height * 0.31, 7);
    ctx.fill();
    ctx.fillStyle = gradedColor("#ffc672", params);
    ctx.beginPath();
    ctx.roundRect(width * 0.138, height * 0.43, width * 0.045, height * 0.31, 7);
    ctx.fill();

    // High-frequency texture preview, kept subtle.
    ctx.fillStyle = `rgba(255,255,255,${0.018 + Math.abs(saturation - 1) * 0.01})`;
    for (let y = 0; y < height; y += 5) ctx.fillRect(0, y, width, 1);

    if (halation > 0.15) {
      ctx.strokeStyle = `rgba(255,126,75,${halation * 0.11})`;
      ctx.lineWidth = 2 + halation * 4;
      ctx.beginPath();
      ctx.arc(lightX, lightY, width * (0.09 + halation * 0.1), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const canonicalLook = {
    exposure: 0.15,
    contrast: 0.35,
    temperature: 28,
    saturation: 1.16,
    halation: 52
  };

  const initialAttempt = {
    exposure: 0,
    contrast: 0,
    temperature: -10,
    saturation: 0.95,
    halation: 12
  };

  // Hero comparison wipe.
  const referenceCanvas = $("#referenceCanvas");
  const compareSlider = $("#compareSlider");
  const compareState = $("#compareState");
  let compareFrame = 0;
  function drawHeroCompare() {
    if (!referenceCanvas || !compareSlider) return;
    const ctx = referenceCanvas.getContext("2d");
    const width = referenceCanvas.width;
    const height = referenceCanvas.height;
    const split = clamp(Number(compareSlider.value) / 100, 0, 1);

    drawReferenceScene(ctx, width, height, {
      exposure: 0.08,
      contrast: 0.18,
      temperature: 4,
      saturation: 1.02,
      halation: 18
    });
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width * split, height);
    ctx.clip();
    drawReferenceScene(ctx, width, height, canonicalLook);
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,.75)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * split, 0);
    ctx.lineTo(width * split, height);
    ctx.stroke();
    const line = $(".compare-line");
    if (line) line.style.left = `${split * 100}%`;
    if (compareState) compareState.textContent = `WIPE ${Math.round(split * 100)}% · 技术相似 ≠ 创作相同`;
  }
  compareSlider?.addEventListener("input", () => {
    cancelAnimationFrame(compareFrame);
    compareFrame = requestAnimationFrame(drawHeroCompare);
  });
  drawHeroCompare();

  // Interactive advanced map.
  const mapData = {
    grammar: {
      kicker: "01 / VISUAL GRAMMAR",
      title: "视觉语法",
      text: "构图、明暗、视线、留白与画面重量共同决定观看顺序。调色要增强已有结构，而不是在平面上制造新的混乱。",
      tags: ["焦点", "层级", "留白", "视线", "重量"],
      link: "#aesthetic"
    },
    story: {
      kicker: "02 / COLOR STORY",
      title: "色彩叙事",
      text: "颜色不只表达冷暖，它也标记人物、空间、时间与情绪。好的色彩策略能让观众在不知不觉中建立因果关系。",
      tags: ["主辅色", "情绪", "时间", "人物", "对比"],
      link: "#aesthetic"
    },
    light: {
      kicker: "03 / LIGHT & SPACE",
      title: "光影空间",
      text: "调色可以强化光感，却无法凭空创造光位。先理解主光、反射、前景遮挡与负空间，再决定局部如何引导。",
      tags: ["主光", "负空间", "反射", "层次", "深度"],
      link: "#analysis"
    },
    texture: {
      kicker: "04 / TEXTURE",
      title: "影像质感",
      text: "高光滚降、Halation、Bloom 与颗粒建立媒介感。它们应该和镜头、分辨率与故事时代一致。",
      tags: ["滚降", "光晕", "颗粒", "介质", "克制"],
      link: "#advanced"
    },
    deconstruct: {
      kicker: "05 / DECONSTRUCT",
      title: "参考拆解",
      text: "把观感拆成明暗、色彩、光线、空间、运动与质感。区分哪些来自调色，哪些来自美术、服装、灯光与镜头。",
      tags: ["事实", "因果", "颜色", "光线", "材质"],
      link: "#analysis"
    },
    reproduce: {
      kicker: "06 / REPRODUCE",
      title: "技术还原",
      text: "在统一观看条件下，依序构建色彩管理、平衡、对比、色彩关系、局部与质感，并用实际素材检验。",
      tags: ["CM", "Balance", "Nodes", "Matte", "Verify"],
      link: "#reproduce"
    },
    variation: {
      kicker: "07 / VARIATION",
      title: "变体迁移",
      text: "同一个视觉逻辑应用到不同内容，需要参数化与取舍。能变奏才是理解；复制一张参考只是模仿。",
      tags: ["泛化", "约束", "变奏", "适配", "取舍"],
      link: "#reproduce"
    },
    sequence: {
      kicker: "08 / SEQUENCE",
      title: "序列控制",
      text: "完整场景要考虑剪辑点、色彩节奏、运动与观看疲劳。连续播放是全片调色不可替代的验证方式。",
      tags: ["连续性", "节奏", "剪辑点", "疲劳", "交付"],
      link: "#workshop"
    }
  };
  const mapBranches = $$(".map-branch");
  const mapKicker = $("#mapKicker");
  const mapHeading = $("#mapHeading");
  const mapText = $("#mapText");
  const mapTags = $("#mapTags");
  const mapLink = $("#mapLink");

  function activateMap(key) {
    const item = mapData[key];
    if (!item) return;
    mapBranches.forEach((branch) => branch.classList.toggle("active", branch.dataset.map === key));
    if (mapKicker) mapKicker.textContent = item.kicker;
    if (mapHeading) mapHeading.textContent = item.title;
    if (mapText) mapText.textContent = item.text;
    if (mapTags) mapTags.innerHTML = item.tags.map((tag) => `<span>${tag}</span>`).join("");
    if (mapLink) {
      mapLink.href = item.link;
      mapLink.textContent = `进入 ${item.title} ↓`;
    }
  }
  mapBranches.forEach((branch) => {
    branch.addEventListener("click", () => activateMap(branch.dataset.map));
    branch.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateMap(branch.dataset.map);
      }
    });
  });

  $("#downloadMindMap")?.addEventListener("click", () => {
    const source = $("#advancedMap");
    if (!source) return;
    const clone = source.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", "1440");
    clone.setAttribute("height", "1000");
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
      svg{background:#f8f5ed}
      path{fill:none;stroke:#888d87;stroke-width:1.5;stroke-dasharray:5 5}
      .map-branch rect{fill:#fffef9;stroke:#747a73;stroke-width:1.2}
      .map-branch.active rect{fill:#171a19;stroke:#171a19}
      .map-branch.active .map-name{fill:#f2efe6}.map-branch.active .map-sub{fill:#aeb2ab}
      .map-branch.active .map-num{fill:#d8ff58}
      .map-num{fill:#ff6846;font:8px Consolas,monospace}
      .map-name{fill:#171a19;font:700 20px "Microsoft YaHei",sans-serif}
      .map-sub{fill:#555a55;font:9px "Microsoft YaHei",sans-serif}
      .map-center circle{fill:#171a19;stroke:#d8ff58;stroke-width:2}
      .map-center text{text-anchor:middle}
      .center-big{fill:#f2efe6;font:700 26px "Microsoft YaHei",sans-serif}
      .center-small{fill:#d8ff58;font:7px Consolas,monospace}
    `;
    clone.insertBefore(style, clone.firstChild);
    const data = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "调色进阶审美与技术图谱.svg";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("SVG 图谱已下载");
  });

  // Aesthetic pair drills.
  const pairCards = $$(".pair-card");
  const eyeScore = $("#eyeScore");
  const eyeVerdict = $("#eyeVerdict");
  let eyeCorrect = 0;
  pairCards.forEach((card) => {
    $$(".pair-choices button", card).forEach((button) => {
      button.addEventListener("click", () => {
        if (card.classList.contains("answered")) return;
        const correct = button.dataset.choice === card.dataset.answer;
        button.classList.add(correct ? "correct" : "wrong");
        if (correct) {
          eyeCorrect += 1;
          if (eyeScore) eyeScore.textContent = `${eyeCorrect} / ${pairCards.length}`;
        } else {
          $(`.pair-choices button[data-choice="${card.dataset.answer}"]`, card)?.classList.add("correct");
        }
        card.classList.add("answered");
        if (eyeVerdict) {
          eyeVerdict.textContent = eyeCorrect === pairCards.length
            ? "观察路径清楚，下一步练习说出因果。"
            : "继续比较视觉事实，而不是只凭好恶。";
        }
      });
    });
  });

  // Reference analysis lenses.
  const analysisCanvas = $("#analysisCanvas");
  const analysisState = $("#analysisState");
  const analysisCopy = $("#analysisCopy");
  const analysisContent = {
    full: {
      label: "FULL FRAME",
      step: "01 / WHOLE IMAGE",
      title: "先看视觉层级",
      text: "主体处于暖光与低饱和冷环境之间；高亮区域集中，背景细节被有意压住。视线先落在面部，再沿着窗光移动到空间深处。"
    },
    luma: {
      label: "LUMINANCE / FALSE COLOR",
      step: "02 / LUMINANCE MAP",
      title: "光把视线写在画面上",
      text: "高亮区集中在面部右侧和窗光，暗部保留一定程度的环境结构。明暗层级决定了观众先看人物，再看空间。"
    },
    palette: {
      label: "PALETTE / DOMINANT COLORS",
      step: "03 / COLOR DISTRIBUTION",
      title: "冷环境承载暖主体",
      text: "大面积的深青环境降低竞争，暖肤色与实用光建立焦点。这个关系不是简单的全局青橙，而是按区域和亮度分配。"
    },
    light: {
      label: "LIGHT / DIRECTION",
      step: "04 / LIGHT PATH",
      title: "光线给出空间方向",
      text: "右侧实用光形成主光方向，人物被从冷背景中分离。暗部并非没有细节，而是被降低了视觉权重。"
    },
    texture: {
      label: "TEXTURE / FINISH",
      step: "05 / MATERIAL RESPONSE",
      title: "质感来自高光，不来自噪点总量",
      text: "高光有柔和扩散，暗部有细微颗粒，边缘并非全画面均匀锐利。质感要与镜头、尺寸和叙事时代共同判断。"
    }
  };

  function drawAnalysis(state = "full") {
    if (!analysisCanvas) return;
    const ctx = analysisCanvas.getContext("2d");
    const width = analysisCanvas.width;
    const height = analysisCanvas.height;
    drawReferenceScene(ctx, width, height, canonicalLook);

    if (state === "luma") {
      const image = ctx.getImageData(0, 0, width, height);
      for (let i = 0; i < image.data.length; i += 4) {
        const luma = image.data[i] * 0.2126 + image.data[i + 1] * 0.7152 + image.data[i + 2] * 0.0722;
        const color = luma < 38 ? [26, 27, 64] : luma < 90 ? [12, 82, 132] : luma < 165 ? [31, 158, 110] : luma < 215 ? [220, 190, 48] : [255, 63, 52];
        image.data[i] = color[0];
        image.data[i + 1] = color[1];
        image.data[i + 2] = color[2];
      }
      ctx.putImageData(image, 0, 0);
    }

    if (state === "palette") {
      ctx.fillStyle = "rgba(8,12,11,.76)";
      ctx.fillRect(0, 0, width, height);
      const colors = ["#153f3e", "#1b605b", "#c47a56", "#e7b36c", "#f5dfb7", "#0a1412"];
      const sizes = [0.22, 0.17, 0.19, 0.14, 0.1, 0.18];
      let x = 0;
      colors.forEach((color, index) => {
        const segment = width * sizes[index];
        ctx.fillStyle = color;
        ctx.fillRect(x, height * 0.27, segment, height * 0.46);
        ctx.fillStyle = index > 2 ? "#171a19" : "#f2efe6";
        ctx.font = "7px Consolas, monospace";
        ctx.fillText(color.toUpperCase(), x + 8, height * 0.74);
        x += segment;
      });
    }

    if (state === "light") {
      ctx.fillStyle = "rgba(3,8,7,.55)";
      ctx.fillRect(0, 0, width, height);
      const arrows = [[0.16,0.2],[0.75,0.26],[0.46,0.44]];
      arrows.forEach(([x, y], index) => {
        const startX = width * x;
        const startY = height * 0.06;
        const endX = width * (x + 0.08);
        const endY = height * y + 70;
        ctx.strokeStyle = index === 1 ? "#ff6846" : "#d8ff58";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(Math.atan2(endY - startY, endX - startX));
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, -4);
        ctx.lineTo(-10, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    }

    if (state === "texture") {
      ctx.fillStyle = "rgba(0,0,0,.04)";
      for (let index = 0; index < 600; index += 1) {
        const x = (index * 79) % width;
        const y = (index * 127) % height;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.strokeStyle = "rgba(216,255,88,.45)";
      ctx.strokeRect(width * 0.52, height * 0.22, width * 0.24, height * 0.45);
      ctx.fillStyle = "#d8ff58";
      ctx.font = "7px Consolas, monospace";
      ctx.fillText("HIGHLIGHT ROLL-OFF", width * 0.52, height * 0.2);
    }

    if (state === "full") {
      ctx.strokeStyle = "rgba(255,255,255,.16)";
      ctx.strokeRect(width * 0.07, height * 0.08, width * 0.86, height * 0.84);
    }

    if (analysisState) analysisState.textContent = analysisContent[state].label;
    if (analysisCopy) {
      analysisCopy.innerHTML = `<span class="analysis-step">${analysisContent[state].step}</span><h4>${analysisContent[state].title}</h4><p>${analysisContent[state].text}</p>`;
    }
  }
  drawAnalysis("full");

  $$(".analysis-tabs [data-analysis]").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".analysis-tabs [data-analysis]").forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
      drawAnalysis(tab.dataset.analysis);
    });
  });

  // Reproduction lab.
  const targetCanvas = $("#targetCanvas");
  const attemptCanvas = $("#attemptCanvas");
  const matchScore = $("#matchScore");
  const recipeCode = $("#recipeCode");
  const controls = {
    exposure: $("#reproExposure"),
    contrast: $("#reproContrast"),
    temperature: $("#reproTemperature"),
    saturation: $("#reproSaturation"),
    halation: $("#reproHalation")
  };
  const outputs = {
    exposure: $("#reproExposureOut"),
    contrast: $("#reproContrastOut"),
    temperature: $("#reproTemperatureOut"),
    saturation: $("#reproSaturationOut"),
    halation: $("#reproHalationOut")
  };

  function calculateMatch(attempt) {
    const differences = [
      Math.abs(attempt.exposure - canonicalLook.exposure) / 0.6,
      Math.abs(attempt.contrast - canonicalLook.contrast) / 1.5,
      Math.abs(attempt.temperature - canonicalLook.temperature) / 120,
      Math.abs(attempt.saturation - canonicalLook.saturation) / 0.6,
      Math.abs(attempt.halation - canonicalLook.halation) / 100
    ];
    const weighted = differences[0] * 26 + differences[1] * 22 + differences[2] * 20 + differences[3] * 19 + differences[4] * 13;
    return Math.round(clamp(100 - weighted, 0, 100));
  }

  function updateReproduction() {
    if (!targetCanvas || !attemptCanvas) return;
    const attempt = {
      exposure: Number(controls.exposure?.value || 0),
      contrast: Number(controls.contrast?.value || 0),
      temperature: Number(controls.temperature?.value || 0),
      saturation: Number(controls.saturation?.value || 1),
      halation: Number(controls.halation?.value || 0)
    };

    drawReferenceScene(targetCanvas.getContext("2d"), targetCanvas.width, targetCanvas.height, canonicalLook);
    drawReferenceScene(attemptCanvas.getContext("2d"), attemptCanvas.width, attemptCanvas.height, attempt);

    if (outputs.exposure) outputs.exposure.textContent = attempt.exposure.toFixed(2);
    if (outputs.contrast) outputs.contrast.textContent = attempt.contrast.toFixed(2);
    if (outputs.temperature) outputs.temperature.textContent = String(Math.round(attempt.temperature));
    if (outputs.saturation) outputs.saturation.textContent = attempt.saturation.toFixed(2);
    if (outputs.halation) outputs.halation.textContent = `${Math.round(attempt.halation)}%`;
    if (matchScore) matchScore.textContent = `${calculateMatch(attempt)}%`;
    if (recipeCode) {
      recipeCode.textContent = `BALANCE ${attempt.exposure >= 0 ? "+" : ""}${attempt.exposure.toFixed(2)} · CONTRAST ${attempt.contrast >= 0 ? "+" : ""}${attempt.contrast.toFixed(2)} · TEMP ${Math.round(attempt.temperature)} · SAT ${attempt.saturation.toFixed(2)} · HALATION ${Math.round(attempt.halation)}%`;
    }
  }

  Object.values(controls).forEach((input) => input?.addEventListener("input", updateReproduction));
  $("#resetRepro")?.addEventListener("click", () => {
    Object.entries(initialAttempt).forEach(([key, value]) => {
      if (controls[key]) controls[key].value = String(value);
    });
    updateReproduction();
  });
  updateReproduction();

  // Advanced node blueprint tabs.
  const nodeTabs = $$(".advanced-nodes [role='tab']");
  nodeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      nodeTabs.forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
      $$(".node-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab.dataset.tab));
    });
  });

  // Practice persistence.
  const practiceInputs = $$("[data-practice]");
  const practiceCount = $("#practiceCount");
  const savedPractice = readStorage("color-lab-02-practice", {});
  function updatePractice() {
    const complete = practiceInputs.filter((input) => input.checked).length;
    if (practiceCount) practiceCount.textContent = `${complete} / ${practiceInputs.length}`;
  }
  practiceInputs.forEach((input, index) => {
    input.checked = Boolean(savedPractice[index]);
    input.addEventListener("change", () => {
      savedPractice[index] = input.checked;
      writeStorage("color-lab-02-practice", savedPractice);
      updatePractice();
    });
  });
  updatePractice();

  // Final quiz.
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

  const printPage = () => window.print();
  $("#printButton")?.addEventListener("click", printPage);
  $("#printButtonBottom")?.addEventListener("click", printPage);
  document.addEventListener("keydown", (event) => {
    const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
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
      drawHeroCompare();
      drawAnalysis($(".analysis-tabs [aria-selected='true']")?.dataset.analysis || "full");
      updateReproduction();
    }, 120);
  });

  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  updateReadingProgress();
})();
