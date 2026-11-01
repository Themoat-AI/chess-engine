<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chess Tracker</title>
    <style>
      body {
        margin: 0;
        min-width: 320px;
        padding: 12px;
        font-family: sans-serif;
        background: #121826;
        color: #edf2ff;
      }
      h3 {
        margin-top: 0;
      }
      .meta {
        font-size: 12px;
        opacity: 0.8;
      }
      .fen {
        word-break: break-all;
        margin-top: 8px;
        border: 1px solid #2f3d5c;
        padding: 8px;
        border-radius: 8px;
        background: rgba(255,255,255,0.04);
      }
      button {
        margin-top: 12px;
        border: none;
        background: #5ea0ff;
        color: #041425;
        padding: 8px 10px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 700;
      }
      ul {
        padding-left: 18px;
        max-height: 200px;
        overflow-y: auto;
      }
    </style>
  </head>
  <body>
    <h3>Chess Live Tracker</h3>
    <div id="status" class="meta">Waiting for a board...</div>
    <div id="fen" class="fen">No FEN detected</div>
    <button id="refresh">Refresh</button>
    <h4>Moves</h4>
    <ul id="moves"></ul>
    <script src="popup.js"></script>
  </body>
</html>
