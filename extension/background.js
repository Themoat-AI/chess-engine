{
  "manifest_version": 3,
  "name": "Chess Engine Live Tracker",
  "version": "1.0.0",
  "description": "Track live chess games and read board state automatically.",
  "permissions": ["storage", "tabs", "activeTab"],
  "host_permissions": [
    "*://*.lichess.org/*",
    "*://*.chess.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "*://*.lichess.org/*",
        "*://*.chess.com/*"
      ],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_title": "Chess Live Tracker",
    "default_popup": "popup.html"
  }
}
