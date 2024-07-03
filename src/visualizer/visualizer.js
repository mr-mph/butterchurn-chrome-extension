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
      favoriteSong;

    let presetFocused = false;
    let songFavorited = false;

    const currentPresetEl = document.getElementById("current-visualizer");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const btnInstaPrev = document.getElementById("btn-insta-prev");
    const btnInstaNext = document.getElementById("btn-insta-next");
    const btnFavorite = document.getElementById("btn-favorite");
    const iconFavorite = document.getElementById("icon-favorite");

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
      var currentPreset = "$$$ Royal - Mashup (197)";
      if (value === "all") {
        presets = allButterchurnPresets.default;
        presetKeys = Object.keys(presets);
        setPreset(currentPreset, 0);
      } else if (value === "curated") {
        presetKeys = [
          "27",
          "158",
          "_Mig_085",
          "Eo.S. - glowsticks v2 03 music",
          "$$$ Royal - Mashup (197)",
          "flexi + geiss - pogo cubes vs. tokamak vs. game of life [stahls jelly 4.5 finish]",
          "Geiss - Cauldron - painterly 2 (saturation remix)",
          "martin [shadow harlequins shape code] - fata morgana",
          "ORB - Waaa",
          "Rovastar - Oozing Resistance",
          "Zylot - True Visionary (Final Mix)",
        ];
        presets = Object.keys(allButterchurnPresets.default)
          .filter((key) => presetKeys.includes(key))
          .reduce((acc, key) => {
            acc[key] = allButterchurnPresets.default[key];
            return acc;
          }, {});
        setPreset(currentPreset, 0);
      } else if (value === "favorites") {
        chrome.storage.sync.get(["favoritePresets"], (result) => {
          presetKeys = result.favoritePresets || [];
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

    nextPreset = (blendTime) => {
      const index = presetKeys.indexOf(currentPreset);
      let visName;
      if (index == presetKeys.length - 1) {
        visName = presetKeys.at(0);
      } else {
        visName = presetKeys.at(index + 1);
      }
      setPreset(visName, blendTime);
    };

    prevPreset = (blendTime) => {
      const index = presetKeys.indexOf(currentPreset);
      const visName = presetKeys.at(index - 1);
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

    setVisualizerSize();
    setPresetList("all");

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
