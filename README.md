# SentinelOps AI - Dummy UI

Static, backend-free demo of the SentinelOps AI web app. Every page of the real Flask app is included with the
project's own data (1,000 events, 150 alerts, 25 incidents, assets, users, audit trail, ML evaluation, graphs).

## Run locally
Open `index.html`, or serve the folder:  `python -m http.server 8000`  then visit http://localhost:8000

## Demo logins (no email code needed)
| User    | Password     | Role             |
|---------|--------------|------------------|
| admin   | Admin@123    | Administrator    |
| analyst | Analyst@123  | Analyst          |
| manager | Manager@123  | Incident Manager |

## What works
- Login with role-based menus and page access (403 page for blocked pages)
- Dashboard charts, Logs & Events (client-side search / label filter / paging), event detail pages
- Alerts, Incidents board, Assets, Users, Audit, ML Model Lab (all pattern x model views) and attack-pattern graphs
- AI Investigation chat (answers captured from the real app for the suggested prompts)
- Sign-up / forgot-password flows (any 6-digit code is accepted)

## What is not saved
Forms that change data (add user/asset, change alert status, move incident, label event, import CSV, retrain)
only show a "demo mode" message - there is no server or database.

## Deploy on GitHub Pages
1. Push the *contents* of this folder to a GitHub repo (index.html at the repo root).
2. Repo -> Settings -> Pages -> Source: "Deploy from a branch" -> Branch: main, folder: / (root) -> Save.
3. Open https://YOUR_USERNAME.github.io/YOUR_REPO/
