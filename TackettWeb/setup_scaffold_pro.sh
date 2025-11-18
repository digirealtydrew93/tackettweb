#!/usr/bin/env bash
set -e

ROOT="TackettWeb"
SITE="$ROOT/site"
ASSETS="$SITE/assets/css"
IMG="$SITE/assets/img"
FUNCS="$ROOT/functions"

mkdir -p "$ASSETS" "$IMG" "$FUNCS"

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
  <link rel="stylesheet" href="assets/css/site.css?v=5">
</head>
<body>
  <!-- Header with logo -->
  <header class="header">
    <div class="logo-wrap">
      <img src="assets/img/logo.png" alt="Tackett Brothers Logo" class="logo">
      <div class="brand-text">
        <h1>Tackett Brothers Hauling</h1>
        <p>Pallets & Scrap • Columbus, OH</p>
      </div>
    </div>
  </header>

  <!-- Hero section with industrial background -->
  <section class="hero hero-bg">
    <div class="hero-content">
      <h1>Need pallets or scrap gone today?</h1>
      <p>Fast, reliable hauling services — trusted across Central Ohio.</p>
      <a class="btn" href="pickup.html">Request a Pickup</a>
    </div>
  </section>

  <!-- Trust cues -->
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
  <link rel="stylesheet" href="assets/css/site.css?v=5">
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
:root {
  --blue:#1E3A8A;
  --white:#FFFFFF;
  --ink:#0F172A;
  --bg:#F4F6F8;
  --muted:#64748B;
}

body {
  font-family:'Montserrat',Segoe UI,Roboto,Arial,sans-serif;
  background:var(--white);
  color:var(--ink);
  margin:0;
}

.header {
  background:var(--blue);
  color:var(--white);
  padding:16px;
}

.logo-wrap {
  display:flex;
  align-items:center;
  justify-content:center;
  gap:16px;
}

.logo {
  height:64px;
}

.brand-text h1 {
  margin:0;
  font-size:28px;
  font-weight:800;
}

.brand-text p {
  margin:4px 0 0;
  font-size:14px;
  opacity:.9;
}

/* Hero with industrial background */
.hero-bg {
  background:url('assets/img/hero-bg.jpg') center/cover no-repeat;
  color:var(--white);
  text-align:center;
  padding:100px 20px;
}

.hero-content h1 {
  font-size:36px;
  margin-bottom:12px;
}

.hero-content p {
  font-size:18px;

