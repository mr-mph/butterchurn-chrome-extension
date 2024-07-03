var readyStateCheckInterval = setInterval(() => {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);

    const currentPresetEl = document.getElementById("current-visualizer");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const btnInstaPrev = document.getElementById("btn-insta-prev");
    const btnInstaNext = document.getElementById("btn-insta-next");

    currentPresetEl.addEventListener("click", () => {
      currentPresetEl.setAttribute("contenteditable", "true");
      currentPresetEl.focus();
    });
    currentPresetEl.addEventListener("blur", () => {
      currentPresetEl.removeAttribute("contenteditable");
    });

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
    let presetCycle = true;
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

    const promptForMode = () => {
      // set visualizer to what the user wants
      const visName = prompt("What visualizer?");

      try {
        const presetIdx = presets[visName];
        currentPreset = visName;
        visualizer.loadPreset(presetIdx, 0);
      } catch (e) {
        alert("Invalid mode");
      }
    };

    setPreset = (visName, blendTime) => {
      currentPreset = visName;
      visualizer.loadPreset(presets[visName], blendTime);
      currentPresetEl.innerText = visName;
    };

    nextPreset = (blendTime) => {
      const index = presetKeys.indexOf(currentPreset);
      const visName = presetKeys[index + 1];
      setPreset(visName, blendTime);
    };

    prevPreset = (blendTime) => {
      const index = presetKeys.indexOf(currentPreset);
      const visName = presetKeys[index - 1];
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
      if (e.key === "ArrowRight") {
        nextPreset(5.7);
      } else if (e.key === "ArrowLeft") {
        prevPreset(5.7);
      } else if (e.key === ".") {
        nextPreset(0);
      } else if (e.key === ",") {
        prevPreset(0);
      } else if (e.key === "q") {
        promptForMode();
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
