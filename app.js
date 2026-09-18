// ---- Coalition Technologies Patient Data API (Basic auth is encoded in loadPatients) ----
const CONFIG = {
  API_URL: "https://fedskillstest.coalitiontechnologies.workers.dev",
  USERNAME: "coalition",
  PASSWORD: "skills-test",
  TARGET_PATIENT: "Jessica Taylor",
};

// Local patient photos keyed by the API's patient names; anyone not listed uses the API's profile_picture.
const PHOTOS = {
  "Emily Williams": "images/L1.png", "Ryan Johnson": "images/L2.png", "Brandon Mitchell": "images/L3.png",
  "Jessica Taylor": "images/L4.png", "Samantha Johnson": "images/L5.png", "Ashley Martinez": "images/L5_5.png",
  "Olivia Brown": "images/L6.png", "Tyler Davis": "images/L7.png", "Kevin Anderson": "images/L8.png",
  "Dylan Thompson": "images/L9.png", "Nathan Evens": "images/L10.png", "Mike Nolan": "images/L11.png",
};
const photoOf = (p) => PHOTOS[p.name] || p.profile_picture || "";

const $ = (id) => document.getElementById(id);
let patients = [], chart;

async function loadPatients() {
  const res = await fetch(CONFIG.API_URL, {
    headers: { Authorization: "Basic " + btoa(`${CONFIG.USERNAME}:${CONFIG.PASSWORD}`) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

function renderList() {
  const ul = $("patient-list");
  ul.innerHTML = "";
  patients.forEach((p, i) => {
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.alt = "";
    img.src = photoOf(p);
    const meta = document.createElement("div");
    meta.className = "meta";
    const name = document.createElement("b");
    name.textContent = p.name;
    const info = document.createElement("small");
    info.textContent = `${p.gender}, ${p.age}`;
    meta.append(name, info);
    const dots = document.createElement("span");
    dots.className = "dots";
    dots.textContent = "•••";
    li.append(img, meta, dots);
    li.onclick = () => select(i);
    ul.appendChild(li);
  });
}

// The API mixes "1996-08-23" and "08/23/1996"; both become "August 23, 1996".
// Built from parts so the time zone can't shift the day.
const formatDate = (raw) => {
  const text = String(raw ?? "");
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const [y, m, d] = iso ? [iso[1], iso[2], iso[3]] : us ? [us[3], us[1], us[2]] : [];
  if (!y) return raw;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const set = (id, v) => ($(id).textContent = v ?? "--");
const level = (id, l) => {
  const arrow = /higher/i.test(l || "") ? "▲ " : /lower/i.test(l || "") ? "▼ " : "";
  set(id, l && arrow + l);
};

function select(i) {
  const p = patients[i];
  [...$("patient-list").children].forEach((li, j) => li.classList.toggle("active", i === j));

  $("p-photo").src = photoOf(p);
  set("p-name", p.name);
  set("p-dob", formatDate(p.date_of_birth));
  set("p-gender", p.gender);
  $("p-gender-ico").src = /^m/i.test(p.gender) ? "images/R2m.png" : "images/R2f.png";
  set("p-phone", p.phone_number);
  set("p-emerg", p.emergency_contact);
  set("p-ins", p.insurance_type);

  const hist = (p.diagnosis_history || []).slice(0, 6).reverse();
  const latest = hist[hist.length - 1] || {};
  const bp = latest.blood_pressure || {};
  set("sys-val", bp.systolic?.value); level("sys-lvl", bp.systolic?.levels);
  set("dia-val", bp.diastolic?.value); level("dia-lvl", bp.diastolic?.levels);
  set("resp-val", latest.respiratory_rate && latest.respiratory_rate.value + " bpm");
  level("resp-lvl", latest.respiratory_rate?.levels);
  set("temp-val", latest.temperature && latest.temperature.value + "°F");
  level("temp-lvl", latest.temperature?.levels);
  set("heart-val", latest.heart_rate && latest.heart_rate.value + " bpm");
  level("heart-lvl", latest.heart_rate?.levels);

  const labels = hist.map((h) => `${h.month.slice(0, 3)}, ${h.year}`);
  if (chart) chart.destroy();
  chart = new Chart($("bp-chart"), {
    type: "line",
    data: { labels, datasets: [
      { label: "Systolic", data: hist.map((h) => h.blood_pressure.systolic.value), borderColor: "#E66FD2", backgroundColor: "#E66FD2", tension: 0.4, pointRadius: 6, pointBorderColor: "#fff", pointBorderWidth: 2 },
      { label: "Diastolic", data: hist.map((h) => h.blood_pressure.diastolic.value), borderColor: "#705AAA", backgroundColor: "#705AAA", tension: 0.4, pointRadius: 6, pointBorderColor: "#fff", pointBorderWidth: 2 },
    ] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { y: { min: 60, max: 180, ticks: { stepSize: 20, font: { size: 11 } }, grid: { color: "#CBC8D4" }, border: { display: false } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } } } },
  });

  $("diag-body").innerHTML = "";
  (p.diagnostic_list || []).forEach((d) => {
    const tr = document.createElement("tr");
    [d.name, d.description, d.status].forEach((t) => {
      const td = document.createElement("td"); td.textContent = t; tr.appendChild(td);
    });
    $("diag-body").appendChild(tr);
  });

  $("lab-list").innerHTML = "";
  (p.lab_results || []).forEach((l) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = l;
    const icon = document.createElement("img");
    icon.className = "dl";
    icon.src = "images/RB1.png";
    icon.alt = "Download";
    icon.width = icon.height = 20;
    li.append(label, icon);
    $("lab-list").appendChild(li);
  });
}

(async function init() {
  try {
    patients = await loadPatients(); // every patient, exactly as the API returns them
    renderList();
    const idx = patients.findIndex((p) => p.name === CONFIG.TARGET_PATIENT);
    select(idx >= 0 ? idx : 0);
  } catch (e) {
    const msg = document.createElement("p");
    msg.className = "error";
    msg.textContent = `Failed to load data: ${e.message}`;
    document.querySelector(".page").appendChild(msg);
  }
})();
