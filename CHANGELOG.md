# Changelog  

All notable changes to **HeaderCheck** are documented here.  

HeaderCheck follows semantic-style versioning during its pre-1.0 phase.  

---

## [Unreleased]

### docs
- added unified YvonLabs privacy and security links  
- created product page with scoring bands  
- not yet released — internal development build only  

### model
- introduced deterministic Boolean scoring logic (`SCM-2025.1`)  
- defined fixed weight distribution across five header categories  
- added transparency and versioning section for reproducibility  

### changed
- updated README branding and badges to align with YvonLabs house style  

> **Note:** `SCM-2025.1` logic is implemented in documentation only.  
> The extension code continues to operate under pre-1.0 deterministic evaluation rules.

---

## [0.1.0-dev] – 2025-10-24  

**Initial release**  
- Inspect HTTP response headers for the active tab  
- Weighted privacy and security score with quick guidance  
- 100% local-only processing (no telemetry)