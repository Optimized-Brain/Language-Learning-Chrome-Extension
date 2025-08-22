(function() {
  console.log("Dynamic Language Immersion content script loaded");

  // Current settings
  let settings = {
    enabled: true,
    language: 'es',
    rate: 10,
    difficulty: 1
  };

  // Learned words cache (includes session + persisted)
  let sessionLearnedWords = {};

  // Store replaced elements for revert
  let replacedElements = [];

  // Initialize extension
  function init() {
    console.log("Initializing extension");
    chrome.storage.sync.get({
      enabled: true,
      language: 'es',
      rate: 10,
      difficulty: 1,
      learnedWords: {}
    }, items => {
      settings = {
        enabled: items.enabled,
        language: items.language,
        rate: parseInt(items.rate, 10),
        difficulty: parseInt(items.difficulty, 10)
      };
      sessionLearnedWords = items.learnedWords || {};

      if (settings.enabled) {
        setTimeout(() => processPage(), 1000);
      }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateSettings') {
        settings = request.settings;
        revertChanges();
        if (settings.enabled) {
          processPage();
        }
        sendResponse({ success: true });
      } else if (request.action === 'forceRefresh') {
        revertChanges();
        if (settings.enabled) {
          processPage();
        }
        sendResponse({ success: true });
      }
      return true;
    });
  }

  async function processPage() {
    if (isExcludedPage()) return;
    console.log("Processing page with settings:", settings);

    const allText = document.body.innerText || '';
    const wordCounts = {};
    allText.split(/\b/).forEach(token => {
      const w = token.trim().toLowerCase();
      if (/^[a-zA-Z]+$/.test(w)) {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      }
    });

    const words = Object.keys(wordCounts);
    const sampleSize = Math.floor(words.length * (settings.rate / 100));
    const byDiff = words.filter(w => {
      const len = w.length;
      if (settings.difficulty === 1) return len <= 4;
      if (settings.difficulty === 2) return len > 4 && len <= 7;
      return len > 7;
    });
    shuffleArray(byDiff);
    const toTranslate = new Set(byDiff.slice(0, sampleSize));

    await processElement(document.body, toTranslate);
    console.log("Page processing complete");
  }

  async function processElement(element, toTranslate) {
    if (shouldSkipElement(element)) return;
    for (let node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        await replaceWordsInTextNode(node, toTranslate);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        await processElement(node, toTranslate);
      }
    }
  }

  async function replaceWordsInTextNode(textNode, toTranslate) {
    const text = textNode.textContent;
    const parts = text.split(/\b/);
    let didReplace = false;
    const frag = document.createDocumentFragment();

    for (let part of parts) {
      const low = part.toLowerCase();
      if (toTranslate.has(low)) {
        didReplace = true;
        const tr = await translateWord(low);
        let display = tr;
        if (part === part.toUpperCase()) display = tr.toUpperCase();
        else if (part[0] === part[0].toUpperCase())
          display = tr.charAt(0).toUpperCase() + tr.slice(1);

        const span = document.createElement('span');
        span.className = 'lang-immersion-word';
        span.textContent = display;
        span.title = `Original: ${part}`;
        span.dataset.original = part;
        span.style.textDecoration = 'underline dotted';
        span.style.cursor = 'help';
        span.style.color = 'inherit';

        frag.appendChild(span);
        replacedElements.push(span);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }

    if (didReplace && textNode.parentNode) {
      textNode.parentNode.replaceChild(frag, textNode);
    }
  }

  async function translateWord(word) {
    if (sessionLearnedWords[word]) {
      return sessionLearnedWords[word];
    }
    let translation = word;
    try {
      const src = 'en';
      const tgt = settings.language;
      const res = await fetch(`https://lingva.ml/api/v1/${src}/${tgt}/${encodeURIComponent(word)}`);
      if (res.ok) {
        const data = await res.json();
        translation = data.translation || word;
      } else {
        console.warn(`Lingva API returned status ${res.status} for '${word}'`);
      }
    } catch (err) {
      console.error('Lingva fetch error:', err);
    }

    sessionLearnedWords[word] = translation;
    // Safely send learned-word update
    chrome.runtime.sendMessage(
      { action: 'updateLearnedWord', original: word, translation },
      (response) => {
        if (chrome.runtime.lastError) {
          // Likely context invalidated; log and continue silently
          console.warn('sendMessage failed:', chrome.runtime.lastError.message);
        }
      }
    );

    return translation;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function isExcludedPage() {
    const excluded = [
      'mail.google.com', 'docs.google.com', 'drive.google.com',
      'sheets.google.com', 'slides.google.com',
      'github.com', 'gitlab.com', 'stackoverflow.com'
    ];
    return excluded.some(domain => location.hostname.includes(domain));
  }

  function shouldSkipElement(el) {
    const skipTags = ['SCRIPT','STYLE','TEXTAREA','INPUT','SELECT','OPTION','BUTTON','CODE','PRE'];
    if (skipTags.includes(el.tagName)) return true;
    if (el.getAttribute('contenteditable') === 'true') return true;
    const cls = el.className;
    if (typeof cls === 'string' && (cls.includes('editor') || cls.includes('code'))) return true;
    return false;
  }

  function revertChanges() {
    console.log("Reverting changes");
    replacedElements.forEach(el => {
      if (el.parentNode) {
        const txt = el.dataset.original || el.textContent;
        el.parentNode.replaceChild(document.createTextNode(txt), el);
      }
    });
    replacedElements = [];
  }

  init();
})();
