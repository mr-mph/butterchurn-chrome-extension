var readyStateCheckInterval = setInterval(() => {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);

    let nextPreset,
      prevPreset,
      setPreset,
      setPresetList,
      currentPreset,
      presets,
      presetKeys,
      favoriteSong,
      shuffleList,
      getSemiRandomPreset;

    let presetFocused = false;
    let songFavorited = false;
    let isShuffling = false;
    let shufflePrevList = [];

    const currentPresetEl = document.getElementById("current-visualizer");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const btnInstaPrev = document.getElementById("btn-insta-prev");
    const btnInstaNext = document.getElementById("btn-insta-next");
    const btnFavorite = document.getElementById("btn-favorite");
    const iconFavorite = document.getElementById("icon-favorite");
    const btnShuffle = document.getElementById("btn-shuffle");
    const iconShuffle = document.getElementById("icon-shuffle");

    btnFavorite.addEventListener("click", () => {
      chrome.storage.sync.get(["favoritePresets"], (result) => {
        let favoritePresets = result.favoritePresets || [];
        if (songFavorited) {
          favoritePresets = favoritePresets.filter(
            (preset) => preset !== currentPreset
          );
        } else {
          favoritePresets.push(currentPreset);
        }
        songFavorited = !songFavorited;
        favoriteSong(songFavorited);
        chrome.storage.sync.set({ favoritePresets });
      });
    });

    btnShuffle.addEventListener("click", () => {
      shuffleList(!isShuffling);
    });

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

    // from https://gist.github.com/scmx/1f79adde2e9c69912fee520a246ec9e5
    let idleMouseTimer;
    let forceMouseHide = false;

    document.body.style.cursor = "none";
    document.body.addEventListener("mousemove", () => {
      if (forceMouseHide) {
        return;
      }

      document.body.style.cursor = "";
      clearTimeout(idleMouseTimer);
      idleMouseTimer = setTimeout(() => {
        document.body.style.cursor = "none";
        forceMouseHide = true;
        setTimeout(() => {
          forceMouseHide = false;
        }, 200);
      }, 1000);
    });

    setTimeout(hideMenu, 3000);

    menu.addEventListener("mouseenter", showMenu);
    menu.addEventListener("mouseleave", hideMenu);

    const presetListEl = document.getElementById("preset-list");

    presetListEl.addEventListener("change", (e) => {
      setPresetList(e.target.value);
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

    const setVisualizerSize = () => {
      const vizWidth = window.innerWidth;
      const vizHeight = window.innerHeight;

      canvas.width = vizWidth;
      canvas.height = vizHeight;
      visualizer.setRendererSize(vizWidth, vizHeight);

      noAudioOverlay.style.width = `${vizWidth}px`;
      noAudioOverlay.style.height = `${vizHeight}px`;
    };

    setPresetList = (value) => {
      let currentPreset;
      if (value === "all") {
        presets = allButterchurnPresets.default;
        presetKeys = Object.keys(presets);
        currentPreset = "ORB - Waaa";
        setPreset(currentPreset, 0);
      } else if (value === "curated") {
        presetKeys = [
          // handpicked by me
          "cope - digital sea",
          "ORB - Waaa",
          "27",
          "martin [shadow harlequins shape code] - fata morgana",
          "_Mig_COLORFUL9",
          "$$$ Royal - Mashup (177)",
          "$$$ Royal - Mashup (417)",
          "Geiss - 3 layers (Tunnel Mix)",
          "ORB - Pastel Primer",
          "Rovastar - Explosive Minds",
          "Zylot - True Visionary (Final Mix)",
          "Geiss - Feedback 2",
          "Aderrasi - Veil of Steel (Steel Storm) - mash0000 - bob ross finally loses it",
          "$$$ Royal - Mashup (197)",
          "ORB - Sandblade",
          "ORB - Solar Radiation",
          "Geiss - Cauldron - painterly 2 (saturation remix)",
          "flexi + geiss - pogo cubes vs. tokamak vs. game of life [stahls jelly 4.5 finish]",
          "158",
          "_Mig_085",
          "Eo.S. - glowsticks v2 03 music",
        ];
        presets = Object.keys(allButterchurnPresets.default)
          .filter((key) => presetKeys.includes(key))
          .reduce((acc, key) => {
            acc[key] = allButterchurnPresets.default[key];
            return acc;
          }, {});
        currentPreset = "27";
        setPreset(currentPreset, 0);
      } else if (value === "favorites") {
        chrome.storage.sync.get(["favoritePresets"], (result) => {
          presetKeys = result.favoritePresets || [];
          currentPreset = presetKeys.at(0);
          presets = Object.keys(allButterchurnPresets.default)
            .filter((key) => presetKeys.includes(key))
            .reduce((acc, key) => {
              acc[key] = allButterchurnPresets.default[key];
              return acc;
            }, {});
          if (presetKeys.length === 0) {
            currentPreset = "No favorites yet";
            presetKeys = ["No favorites yet"];
            presets = { "No favorites yet": {} };
          }
          setPreset(currentPreset, 0);
        });
      }
    };

    setPreset = (visName, blendTime) => {
      currentPreset = visName;
      visualizer.loadPreset(presets[visName], blendTime);
      currentPresetEl.innerText = visName;
      chrome.storage.sync.get(["favoritePresets"], (result) => {
        if (result.favoritePresets.includes(visName)) {
          favoriteSong(true);
        } else {
          favoriteSong(false);
        }
      });
    };

    getSemiRandomPreset = () => {
      let semiRandomPreset;
      let doneShuffling = false;
      let recent = shufflePrevList.slice(Math.ceil(shufflePrevList.length / 2));
      if (shufflePrevList.length <= 1) {
        recent = [];
      }
      while (!doneShuffling) {
        semiRandomPreset = presetKeys.at(
          Math.round((presetKeys.length - 1) * Math.random())
        );
        if (!recent.includes(semiRandomPreset)) {
          doneShuffling = true;
        }
      }
      return semiRandomPreset;
    };

    nextPreset = (blendTime) => {
      let visName;
      if (isShuffling) {
        visName = getSemiRandomPreset();
        shufflePrevList.push(currentPreset);
      } else {
        const index = presetKeys.indexOf(currentPreset);
        if (index == presetKeys.length - 1) {
          visName = presetKeys.at(0);
        } else {
          visName = presetKeys.at(index + 1);
        }
      }
      setPreset(visName, blendTime);
    };

    prevPreset = (blendTime) => {
      let visName;
      if (isShuffling) {
        if (shufflePrevList.length === 0) {
          visName = getSemiRandomPreset();
        } else {
          visName = shufflePrevList.pop();
        }
      } else {
        const index = presetKeys.indexOf(currentPreset);
        visName = presetKeys.at(index - 1);
      }
      setPreset(visName, blendTime);
    };

    favoriteSong = (favorite) => {
      if (favorite) {
        songFavorited = true;
        iconFavorite.classList.add("fas");
        iconFavorite.classList.remove("far");
      } else {
        songFavorited = false;
        iconFavorite.classList.add("far");
        iconFavorite.classList.remove("fas");
      }
    };

    shuffleList = (shuffle) => {
      if (shuffle) {
        isShuffling = true;
        iconShuffle.classList.add("fa-shuffle");
        iconShuffle.classList.remove("fa-repeat");
      } else {
        isShuffling = false;
        iconShuffle.classList.add("fa-repeat");
        iconShuffle.classList.remove("fa-shuffle");
      }
    };

    setVisualizerSize();
    setPresetList("curated");

    // Parse stream ID from URL and set up audio capture
    const urlParams = new URLSearchParams(window.location.search);
    const streamId = urlParams.get("streamId");
    const sourceTabId = parseInt(urlParams.get("tabId"), 10);

    let audioContext = null;
    let analyser = null;
    let analyserL = null;
    let analyserR = null;
    let renderLoopId = null;
    let isRendering = false;

    async function initAudioCapture() {
      if (!streamId) {
        console.error("No stream ID provided");
        noAudioOverlay.style.display = "flex";
        return;
      }

      try {
        // Get the audio stream using the stream ID from tabCapture
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: "tab",
              chromeMediaSourceId: streamId,
            },
          },
          video: false,
        });

        // Set up audio context and analysers
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);

        // Connect to destination so audio plays through
        source.connect(audioContext.destination);

        // Create analysers
        analyser = audioContext.createAnalyser();
        analyser.smoothingTimeConstant = 0.0;
        analyser.fftSize = 1024;

        analyserL = audioContext.createAnalyser();
        analyserL.smoothingTimeConstant = 0.0;
        analyserL.fftSize = 1024;

        analyserR = audioContext.createAnalyser();
        analyserR.smoothingTimeConstant = 0.0;
        analyserR.fftSize = 1024;

        // Split stereo channels
        const splitter = audioContext.createChannelSplitter(2);

        source.connect(analyser);
        source.connect(splitter);
        splitter.connect(analyserL, 0);
        splitter.connect(analyserR, 1);

        // Start rendering
        startRenderLoop();
        noAudioOverlay.style.display = "none";
        isRendering = true;
      } catch (error) {
        console.error("Failed to capture audio:", error);
        noAudioOverlay.style.display = "flex";
      }
    }

    function startRenderLoop() {
      let lastTime = performance.now();

      function render() {
        const timeByteArray = new Uint8Array(1024);
        const timeByteArrayL = new Uint8Array(1024);
        const timeByteArrayR = new Uint8Array(1024);

        analyser.getByteTimeDomainData(timeByteArray);
        analyserL.getByteTimeDomainData(timeByteArrayL);
        analyserR.getByteTimeDomainData(timeByteArrayR);

        const currentTime = performance.now();
        const elapsedTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        visualizer.render({
          elapsedTime: elapsedTime,
          audioLevels: {
            timeByteArray: Array.from(timeByteArray),
            timeByteArrayL: Array.from(timeByteArrayL),
            timeByteArrayR: Array.from(timeByteArrayR),
          },
        });

        renderLoopId = requestAnimationFrame(render);
      }

      render();
    }

    function stopRenderLoop() {
      if (renderLoopId) {
        cancelAnimationFrame(renderLoopId);
        renderLoopId = null;
      }
    }

    // Initialize audio capture
    initAudioCapture();

    // Handle visibility changes to pause/resume rendering
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && isRendering) {
        stopRenderLoop();
      } else if (!document.hidden && isRendering && analyser) {
        startRenderLoop();
      }
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

    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
      stopRenderLoop();
      if (audioContext) {
        audioContext.close();
      }
    });
  }
}, 10);
