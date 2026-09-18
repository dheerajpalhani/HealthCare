// ---- API configuration: fill these in once the API details are available ----
const CONFIG = {
  API_URL: "https://fedskillstest.coalitiontechnologies.workers.dev",       // e.g. the Patient Data API endpoint
  USERNAME: "coalition",      // Basic auth username
  PASSWORD: "skills-test",      // Basic auth password
  TARGET_PATIENT: "Jessica Taylor",
};

const SAMPLE = [{
  name: "Jessica Taylor", gender: "Female", age: 28, profile_picture: "",
  date_of_birth: "1996-08-23", phone_number: "(415) 555-1234",
  emergency_contact: "(415) 555-5678", insurance_type: "Sunrise Health Assurance",
  diagnosis_history: [
    ["October", 2023, 120, 110, 78, 96, 98.6], ["November", 2023, 115, 86, 72, 88, 98.4],
    ["December", 2023, 160, 108, 78, 96, 98.6], ["January", 2024, 110, 72, 73, 87, 98.2],
    ["February", 2024, 150, 90, 74, 90, 98.5], ["March", 2024, 160, 78, 20, 98, 98.6],
  ].map(([month, year, s, d, hr, rr, t]) => ({
    month, year,
    blood_pressure: { systolic: { value: s, levels: s > 140 ? "Higher than Average" : "Normal" },
                      diastolic: { value: d, levels: d < 80 ? "Lower than Average" : "Normal" } },
    heart_rate: { value: hr, levels: "Normal" },
    respiratory_rate: { value: rr, levels: "Normal" },
    temperature: { value: t, levels: "Normal" },
  })),
  diagnostic_list: [
    { name: "Hypertension", description: "Chronic high blood pressure", status: "Under Observation" },
    { name: "Type 2 Diabetes", description: "Insulin resistance and elevated blood sugar", status: "Cured" },
    { name: "Asthma", description: "Recurrent episodes of bronchial constriction", status: "Inactive" },
  ],
  lab_results: ["Blood Tests", "CT Scans", "Radiology Reports", "X-Rays", "Urine Test"],
}];

const OTHERS = [["Emily Williams","Female",18],["Ryan Johnson","Male",45],["Brandon Mitchell","Male",36],
  ["Samantha Johnson","Female",56],["Ashley Martinez","Female",54],["Olivia Brown","Female",32],["Tyler Davis","Male",19],
  ["Kevin Anderson","Male",30],["Dylan Thompson","Male",36],["Nathan Evans","Male",58],["Mike Nolan","Male",31]];
OTHERS.forEach(([name, gender, age]) => SAMPLE.push({ ...SAMPLE[0], name, gender, age }));

// Local patient photos, keyed by patient name; anyone not listed falls back to the API's profile_picture.
const PHOTOS = {
  "Emily Williams": "images/L1.png", "Ryan Johnson": "images/L2.png", "Brandon Mitchell": "images/L3.png",
  "Jessica Taylor": "images/L4.png", "Samantha Johnson": "images/L5.png", "Ashley Martinez": "images/L5_5.png",
  "Olivia Brown": "images/L6.png", "Tyler Davis": "images/L7.png", "Kevin Anderson": "images/L8.png",
  "Dylan Thompson": "images/L9.png", "Nathan Evans": "images/L10.png", "Mike Nolan": "images/L11.png",
};
const photoOf = (p) => PHOTOS[p.name] || p.profile_picture || "";

const $ = (id) => document.getElementById(id);
let patients = [], chart;

async function loadPatients() {
  if (!CONFIG.API_URL) return SAMPLE;
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
    li.innerHTML = `<img alt="" src="${photoOf(p)}"><div class="meta"><b></b><small>${p.gender}, ${p.age}</small></div><span class="dots">•••</span>`;
    li.querySelector("b").textContent = p.name;
    li.onclick = () => select(i);
    ul.appendChild(li);
  });
}

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
  set("p-dob", p.date_of_birth);
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
    const li = document.createElement("li"); li.innerHTML = "<span></span><span class=\"dl\" title=\"Download\">⬇</span>"; li.firstChild.textContent = l; $("lab-list").appendChild(li);
  });
}

(async function init() {
  try {
    patients = await loadPatients();
    renderList();
    const idx = patients.findIndex((p) => p.name === CONFIG.TARGET_PATIENT);
    select(idx >= 0 ? idx : 0);
  } catch (e) {
    document.querySelector(".layout").innerHTML = `<p class="error">Failed to load data: ${e.message}</p>`;
  }
})();
