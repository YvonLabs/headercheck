<p align="center">
  <img src="https://yvonlabs.github.io/assets/headercheck_logo.png" alt="HeaderCheck logo" width="280"><br>
  <b>HeaderCheck – fast, deterministic HTTP header analysis for privacy and security.</b>
</p>

<p align="center">
  <a href="https://github.com/YvonLabs/headercheck/releases">
    <img src="https://img.shields.io/badge/version-0.1.0-blue.svg?style=flat-square" alt="Version">
  </a>
  <a href="https://github.com/YvonLabs/headercheck/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="License">
  </a>
  <a href="https://github.com/YvonLabs/headercheck/issues">
    <img src="https://img.shields.io/github/issues/YvonLabs/headercheck?style=flat-square" alt="Issues">
  </a>
  <a href="https://yvonlabs.github.io/docs/headercheck">
    <img src="https://img.shields.io/badge/docs-yvonlabs.github.io-1E90FF?style=flat-square" alt="Docs">
  </a>
</p>

---

### Overview

**HeaderCheck** is a Chrome extension that inspects HTTP response headers for the active tab and evaluates a site’s security and privacy posture.

It uses a deterministic **weighted scoring model** (`SCM-2025.1`) to produce a score from **0–100**, based on the presence and validity of key security headers.  
All processing is performed **locally in the browser** with no remote calls, storage, or telemetry.

Current scoring model: **SCM-2025.1**

---

### Features

- **Deterministic weighted scoring**  
  Based on a 10-point raw weight model normalized to 100.  
- **Instant analysis**  
  One click, one score.  
- **Clear guidance**  
  Highlights missing or weak headers.  
- **Zero telemetry**  
  Evaluation happens entirely inside Chrome’s extension sandbox.  
- **EU-aligned privacy emphasis**  
  Prioritizes transport integrity, referrer minimization, and isolation boundaries.

---

### What HeaderCheck Evaluates

HeaderCheck focuses on high-impact, modern browser security controls:

| Header | Purpose |
|--------|---------|
| **Strict-Transport-Security** | Prevents downgrade attacks and enforces HTTPS |
| **Content-Security-Policy** | Strongest browser-side XSS and injection control |
| **COOP / COEP / CORP** | Context isolation and cross-origin boundary protection |
| **Permissions-Policy** | Restricts powerful browser APIs |
| **Referrer-Policy** | Minimizes referrer leakage |
| **X-Frame-Options / frame-ancestors** | Clickjacking defense |
| **X-Content-Type-Options (nosniff)** | Prevents MIME sniffing |

Some headers are **graded** (affect score), others are **informational** (shown but not penalized).

Full model documentation:  
https://yvonlabs.github.io/docs/scoring-models

---

### Scoring Bands

HeaderCheck assigns grades based on the final weighted percentage:

| Score | Grade | Meaning |
|--------|--------|---------|
| **≥ 85 percent** | A–B | Strong alignment with modern best practices |
| **< 85 percent** | C–D | Missing or weak required controls |
| **< 60 percent** | F | High-risk posture with critical gaps |

**Critical headers:**  
Content-Security-Policy and Strict-Transport-Security.

---

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/YvonLabs/headercheck.git

   ---

### Support YvonLabs

If you find HeaderCheck helpful, you can support future open-source tools:

☕ <a href="https://buymeacoffee.com/yvonlabs" target="_blank" rel="noopener noreferrer">Support YvonLabs</a>

