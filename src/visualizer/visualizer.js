var readyStateCheckInterval = setInterval(() => {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);

    let presetFocused = false;

    const currentPresetEl = document.getElementById("current-visualizer");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const btnInstaPrev = document.getElementById("btn-insta-prev");
    const btnInstaNext = document.getElementById("btn-insta-next");

    currentPresetEl.addEventListener("click", () => {
      currentPresetEl.setAttribute("contenteditable", "true");
      currentPresetEl.focus();
      presetFocused = true;
    });

    currentPresetEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        currentPresetEl.blur();
      }
    });

    currentPresetEl.addEventListener("blur", () => {
      currentPresetEl.removeAttribute("contenteditable");
      presetFocused = false;
      setPreset(currentPresetEl.innerText, 0);
    });

    const menu = document.getElementById("menu");

    const hideMenu = () => {
      if (!presetFocused) {
        menu.classList.add("hidden");
      }
    };

    const showMenu = () => {
      menu.classList.remove("hidden");
    };

    setTimeout(hideMenu, 3000);

    menu.addEventListener("mouseenter", showMenu);
    menu.addEventListener("mouseleave", hideMenu);

    const noAudioOverlay = document.getElementById("noAudioOverlay");
    const canvas = document.getElementById("canvas");
    const visualizer = butterchurn.default.createVisualizer(null, canvas, {
      width: 800,
      height: 600,
      mesh_width: 64,
      mesh_height: 48,
      pixelRatio: window.devicePixelRatio || 1,
      textureRatio: 1,
    });
    visualizer.loadExtraImages(imageDataButterchurnPresets.default);

    const presets = allButterchurnPresets.default;
    const presetKeys = Object.keys(presets);
    let currentPreset = "";
    let nextPreset, prevPreset, setPreset;

    const setVisualizerSize = () => {
      const vizWidth = window.innerWidth;
      const vizHeight = window.innerHeight;

      canvas.width = vizWidth;
      canvas.height = vizHeight;
      visualizer.setRendererSize(vizWidth, vizHeight);

      noAudioOverlay.style.width = `${vizWidth}px`;
      noAudioOverlay.style.height = `${vizHeight}px`;
    };

    setPreset = (visName, blendTime) => {
      currentPreset = visName;
      visualizer.loadPreset(presets[visName], blendTime);
      currentPresetEl.innerText = visName;
    };

    nextPreset = (blendTime) => {
      const index = presetKeys.indexOf(currentPreset);
      const visName = presetKeys.at(index + 1);
      setPreset(visName, blendTime);
    };

    prevPreset = (blendTime) => {
      const index = presetKeys.indexOf(currentPreset);
      const visName = presetKeys.at(index - 1);
      setPreset(visName, blendTime);
    };

    setVisualizerSize();
    setPreset("$$$ Royal - Mashup (197)", 0);

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === "startRendering") {
        noAudioOverlay.style.display = "none";
      } else if (request.type === "stopRendering") {
        noAudioOverlay.style.display = "flex";
      } else if (request.type === "audioData") {
        visualizer.render(request.data);
      }

      sendResponse();
    });

    document.addEventListener("keydown", (e) => {
      if (presetFocused) {
        return;
      }
      if (e.key === "ArrowRight") {
        nextPreset(5.7);
      } else if (e.key === "ArrowLeft") {
        prevPreset(5.7);
      } else if (e.key === ".") {
        nextPreset(0);
      } else if (e.key === ",") {
        prevPreset(0);
      }
    });

    btnPrev.addEventListener("click", () => {
      prevPreset(5.7);
    });

    btnNext.addEventListener("click", () => {
      nextPreset(5.7);
    });

    btnInstaPrev.addEventListener("click", () => {
      prevPreset(0);
    });

    btnInstaNext.addEventListener("click", () => {
      nextPreset(0);
    });

    window.addEventListener("resize", () => {
      setVisualizerSize();
    });
  }
}, 10);
