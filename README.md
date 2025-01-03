# YC Founder Emailer Chrome Extension

A Chrome extension that helps you easily find and email YC startup founders through the Work at a Startup platform.

## Features

- Automatically adds "Email founder" buttons next to founder names on Work at a Startup company pages
- Finds founder email addresses using the Voila Norbert API
- Caches found email addresses to minimize API calls
- Opens Gmail compose window with pre-filled template
- Visual checkmark indicator shows when an email is found in cache

## Installation

1. Clone this repository or download the source code
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Setup

1. Sign up for a [Voila Norbert](https://www.voilanorbert.com/) account and get your API key
2. Click the extension icon in Chrome
3. Enter your Voila Norbert API key in the settings popup
4. Click Save

## Usage

1. Visit any company page on [Work at a Startup](https://www.workatastartup.com/companies)
2. The extension will automatically add "Email founder" buttons next to founder names
3. Click the button to:
   - Look up the founder's email (if not already cached)
   - Open Gmail with a pre-filled email template
   - Add a green checkmark once the email is found

## Files

- `manifest.json` - Extension configuration and permissions
- `popup.html/js` - Settings popup UI and logic
- `content.js` - Handles DOM manipulation and button functionality
- `background.js` - Makes API calls to Voila Norbert
- `content.css` - Styles for the email buttons

## Privacy

The extension only stores:
- Your Voila Norbert API key (in Chrome sync storage)
- Found email addresses (cached locally)

No other personal data is collected or stored.

## Development

To modify the extension:
1. Make your code changes
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes on Work at a Startup

## License

MIT License - feel free to modify and reuse this code as needed.
