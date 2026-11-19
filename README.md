# DGamma

Weather editorial hero (Vite + vanilla JS): adaptive sky scene, AccuWeather/demo data, preview panel.

**Live (GitHub Pages):** https://axisvaredun-glitch.github.io/DGamma/

## Local dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages

1. Repo **Settings → Pages → Build and deployment**: source **GitHub Actions**
2. Push to `main` — workflow `.github/workflows/deploy.yml` builds `dist/` and deploys

`vite.config.js` uses `base: '/DGamma/'` (nama repo). Ubah jika nama repo berbeda.

## AccuWeather (optional)

Edit `src/config.js`: `DEMO_MODE = false` + `ACCUWEATHER_API_KEY`. Jangan commit API key nyata.