# Prismora — Login Flow (React + Vite + Express)

A colorful, animated login page with a mock-auth Express backend and a dummy dashboard.
Original brand ("Prismora"), plain CSS — no cloning of any real site.

## Run it

Open two terminals:

```bash
# Terminal 1 — backend (http://localhost:5000)
cd server
npm install
npm start

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Demo credentials

| Email                | Password    |
| -------------------- | ----------- |
| demo@prismora.com    | Prism@123   |
| admin@prismora.com   | Admin@123   |

## Brief checklist

- [x] React app created with Vite
- [x] Responsive, original login UI (brand: Prismora)
- [x] Email + password form handling
- [x] Frontend validation: empty fields, invalid email, password length (min 6)
- [x] Express server handling login requests
- [x] Axios used to connect frontend and backend (Vite proxy `/api` -> :5000)
- [x] Mock/static users, no database
- [x] Error messages for invalid logins (unknown email, wrong password, server down)
- [x] Redirect to dummy Dashboard on success (protected route)

## Structure

```
prismora/
├─ server/
│  ├─ index.js
│  └─ package.json
└─ client/
   ├─ index.html
   ├─ vite.config.js
   ├─ package.json
   └─ src/
      ├─ main.jsx
      ├─ App.jsx
      ├─ api.js
      ├─ styles.css
      └─ pages/
         ├─ Login.jsx
         └─ Dashboard.jsx
```
