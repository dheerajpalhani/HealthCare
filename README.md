# Tech.Care Patient Dashboard

A single-page patient dashboard built for the Coalition Technologies Front-End Developer skills test. It converts the Adobe XD design "HealthCare Dashboard" (a 1600 × 1195 px artboard) into HTML, CSS and JavaScript, and fills it with live data from the Coalition Technologies Patient Data API.

The page opens on the record for **Jessica Taylor**: profile, blood-pressure chart, vital signs, diagnostic list and lab results. The sidebar lists the patients returned by the API.

## Features

- Blood-pressure line chart (systolic and diastolic, last 6 months) drawn with Chart.js
- Latest respiratory rate, temperature and heart rate, with ▲ / ▼ level indicators
- Profile card with photo, date of birth, gender, contact details and insurance provider
- Scrollable diagnostic list and lab results
- Data loaded on page load with a GET request and Basic authentication

## Tech stack

- HTML5, CSS3 and vanilla JavaScript (no build step)
- [Chart.js](https://www.chartjs.org/) 4.4.3, loaded from the jsDelivr CDN
- Manrope font from Google Fonts

## Getting started

1. Open `index.html` in a modern browser (Chrome recommended).
2. An internet connection is needed for the API, Chart.js and the font.

No server or install is required. The API allows browser requests from any origin.

## Project structure

```
├── index.html    Page structure: header, patient list and five cards
├── styles.css    Design tokens, layout and component styles
├── app.js        API call, rendering and chart setup
└── images/       Logo, icons and patient photos exported from the XD design
```

## How it works

1. `app.js` requests the patient data from the API (`loadPatients`). The username and password sit in the `CONFIG` object at the top of the file and are encoded with `btoa()` when the request is made.
2. `renderList` builds the patient list. Photos for the patients in the design come from `images/`; any other patient uses the photo URL from the API.
3. `select` fills every card for the chosen patient. It takes the latest month for the vitals and the last six months for the chart. The API returns history newest-first, so the chart data is reversed.
4. All API text is inserted with `textContent`, so no HTML from the data is ever injected into the page.
5. Dates of birth arrive in two formats (`1996-08-23` and `08/23/1996`); `formatDate` turns both into "August 23, 1996".

## Design notes

- The layout is a fixed 1600 × 1195 px artboard, and each card is positioned at its measured XD coordinates.
- Colours and text styles come from the XD design tokens and are defined as CSS variables in `styles.css`.
- Search, the gear icon, the "…" menus and "Show All Information" are visual only, as in the template. No interaction was built for them.

## Known limitations

- The layout is fixed-width, so it scrolls sideways on screens narrower than 1600 px.
- Clicking another patient in the sidebar shows that patient's data.
- The size of the Diagnostic List card is estimated from the artboard geometry.
