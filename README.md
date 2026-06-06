# Frankly

Frankly is a financial decision-support app for small business owners that shows data quality issues alongside financial metrics. Uncertainty is explicit, not hidden.

## The Problem

Small business owners make financial decisions on incomplete or error-ridden data. Most tools just show the numbers without flagging when those numbers can't be trusted. Frankly scores your data quality and widens uncertainty ranges when the data is bad, instead of projecting false confidence.

## Features

**Data Health** — confidence scoring (0–100) with penalty breakdowns for duplicates, gaps, spikes, and uncategorized transactions

**Cash Flow** — actual figures plus a 3-month forecast with uncertainty bands that widen based on data quality, plus runway calculation

**Decisions** — scenario modeling (best/likely/worst) for financial decisions like hires or purchases, with recommendations tied to current data quality

**Insights** — anomaly detection with severity levels, SMB benchmarks, and revenue concentration warnings

**Argus** — an in-app mascot (geometric lynx) that shows up at five specific trigger points when something needs attention

## Tech Stack

- **Frontend:** React 18, Vite, React Router v6, Recharts, plain CSS
- **Backend:** Node.js, Express, multer, papaparse
- **No database** — stateless, CSV upload per session
