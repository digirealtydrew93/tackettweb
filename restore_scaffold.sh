#!/usr/bin/env bash
set -e

ROOT="TackettWeb"
SITE="$ROOT/site"
ASSETS="$SITE/assets/css"
FUNCS="$ROOT/functions"

mkdir -p "$ASSETS" "$FUNCS"

# netlify.toml
cat > "$ROOT/netlify.toml" <<'EOF'
[build]
  publish = "site"
  functions = "functions"
EOF

# index.html
cat > "$SITE/index.html" <<'EOF'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Tackett Brothers Hauling — Pallets & Scrap</title>
  <link rel="stylesheet" href="assets/css/site.css?v=3">
</head>
<body>
  <header class="header">
    <h1>Tackett Brothers Hauling</h1>
    <p>Pallets & Scrap • Columbus, OH</p>
  </header>
  <section class="hero">
    <h1>Need pallets or scrap gone today?</h1>
    <p>Set your pickup details and we’ll route the request directly to Tackett Brothers.</p>
    <a class="btn" href="pickup.html">Start Your Bid Request</a>
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

# pickup.html
cat > "$SITE/pickup.html" <<'EOF'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Request Pickup — Tackett Brothers Hauling</title>
  <link rel="stylesheet" href="assets/css/site.css?v=3">
</head>
<body>
  <header class="header"><h1>Request a Pickup</h1></header>
  <section class="hero">
    <form id="pickupForm" enctype="multipart/form-data" class="form">
      <div class="field">
        <label>Service type</label>
        <select id="serviceType" name="serviceType" required>
          <option value="">-- Select --</option>
          <option value="scrap">Scrap</option>
          <option value="pallets">Pallets</option>
        </select>
      </div>

      <!-- Pallet options -->
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
          <label>Quantity (number of skids)</label>
          <input type="number" id="palletQty" name="palletQty" min="1" placeholder="e.g. 25">
        </div>
      </div>

      <!-- Scrap options -->
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
        <input type="text" id="location" name="location" required placeholder="Address or business name">
        <button type="button" id="locateBtn" class="btn-secondary">Use my location</button>
      </div>

      <div class="field">
        <label>Upload photo</label>
        <input type="file" id="photo" name="photo" accept="image/*">
      </div>

      <div class="field">
        <label>Notes</label>
        <textarea id="notes" name="notes" rows="3" placeholder="Any extra details..."></textarea>
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
    document.getElementById("palletSize").setAttribute("required","required");
    document.getElementById("palletQty").setAttribute("required","required");
    document.getElementById("scrapType").removeAttribute("required");
  } else if (this.value === "scrap") {
    scrapDiv.style.display = "block";
    palletDiv.style.display = "none";
    document.getElementById("scrapType").setAttribute("required","required");
    document.getElementById("palletSize").removeAttribute("required");
    document.getElementById("palletQty").removeAttribute("required");
  } else {
    palletDiv.style.display = "none";
    scrapDiv.style.display = "none";
    document.getElementById("palletSize").removeAttribute("required");
    document.getElementById("palletQty").removeAttribute("required");
    document.getElementById("scrapType").removeAttribute("required");
  }
});

document.getElementById("locateBtn").addEventListener("click",()=>{
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(async pos=>{
      const url="https://nominatim.openstreetmap.org/reverse?format=json&lat="+pos.coords.latitude+"&lon="+pos.coords.longitude;
      const res=await fetch(url);const data=await res.json();
      document.getElementById("location").value=data.display_name||pos.coords.latitude+","+pos.coords.longitude;
    });
  }
});

document.getElementById("pickupForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const formData=new FormData(document.getElementById("pickupForm"));
  const res=await fetch("/.netlify/functions/submit",{method:"POST",body:formData});
  if(res.ok){document.getElementById("confirmation").style.display="block";}
});
</script>
</body>
</html>
EOF

# CSS
cat > "$ASSETS/site.css" <<'EOF'
:root { --blue:#1E3A8A; --white:#FFFFFF; --ink:#0F172A; --bg:#F4F6F8; --muted:#64748B; }
*{box-sizing:border-box}
body{font-family:'Montserrat',Segoe UI,Roboto,Arial,sans-serif;background:var(--white);color:var(--ink);margin:0}
.header{background:var(--blue);color:var(--white);padding:24px 16px;text-align:center}
.hero{padding:56px 16px;text-align:center;background:var(--bg)}
.btn{background:var(--blue);color:var(--white);padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;border:0;cursor:pointer}
.btn-secondary{background:#E2E8F0;color:#0F172A;padding:8px 12px;border-radius:8px;border:0;cursor:pointer;margin-left:8px}
.trust{padding:16px;text-align:center}
.trust-list{list-style:none;padding:0;margin:0;display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.trust-list li{background:#EEF2FF;padding:10px 12px;border-radius:8px;font-size:14px}
.form{max-width:560px;margin:0 auto;text-align:left}
.field{margin:14px 0}
label{display:block;margin-bottom:6px;font-weight:600}
input,select,textarea{width:100%;padding:10px 12px;border:1px solid #CBD5E1;border-radius:8px;background:#fff}
textarea{resize:

