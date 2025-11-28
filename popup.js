// HeaderCheck · popup.js (weighted %, letter grade, pro report, history)
// Works with current HTML; gracefully no-ops if some elements are missing.

// =========================
// Constants
// =========================
const HC_HISTORY_KEY = "yl_history";
const HC_MAX_HISTORY = 10;

// =========================
/* Theme */
// =========================
const bodyEl = document.body;
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIconSpan = document.getElementById("themeIcon");
const themeLabelSpan = document.getElementById("themeLabel");

async function loadTheme() {
  const stored = await chrome.storage.local.get(["yl_theme"]);
  const mode = stored.yl_theme || "dark";
  if (mode === "light") {
    bodyEl.classList.add("theme-light");
    if (themeIconSpan) themeIconSpan.textContent = "🌙";
    if (themeLabelSpan) themeLabelSpan.textContent = "Dark";
  } else {
    bodyEl.classList.remove("theme-light");
    if (themeIconSpan) themeIconSpan.textContent = "☀";
    if (themeLabelSpan) themeLabelSpan.textContent = "Light";
  }
}

async function toggleTheme() {
  const isLight = bodyEl.classList.contains("theme-light");
  const next = isLight ? "dark" : "light";
  if (next === "light") {
    bodyEl.classList.add("theme-light");
    if (themeIconSpan) themeIconSpan.textContent = "🌙";
    if (themeLabelSpan) themeLabelSpan.textContent = "Dark";
  } else {
    bodyEl.classList.remove("theme-light");
    if (themeIconSpan) themeIconSpan.textContent = "☀";
    if (themeLabelSpan) themeLabelSpan.textContent = "Light";
  }
  await chrome.storage.local.set({ yl_theme: next });
}

themeToggleBtn?.addEventListener("click", toggleTheme);

// =========================
/* External links */
// =========================
document.getElementById("bugBtn")?.addEventListener("click", () =>
  chrome.tabs.create({ url: "https://github.com/YvonLabs/headercheck/issues" })
);
document.getElementById("siteBtn")?.addEventListener("click", () =>
  chrome.tabs.create({ url: "yvonlabs.github.io" })
);

// =========================
// Header rules with weights and descriptions
//   severity: "bad" (critical) or "warn" (recommended)
//   graded: true  -> counts for score and grade
//           false -> informational only
// =========================
const REQUIRED_HEADERS = [
  // 1. Core, heavily weighted and graded
  {
    name: "content-security-policy",
    label: "Content-Security-Policy",
    desc: "Mitigates XSS and injection by restricting which resources can load.",
    check: v => !!v,
    severityIfMissing: "bad",
    weight: 4,
    graded: true
  },
  {
    name: "strict-transport-security",
    label: "Strict-Transport-Security",
    desc: "Forces HTTPS; protects against downgrade or mitm after first visit.",
    check: v => !!v,
    severityIfMissing: "bad",
    weight: 4,
    graded: true
  },
  {
    name: "x-frame-options",
    label: "X-Frame-Options / frame-ancestors",
    desc: "Mitigates clickjacking by controlling iframing or embedding.",
    check: (v, headers) => {
      if (v) return true;
      const csp = headers["content-security-policy"] || "";
      return csp.toLowerCase().includes("frame-ancestors");
    },
    severityIfMissing: "warn",
    weight: 3,
    graded: true
  },

  // 2. Other graded headers
  {
    name: "x-content-type-options",
    label: "X-Content-Type-Options",
    desc: "Prevents MIME sniffing; avoids executing untrusted files as scripts.",
    check: v => typeof v === "string" && v.toLowerCase().includes("nosniff"),
    severityIfMissing: "warn",
    weight: 1,
    graded: true
  },
  {
    name: "referrer-policy",
    label: "Referrer-Policy",
    desc: "Reduces referrer leakage when navigating across sites.",
    check: v => !!v,
    severityIfMissing: "warn",
    weight: 1,
    graded: true
  },
  {
    name: "permissions-policy",
    label: "Permissions-Policy",
    desc: "Controls access to powerful APIs like camera, mic, or geo.",
    check: v => !!v,
    severityIfMissing: "warn",
    weight: 1,
    graded: true
  },

  // 3. Informational only (not scored)
  {
    name: "cross-origin-opener-policy",
    label: "Cross-Origin-Opener-Policy",
    desc: "Prevents cross-window data leaks by isolating browsing contexts.",
    check: v => !!v,
    severityIfMissing: "warn",
    weight: 0,
    graded: false
  },
  {
    name: "cross-origin-resource-policy",
    label: "Cross-Origin-Resource-Policy",
    desc: "Blocks other origins from loading your resources unless allowed.",
    check: v => !!v,
    severityIfMissing: "warn",
    weight: 0,
    graded: false
  },
  {
    name: "cross-origin-embedder-policy",
    label: "Cross-Origin-Embedder-Policy",
    desc: "Establishes cross-origin isolation for SharedArrayBuffer and similar APIs.",
    check: v => !!v,
    severityIfMissing: "warn",
    weight: 0,
    graded: false
  }
];

// =========================
// DOM
// =========================
const currentUrlEl   = document.getElementById("currentUrl");
const pageScanTimeEl = document.getElementById("pageScanTime");

const resultsEl      = document.getElementById("results");
const scanBtn        = document.getElementById("scanBtn");

const copyCurlBtn    = document.getElementById("copyCurlBtn");
const copyReportBtn  = document.getElementById("copyReportBtn");

const riskChipEl     = document.getElementById("riskChip");
const scoreCountEl   = document.getElementById("scoreCount");
const scoreTotalEl   = document.getElementById("scoreTotal");
const scorePctEl     = document.getElementById("scorePct");
const gradeChipEl    = document.getElementById("gradeChip");

const statusMsgEl    = document.getElementById("statusMsg");

const historyListEl  = document.getElementById("historyList");
const historyEmptyEl = document.getElementById("historyEmpty");
const clearHistoryBtn= document.getElementById("clearHistoryBtn");

let lastUrl = "";
let lastCurl = "";
let lastHeadersMap = {};
let lastScoreInfo = null;
let statusClearTimer = null;

// =========================
// UI helpers
// =========================
function classifyStatus(ok, sev, graded) {
  // This only controls styling, not scoring
  if (ok) {
    return { cls: "ok", text: "OK" };
  }

  // Informational headers: softer style but still "Missing"
  if (graded === false) {
    return { cls: "weak", text: "Missing" };
  }

  // Graded headers
  return {
    cls: sev === "bad" ? "missing" : "weak",
    text: "Missing"
  };
}

function renderHeaders(map) {
  resultsEl.innerHTML = "";
  REQUIRED_HEADERS.forEach(h => {
    const ok = h.check(map[h.name], map);
    const graded = h.graded === false ? false : true;
    const s = classifyStatus(ok, h.severityIfMissing, graded);

    const row = document.createElement("div");
    row.className = "header-row-item";

    const left = document.createElement("div");
    left.className = "header-info";

    const t = document.createElement("div");
    t.className = "header-name";
    t.textContent = h.label;

    const d = document.createElement("div");
    d.className = "header-desc";
    d.textContent = h.desc + (graded ? "" : " (informational; not scored)");

    left.appendChild(t);
    left.appendChild(d);

    const pill = document.createElement("div");
    pill.className = `header-status-pill ${s.cls}`;
    pill.textContent = s.text;

    row.appendChild(left);
    row.appendChild(pill);
    resultsEl.appendChild(row);
  });
}

// Weighted score with critical override.
// Only headers with graded: true affect count and percentage.
function computeWeightedScore(map) {
  let okCount = 0;
  let badMissing = 0;
  let warnMissing = 0;

  let sumWeights = 0;
  let sumOkWeights = 0;
  let gradedCount = 0;

  REQUIRED_HEADERS.forEach(h => {
    const graded = h.graded === false ? false : true;
    const pass = h.check(map[h.name], map);

    if (graded) {
      gradedCount++;
      const w = typeof h.weight === "number" ? h.weight : 1;
      sumWeights += w;

      if (pass) {
        okCount++;
        sumOkWeights += w;
      } else {
        if (h.severityIfMissing === "bad") badMissing++;
        else warnMissing++;
      }
    }
  });

  const percent =
    sumWeights > 0 ? Math.round((sumOkWeights / sumWeights) * 100) : 0;

  let risk = "Low";
  let cls = "risk-low";
  if (percent < 60) { risk = "High"; cls = "risk-high"; }
  else if (percent < 85) { risk = "Medium"; cls = "risk-med"; }

  if (badMissing >= 2) { risk = "High"; cls = "risk-high"; }
  else if (badMissing === 1 && percent < 85) { risk = "High"; cls = "risk-high"; }

  return {
    okCount,
    totalCount: gradedCount,
    percent,
    badMissing,
    warnMissing,
    risk,
    cls
  };
}

function gradeFor(percent, badMissing) {
  if (badMissing >= 2) return "F";
  if (badMissing === 1 && percent < 85) return "D";
  if (percent >= 85) return "A";
  if (percent >= 70) return "B";
  if (percent >= 55) return "C";
  if (percent >= 40) return "D";
  return "F";
}

function gradeClass(grade) {
  return grade === "A" ? "grade-A" :
         grade === "B" ? "grade-B" :
         grade === "C" ? "grade-C" :
         grade === "D" ? "grade-D" : "grade-F";
}

function renderRisk(scoreInfo) {
  lastScoreInfo = scoreInfo;

  if (scoreCountEl) scoreCountEl.textContent = String(scoreInfo.okCount);
  if (scoreTotalEl) scoreTotalEl.textContent = String(scoreInfo.totalCount);

  const grade = gradeFor(scoreInfo.percent, scoreInfo.badMissing);
  if (scorePctEl)  scorePctEl.textContent = `${scoreInfo.percent}%`;
  if (gradeChipEl) {
    gradeChipEl.textContent = grade;
    gradeChipEl.className = `grade-chip ${gradeClass(grade)}`;
  }

  if (riskChipEl) {
    riskChipEl.textContent = scoreInfo.risk;
    riskChipEl.className = `risk-chip ${scoreInfo.cls}`;
  }
}

function buildCurl(url) {
  return `curl -I "${url}"`;
}

// Markdown report
function buildMarkdownReport(url, map, scoreInfo) {
  const date = new Date();
  const when = date.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  const grade = gradeFor(scoreInfo.percent, scoreInfo.badMissing);

  const head =
`# HeaderCheck Report

**URL:** ${url}  
**Scan Date:** ${when}  
**Risk Level:** ${scoreInfo.risk}  
**Passing:** ${scoreInfo.okCount} / ${scoreInfo.totalCount} (${scoreInfo.percent}%)  
**Grade:** ${grade}

---

## 🧩 Header Summary

| Header | Status | Why it matters |
|:--|:--:|:--|
`;

  let rows = "";
  REQUIRED_HEADERS.forEach(h => {
    const ok = h.check(map[h.name], map);
    const sev = h.severityIfMissing;
    const graded = h.graded === false ? false : true;
    const statusIcon = ok
      ? "🟢 Present"
      : graded
        ? (sev === "bad" ? "🔴 Missing" : "🟡 Missing")
        : "ℹ Info (not scored)";
    rows += `| **${h.label}** | ${statusIcon} | ${h.desc}${graded ? "" : " (informational; not scored)"} |\n`;
  });

  const foot = `

---

Generated locally with **[HeaderCheck by YvonLabs](https://github.com/YvonLabs/headercheck/)**.
`;

  return head + rows + foot;
}

function showStatus(msg) {
  if (statusClearTimer) clearTimeout(statusClearTimer);
  statusMsgEl.textContent = msg;
  statusMsgEl.classList.remove("hidden");
  statusClearTimer = setTimeout(() => statusMsgEl.classList.add("hidden"), 3000);
}

function flashButton(btn, orig, txt = "Copied") {
  btn.textContent = txt;
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = orig;
    btn.disabled = false;
  }, 1200);
}

function setScanning(b) {
  if (b) {
    scanBtn?.classList.add("is-busy");
    if (scanBtn) { scanBtn.disabled = true; scanBtn.textContent = "Scanning…"; }
  } else {
    scanBtn?.classList.remove("is-busy");
    if (scanBtn) { scanBtn.disabled = false; scanBtn.textContent = "Scan"; }
  }
}

function formatTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    hour: "2-digit", minute: "2-digit",
    year: "numeric", month: "short", day: "numeric"
  });
}

// =========================
// History
// =========================
async function loadHistory() {
  const s = await chrome.storage.local.get([HC_HISTORY_KEY]);
  return s[HC_HISTORY_KEY] || [];
}

async function saveHistory(arr) {
  await chrome.storage.local.set({ [HC_HISTORY_KEY]: arr });
}

async function appendHistoryEntry(entry) {
  const hist = await loadHistory();
  const next = [entry, ...(hist || [])];
  if (next.length > HC_MAX_HISTORY) next.length = HC_MAX_HISTORY;
  await saveHistory(next);
}

async function clearHistory() {
  await saveHistory([]);
  renderHistory([]);
  showStatus("History cleared");
}

function renderHistory(arr) {
  if (!historyListEl || !historyEmptyEl) return;

  historyListEl.innerHTML = "";
  if (!arr.length) {
    historyEmptyEl.style.display = "block";
    return;
  }
  historyEmptyEl.style.display = "none";

  arr.forEach(item => {
    const { url, ts, scoreInfo } = item;

    const row = document.createElement("div");
    row.className = "history-item";

    const top = document.createElement("div");
    top.className = "history-topline";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";

    const domainEl = document.createElement("div");
    domainEl.className = "history-domain";
    try { domainEl.textContent = new URL(url).hostname; }
    catch { domainEl.textContent = url; }

    const timeEl = document.createElement("div");
    timeEl.className = "history-time";
    timeEl.textContent = formatTimestamp(ts);

    left.appendChild(domainEl);
    left.appendChild(timeEl);

    const pill = document.createElement("div");
    pill.className =
      `history-risk-pill ${
        scoreInfo.cls === "risk-low" ? "history-risk-low"
      : scoreInfo.cls === "risk-med" ? "history-risk-med"
      : "history-risk-high"
      }`;
    pill.textContent = scoreInfo.risk;

    top.appendChild(left);
    top.appendChild(pill);
    row.appendChild(top);

    row.addEventListener("click", () => chrome.tabs.create({ url }));
    historyListEl.appendChild(row);
  });
}

// =========================
// Background comms
// =========================
function fetchLatestFromBackground() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "getLatestForActiveTab" }, resp => {
      resolve(resp && resp.ok ? (resp.data || null) : null);
    });
  });
}

// =========================
// UI update cycle
// =========================
async function updateUIFromRecord(record) {
  if (!record) {
    const gradedTotal = REQUIRED_HEADERS.filter(h => h.graded !== false).length;
    if (currentUrlEl) currentUrlEl.textContent = "–";
    if (pageScanTimeEl) pageScanTimeEl.textContent = "Last scanned: –";
    lastUrl = "";
    lastCurl = "";
    lastHeadersMap = {};
    lastScoreInfo = null;
    if (resultsEl) resultsEl.innerHTML = "";
    renderRisk({
      okCount: 0,
      totalCount: gradedTotal,
      percent: 0,
      badMissing: 0,
      warnMissing: 0,
      risk: "–",
      cls: ""
    });
    renderHistory(await loadHistory());
    return;
  }

  const { url, headers } = record;
  lastUrl = url;
  lastCurl = buildCurl(url);
  lastHeadersMap = headers || {};

  if (currentUrlEl) currentUrlEl.textContent = url || "–";
  renderHeaders(lastHeadersMap);

  const info = computeWeightedScore(lastHeadersMap);
  renderRisk(info);

  const ts = Date.now();
  if (pageScanTimeEl) pageScanTimeEl.textContent =
    `Last scanned: ${formatTimestamp(ts)}`;

  await appendHistoryEntry({ url, ts, scoreInfo: info });
  renderHistory(await loadHistory());
}

async function performScan() {
  setScanning(true);
  if (statusMsgEl) {
    statusMsgEl.classList.remove("hidden");
    statusMsgEl.textContent = "Scanning…";
  }
  try {
    await new Promise(r => setTimeout(r, 150));
    const rec = await fetchLatestFromBackground();
    if (!rec) {
      await updateUIFromRecord(null);
      showStatus("No headers captured");
    } else {
      await updateUIFromRecord(rec);
      showStatus("Scanned just now");
    }
  } catch {
    showStatus("Scan failed");
  } finally {
    setScanning(false);
  }
}

// =========================
/* Events */
// =========================
scanBtn?.addEventListener("click", () => performScan());

copyCurlBtn?.addEventListener("click", async () => {
  if (!lastCurl) { showStatus("Nothing to copy"); return; }
  try {
    await navigator.clipboard.writeText(lastCurl);
    flashButton(copyCurlBtn, "Copy cURL", "Copied");
    showStatus("cURL copied");
  } catch {
    showStatus("Copy failed");
  }
});

copyReportBtn?.addEventListener("click", async () => {
  if (!lastUrl || !lastHeadersMap || !lastScoreInfo) {
    showStatus("Nothing to copy");
    return;
  }
  try {
    const md = buildMarkdownReport(lastUrl, lastHeadersMap, lastScoreInfo);
    await navigator.clipboard.writeText(md);
    flashButton(copyReportBtn, "Copy report", "Copied");
    showStatus("Report copied");
  } catch {
    showStatus("Copy failed");
  }
});

clearHistoryBtn?.addEventListener("click", async () => {
  await clearHistory();
});

// =========================
// Init
// =========================
(async function init() {
  await loadTheme();
  renderHistory(await loadHistory());
  performScan();
})();
