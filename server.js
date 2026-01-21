const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Parse CSV on startup
function loadCodes() {
  const csvPath = path.join(__dirname, 'data', 'codes.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n').slice(1); // skip header
  const codes = {};
  for (const line of lines) {
    const [url, email] = line.split(',').map(s => s.trim());
    if (email && email !== 'UNASSIGNED') {
      codes[email.toLowerCase()] = url;
    }
  }
  return codes;
}

let codes = loadCodes();

// Reload codes on each request in dev, cache in prod
function getCodes() {
  if (process.env.NODE_ENV !== 'production') {
    return loadCodes();
  }
  return codes;
}

// Serve the HTML page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>קוד Cursor למילואימניקים</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      max-width: 440px;
      width: 100%;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 8px;
      color: #111;
    }
    .subtitle {
      color: #666;
      margin-bottom: 24px;
      font-size: 0.95rem;
    }
    input[type="email"] {
      width: 100%;
      padding: 14px 16px;
      font-size: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin-bottom: 12px;
      direction: ltr;
      text-align: left;
    }
    input[type="email"]:focus {
      outline: none;
      border-color: #0066cc;
      box-shadow: 0 0 0 3px rgba(0,102,204,0.1);
    }
    button {
      width: 100%;
      padding: 14px;
      font-size: 1rem;
      font-weight: 500;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #0055aa; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    .result {
      margin-top: 20px;
      padding: 16px;
      border-radius: 8px;
      display: none;
    }
    .result.show { display: block; }
    .result.success {
      background: #e8f5e9;
      border: 1px solid #c8e6c9;
    }
    .result.error {
      background: #ffebee;
      border: 1px solid #ffcdd2;
    }
    .result a {
      color: #0066cc;
      word-break: break-all;
      direction: ltr;
      display: inline-block;
    }
    .result p {
      margin-bottom: 8px;
      color: #333;
    }
    .instructions {
      margin-top: 12px;
      font-size: 0.85rem;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>קבלו את קוד ה-Cursor שלכם</h1>
    <p class="subtitle">הכניסו את המייל שנרשמתם איתו לסדנה</p>
    
    <form id="lookup-form">
      <input type="email" id="email" placeholder="your@email.com" required autocomplete="email">
      <button type="submit">קבל קוד</button>
    </form>
    
    <div id="result" class="result"></div>
  </div>

  <script>
    const form = document.getElementById('lookup-form');
    const emailInput = document.getElementById('email');
    const result = document.getElementById('result');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim().toLowerCase();
      
      result.className = 'result';
      result.innerHTML = 'מחפש...';
      result.classList.add('show');
      
      try {
        const res = await fetch('/lookup?email=' + encodeURIComponent(email));
        const data = await res.json();
        
        if (data.url) {
          result.className = 'result show success';
          result.innerHTML = \`
            <p>הקוד שלכם:</p>
            <a href="\${data.url}" target="_blank">\${data.url}</a>
            <p class="instructions">לחצו על הקישור, התחברו ל-Cursor, ולחצו Redeem.</p>
          \`;
        } else {
          result.className = 'result show error';
          result.innerHTML = 'המייל לא נמצא במערכת. נסו שוב או פנו לטל.';
        }
      } catch (err) {
        result.className = 'result show error';
        result.innerHTML = 'שגיאה. נסו שוב.';
      }
    });
  </script>
</body>
</html>
  `);
});

// API endpoint for lookup
app.get('/lookup', (req, res) => {
  const email = (req.query.email || '').toLowerCase().trim();
  const currentCodes = getCodes();
  const url = currentCodes[email];
  res.json({ url: url || null });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
