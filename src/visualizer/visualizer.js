var readyStateCheckInterval = setInterval(() => {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);

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
    const presetIndexHist = [];
    let presetCycle = true;
    let nextPreset,
      prevPreset,
      restartCycleInterval,
      cycleInterval,
      toggleRandomize;

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
        presetIndexHist.push(visName);
        visualizer.loadPreset(presetIdx, 0);
      } catch (e) {
        alert("Invalid mode");
      }
    };

    nextPreset = (blendTime) => {
      const index = presetKeys.indexOf(presetIndexHist.at(-1));
      const visName = presetKeys[index + 1];
      const presetIdx = presets[visName];
      console.log(visName);
      presetIndexHist.push(visName);
      visualizer.loadPreset(presetIdx, blendTime);
      restartCycleInterval();
    };

    prevPreset = (blendTime) => {
      let presetIdx;
      if (presetIndexHist.length > 0) {
        presetIndexHist.pop();

        if (presetIndexHist.length > 0) {
          presetIdx = presets[presetIndexHist.at(-1)];
        } else {
          presetIdx =
            presets[presetKeys[Math.floor(presetKeys.length * Math.random())]];
        }
      } else {
        presetIdx =
          presets[presetKeys[Math.floor(presetKeys.length * Math.random())]];
      }

      visualizer.loadPreset(presetIdx, blendTime);
      restartCycleInterval();
    };

    restartCycleInterval = () => {
      // if (cycleInterval) {
      //   clearInterval(cycleInterval);
      //   cycleInterval = null;
      // }
      // if (presetCycle) {
      //   cycleInterval = setInterval(() => {
      //     nextPreset(2.7);
      //   }, 24000);
      // }
    };

    toggleRandomize = () => {
      presetCycle = !presetCycle;
      restartCycleInterval();
    };

    setVisualizerSize();
    const presetIdx = presets["$$$ Royal - Mashup (197)"];
    presetIndexHist.push("$$$ Royal - Mashup (197)");
    visualizer.loadPreset(presetIdx, 0);

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
      if (e.which === 32 || e.which === 39) {
        // SPACE or ->
        nextPreset(5.7);
      } else if (e.which === 8 || e.which === 37) {
        // BACKSPACE or <-
        prevPreset(5.7);
      } else if (e.which === 72 || e.which === 190) {
        // H or .
        nextPreset(0);
      } else if (e.which === 188) {
        // ,
        prevPreset(0);
        // } else if (e.which === 82) {
        //   // R
        //   toggleRandomize();
      } else if (e.which === 81) {
        // Q
        promptForMode();
      }
    });

    window.addEventListener("resize", () => {
      setVisualizerSize();
    });
  }
}, 10);
