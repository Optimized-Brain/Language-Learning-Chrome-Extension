document.addEventListener('DOMContentLoaded', function() {
  const status = document.getElementById('status');
  
  // Load saved settings
  chrome.storage.sync.get({
    enabled: true,
    language: 'es',
    rate: 80,
    difficulty: 1,
    learnedWords: {},
    replacementCount: 0
  }, function(items) {
    document.getElementById('enableExtension').checked = items.enabled;
    document.getElementById('targetLanguage').value = items.language;
    document.getElementById('replacementRate').value = items.rate;
    document.getElementById('rateValue').textContent = items.rate;
    document.getElementById('wordDifficulty').value = items.difficulty;
    updateDifficultyLabel(items.difficulty);
    displayLearnedWords(items.learnedWords);
    document.getElementById('replacementCounter').textContent = `Words replaced: ${items.replacementCount}`;
    
    status.textContent = items.enabled ? 'Extension active' : 'Extension disabled';
  });

  // Update rate value display
  document.getElementById('replacementRate').addEventListener('input', function() {
    document.getElementById('rateValue').textContent = this.value;
  });

  // Update difficulty label
  document.getElementById('wordDifficulty').addEventListener('input', function() {
    updateDifficultyLabel(this.value);
  });

  // Apply settings
  document.getElementById('applyButton').addEventListener('click', function() {
    const enabled = document.getElementById('enableExtension').checked;
    const language = document.getElementById('targetLanguage').value;
    const rate = document.getElementById('replacementRate').value;
    const difficulty = document.getElementById('wordDifficulty').value;

    chrome.storage.sync.set({
      enabled: enabled,
      language: language,
      rate: rate,
      difficulty: difficulty
    }, function() {
      // Send message to update any open tabs
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "updateSettings",
            settings: {enabled, language, rate, difficulty}
          }, function(response) {
            // Check if the content script responded
            if (chrome.runtime.lastError) {
              console.log("Error sending message:", chrome.runtime.lastError);
              status.textContent = "Error: Content script not responding";
              status.style.color = "#f44336";
            } else if (response && response.success) {
              status.textContent = enabled ? "Settings applied! Extension active" : "Extension disabled";
              status.style.color = "#4CAF50";
            }
          });
        }
      });
      
      // Visual feedback
      const button = document.getElementById('applyButton');
      button.textContent = 'Settings Saved!';
      setTimeout(() => {
        button.textContent = 'Apply Settings';
      }, 1500);
    });
  });

  // Debug button to refresh the current page's content
  document.getElementById('debugButton').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "forceRefresh"
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.log("Error sending message:", chrome.runtime.lastError);
            status.textContent = "Error: Content script not responding";
            status.style.color = "#f44336";
            
            // Try injecting the content script
            chrome.scripting.executeScript({
              target: {tabId: tabs[0].id},
              files: ['content.js']
            }, function() {
              if (chrome.runtime.lastError) {
                console.log("Error injecting script:", chrome.runtime.lastError);
              } else {
                status.textContent = "Content script reinjected. Try refreshing the page.";
                status.style.color = "#FFA500";
              }
            });
          } else if (response && response.success) {
            status.textContent = "Page refreshed with new translations!";
            status.style.color = "#4CAF50";
            
            // Update replacement counter
            chrome.storage.sync.get('replacementCount', function(data) {
              document.getElementById('replacementCounter').textContent = `Words replaced: ${data.replacementCount || 0}`;
            });
          }
        });
      }
    });
  });

  function updateDifficultyLabel(value) {
    const label = document.getElementById('difficultyValue');
    switch(parseInt(value)) {
      case 1:
        label.textContent = 'Beginner';
        break;
      case 2:
        label.textContent = 'Intermediate';
        break;
      case 3:
        label.textContent = 'Advanced';
        break;
    }
  }

  function displayLearnedWords(words) {
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';
    
    if (Object.keys(words).length === 0) {
      wordList.innerHTML = '<p>No words learned yet. Start browsing!</p>';
      return;
    }
    
    for (const [original, translation] of Object.entries(words)) {
      const wordItem = document.createElement('div');
      wordItem.className = 'word-item';
      wordItem.innerHTML = `
        <span>${original}</span>
        <span>→ ${translation}</span>
      `;
      wordList.appendChild(wordItem);
    }
  }
});