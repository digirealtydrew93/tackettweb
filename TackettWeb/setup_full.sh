#!/usr/bin/env bash
set -e

ROOT="TackettWeb"
SITE="$ROOT/site"
ASSETS="$SITE/assets/css"
FUNCS="$ROOT/functions"

mkdir -p "$ASSETS" "$FUNCS" "$SITE/assets/img"

# Netlify config
cat > "$ROOT/netlify.toml" <<'EOF'
[build]
  publish = "site"
  functions = "functions"
EOF

# Landing page
cat > "$SITE/index.html" <<'EOF'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Tackett Brothers Hauling — Pallets & Scrap</title>
  <link rel="stylesheet" href="assets/css/site.css?v=6">
</head>
<body>
  <header class="header">
    <div class="logo-wrap">
      <img src="assets/img/logo.png" alt="Tackett Brothers Logo" class="logo">
      <div class="brand-text">
        <h1>Tackett Brothers Hauling</h1>
        <p>Pallets & Scrap • Columbus, OH</p>
      </div>
    </div>
  </header>

  <section class="hero hero-bg">
    <div class="hero-content">
      <h1>Need pallets or scrap gone today?</h1>
      <p>Fast, reliable hauling services — trusted across Central Ohio.</p>
      <a class="btn" href="pickup.html">Request a Pickup</a>
    </div>
  </section>

  <section class="trust">
    <ul class="trust-list">
      <li><strong>Coverage:</strong> Columbus & Central Ohio</li>
      <li><strong>Speed:</strong> Same-day / next-day pickup</li>
      <li><strong>Reliability:</strong> Professionals, on schedule</li>
    </ul>
  </section>
</body>
</html>
EOF

# Pickup form
cat > "$SITE/pickup.html" <<'EOF'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Request Pickup — Tackett Brothers Hauling</title>
  <link rel="stylesheet" href="assets/css/site.css?v=6">
</head>
<body>
  <header class="header"><h1>Request a Pickup</h1></header>
  <section class="hero">
    <form id="pickupForm" class="form">
      <div class="field">
        <label>Service type</label>
        <select id="serviceType" name="serviceType" required>
          <option value="">-- Select --</option>
          <option value="scrap">Scrap</option>
          <option value="pallets">Pallets</option>
        </select>
      </div>

      <div id="palletOptions" style="display:none;">
        <div class="field">
          <label>Pallet size</label>
          <select id="palletSize" name="palletSize">
            <option value="">-- Select --</option>
            <option value="48x40">48x40 (Standard)</option>
            <option value="48x48">48x48</option>
            <option value="9-block">9 Block</option>
            <option value="misc">Miscellaneous</option>
          </select>
        </div>
        <div class="field">
          <label>Quantity (skids)</label>
          <input type="number" id="palletQty" name="palletQty" min="1" placeholder="e.g. 25">
        </div>
      </div>

      <div id="scrapOptions" style="display:none;">
        <div class="field">
          <label>Scrap type</label>
          <select id="scrapType" name="scrapType">
            <option value="">-- Select --</option>
            <option value="metal">Metal</option>
            <option value="wood">Wood</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>Location</label>
        <input type="text" id="location" name="location" required>
      </div>

      <div class="field">
        <label>Notes</label>
        <textarea id="notes" name="notes" rows="3"></textarea>
      </div>

      <div class="field">
        <label>Preferred pickup time</label>
        <input type="datetime-local" id="pickupTime" name="pickupTime">
      </div>

      <button type="submit" class="btn">Submit</button>
    </form>
    <div id="confirmation" class="confirm" style="display:none;">✔ Request sent</div>
  </section>

<script>
const serviceSelect = document.getElementById("serviceType");
const palletDiv = document.getElementById("palletOptions");
const scrapDiv = document.getElementById("scrapOptions");

serviceSelect.addEventListener("change", function() {
  if (this.value === "pallets") {
    palletDiv.style.display = "block";
    scrapDiv.style.display = "none";
  } else if (this.value === "scrap") {
    scrapDiv.style.display = "block";
    palletDiv.style.display = "none";
  } else {
    palletDiv.style.display = "none";
    scrapDiv.style.display = "none";
  }
});

document.getElementById("pickupForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const data = {
    serviceType: form.serviceType.value,
    palletSize: form.palletSize.value,
    palletQty: form.palletQty.value,
    scrapType: form.scrapType.value,
    location: form.location.value,
    notes: form.notes.value,
    pickupTime: form.pickupTime.value
  };
  const res = await fetch("/.netlify/functions/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (res.ok) {
    document.getElementById("confirmation").style.display = "block";
  } else {
    alert("Submission failed: " + res.status);
  }
});
</script>
</body>
</html>
EOF

# CSS
cat > "$ASSETS/site.css" <<'EOF'
:root {
  --blue:#1E3A8A;
  --white:#FFFFFF;
  --ink:#0F172A;
  --bg:#F4F6F8;
}

body {font-family:'Montserrat',Segoe UI,Roboto,Arial,sans-serif;margin:0;color:var(--ink);}
.header {background:var(--blue);color:var(--white);padding:16px;}
.logo-wrap {display:flex;align-items:center;justify-content:center;gap:16px;}
.logo {height:64px;}
.brand-text h1 {margin:0;font-size:28px;font-weight:800;}
.hero-bg {background:url('assets/img/hero-bg.jpg') center/cover no-repeat;color:var(--white);text-align:center;padding:100px 20px;}
.btn {background:var(--blue);color:var(--white);padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;}
.trust {padding:24px;text-align:center;background:var(--bg);}
.trust-list {list-style:none;display:flex;gap:20px;justify-content:center;flex-wrap:wrap;padding:0;margin:0;}
.trust-list li {background:#EEF2FF;padding:12px 16px;border-radius:8px;font-size:14px;}
.form {max-width:500px;margin:auto;padding:20px;}
.field {margin-bottom:16px;}
.confirm {margin-top:16px;color:#16A34A;font-weight:700;}
EOF

# Twilio JSON-only function
cat > "$FUNCS/submit.js" <<'EOF'
const twilio = require("twilio");

exports.handler = async (event) => {
  try {
    const data = event.body ? JSON.parse(event.body) : {};

    const serviceType = data.serviceType || "";
    const palletSize  = data.palletSize || "";
    const palletQty   = data.palletQty  || "";
    const scrapType   = data.scrapType  || "";
    const location    = data.location   || "";
    const notes       = data.notes      || "";
    const pickupTime  = data.pickupTime || "";

    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

    let body = `Pickup request\nService: ${serviceType}\n`;
    if (serviceType === "pallets") {
EOF
