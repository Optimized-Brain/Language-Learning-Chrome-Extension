# Dynamic Language Immersion

Learn vocabulary by replacing words on webpages with their equivalents in your target language.

## Description

The Dynamic Language Immersion extension is a tool designed to help you expand your foreign language vocabulary naturally while browsing the web. It works by identifying words on a webpage and, based on your configured settings, replaces a percentage of those words with their translations in your target language. This provides an immersive learning experience, exposing you to new words in context.

## Features

*   **Configurable Immersion Rate:** Control the percentage of words replaced on a page to adjust the intensity of the immersion.
*   **Difficulty Levels:** Choose from different difficulty levels to target words of varying lengths and complexity.
*   **Supports Multiple Languages:** Select your target language for translation. (Initial implementation seems to use Spanish by default, but can be extended).
*   **Learned Word Tracking:** The extension keeps track of words you've encountered and translated, reducing the need for repeated translations.
*   **Hover to Reveal Original:** Hovering over a translated word reveals the original word, allowing you to easily check your understanding.
*   **Exclusion List:** Avoid immersion on certain websites (e.g., email, documentation sites) where translation might be disruptive.

## Installation

This extension is intended to be installed as a Chrome extension.

### From Chrome Web Store (Coming Soon)

Once published, you will be able to install the extension directly from the Chrome Web Store.

### From Source

1.  Clone this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode" in the top right corner.
4.  Click "Load unpacked" and select the directory where you cloned the repository.

## Usage

1.  Install the extension.
2.  Click on the extension icon in your browser toolbar to open the popup.
3.  In the popup, you can configure the following settings:
    *   **Enable/Disable:** Toggle the extension on or off.
    *   **Target Language:** Select the language you want to learn.
    *   **Immersion Rate:** Adjust the percentage of words to be replaced.
    *   **Difficulty:** Choose the difficulty level to target words of a certain length.
4.  Navigate to any webpage (except those on the exclusion list).
5.  The extension will process the page and replace words according to your settings.
6.  Hover over a translated word to see the original word.
