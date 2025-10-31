<p align="center">
  <img src="https://yvonlabs.github.io/assets/headercheck_logo.png" alt="HeaderCheck logo" width="280"><br>
  <b>HeaderCheck – fast, opinionated HTTP header analysis for privacy and security.</b>
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
**HeaderCheck** is a Chrome extension that inspects HTTP response headers for the active tab and scores the site’s privacy and security posture.  
It uses a weighted model to surface critical, medium, and low findings, giving an actionable numeric score out of 100.

---

### Features
- **Weighted scoring** - based on real-world exploit and privacy risk  
- **Instant scan** - one click, one score  
- **Actionable guidance** - concise remediation per header  
- **Zero telemetry** - all checks performed locally in the browser  
- **EU-aligned defaults** - emphasizes privacy and transport integrity  

---

### Scoring Bands
| Range  | Grade      | Meaning                                |
|------- |------------|----------------------------------------|
| 90–100 | ✅ Pass    | Headers in strong alignment            |
| 70–89  | ⚠️ Warning | Minor issues or missing best practices |
| <70    | ❌ Fail    | Critical controls missing              |

Full scoring model:  
[HeaderCheck Detailed Documentation](https://yvonlabs.github.io/docs/HeaderCheck_Detailed_Documentation)

---

### Installation
1. **Clone the repo**
   ```bash
   git clone https://github.com/YvonLabs/headercheck.git
   ```
2. **Open Chrome** and go to `chrome://extensions/`  
3. **Enable Developer Mode**  
4. **Click “Load unpacked”** and select the `headercheck` folder  

---

### Privacy Policy
Unified for all YvonLabs tools:  
[https://yvonlabs.github.io/docs/privacy-policy](https://yvonlabs.github.io/docs/privacy-policy)

---

### Stay Updated
Follow updates and other projects from YvonLabs at
👉 https://yvonlabs.github.io

---

<p align="center">
  <sub>Minimal • Fast • Focused © YvonLabs</sub>
</p>

