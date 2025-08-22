chrome.runtime.onInstalled.addListener(function() {
    console.log("Dynamic Language Immersion extension installed");
    
    // Initialize default settings
    chrome.storage.sync.set({
      enabled: true,
      language: 'es',
      rate: 80,
      difficulty: 1,
      learnedWords: {},
      replacementCount: 0
    }, function() {
      console.log("Default settings initialized");
    });
  });
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "updateLearnedWord") {
      chrome.storage.sync.get(['learnedWords', 'replacementCount'], function(data) {
        const learnedWords = data.learnedWords || {};
        const replacementCount = (data.replacementCount || 0) + 1;
        
        // Only add if it's a new word
        if (!learnedWords[request.original]) {
          learnedWords[request.original] = request.translation;
        }
        
        chrome.storage.sync.set({
          learnedWords: learnedWords,
          replacementCount: replacementCount
        }, function() {
          sendResponse({success: true});
        });
      });
      return true; // Indicates we'll respond asynchronously
    } else if (request.action === "logMessage") {
      console.log("Content script log:", request.message);
      sendResponse({success: true});
    } else if (request.action === "updateReplacementCount") {
      chrome.storage.sync.get('replacementCount', function(data) {
        const replacementCount = (data.replacementCount || 0) + request.count;
        
        // Direct write without throttling concerns
chrome.storage.local.set({ learnedWords: updatedWords }, () => {
  if (chrome.runtime.lastError) {
    console.error('Local write failed:', chrome.runtime.lastError);
  }
});

      });
      return true; // Indicates we'll respond asynchronously
    }
  });
  