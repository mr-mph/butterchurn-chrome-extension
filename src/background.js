// Track active visualizer windows by source tab ID
const visualizerTabs = {};

chrome.action.onClicked.addListener(async (tab) => {
  // If visualizer already exists for this tab, focus it
  if (visualizerTabs[tab.id]) {
    try {
      await chrome.windows.update(visualizerTabs[tab.id].windowId, {
        focused: true,
      });
      return;
    } catch (e) {
      // Window was closed, clean up and create new one
      delete visualizerTabs[tab.id];
    }
  }

  // Get a stream ID for the tab's audio
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id,
  });

  // Create visualizer tab with stream ID as URL parameter
  const visualizerUrl =
    chrome.runtime.getURL("src/visualizer/index.html") +
    `?streamId=${encodeURIComponent(streamId)}&tabId=${tab.id}`;

  const renderTab = await chrome.tabs.create({
    url: visualizerUrl,
    active: false,
  });

  const window = await chrome.windows.create({
    tabId: renderTab.id,
    type: "popup",
    focused: true,
    width: 800,
    height: 600,
  });

  visualizerTabs[tab.id] = {
    renderTabId: renderTab.id,
    windowId: window.id,
    sourceTabId: tab.id,
  };
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  // Source tab was closed - close the visualizer
  if (visualizerTabs[tabId]) {
    const info = visualizerTabs[tabId];
    chrome.tabs.remove(info.renderTabId).catch(() => {});
    delete visualizerTabs[tabId];
    return;
  }

  // Visualizer tab was closed - clean up tracking
  for (const sourceTabId in visualizerTabs) {
    if (visualizerTabs[sourceTabId].renderTabId === tabId) {
      delete visualizerTabs[sourceTabId];
      break;
    }
  }
});
