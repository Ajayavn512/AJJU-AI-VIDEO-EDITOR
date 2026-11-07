# AJJU AI VIDEO EDITOR

A responsive creator studio with a browser editor and an optional Node.js + FFmpeg processing API.

## Frontend

- Drag-and-drop video import and browser preview
- Clip trimming, visual looks, title/caption overlay and aspect-ratio selection
- Browser-side WebM export
- Responsive layout for desktop and mobile
- Optional FFmpeg API connection for H.264 MP4 export

## FFmpeg backend (new foundation)

The `backend/` folder contains an Express API that uses FFmpeg to trim clips, apply basic color filters, crop common aspect ratios and return MP4 (H.264/AAC).

### Run locally

```bash
cd backend
npm install
npm start
```

Health check: `http://localhost:3001/api/health`

Then open the website and enter `http://localhost:3001` in the FFmpeg server box. For local development, the backend CORS defaults allow the GitHub Pages site and VS Code Live Server on port 5500.

### Deploy the backend

The root `render.yaml` is a starting point for deploying the Docker backend to Render. Review the service and upload limits before making it public. After deployment, copy the backend service URL into the FFmpeg server box in the website.

GitHub Pages hosts only the frontend. It cannot run Node.js or FFmpeg. The backend must be deployed separately.

## AI feature status

The interface lists the planned AI modules: Hindi/English auto captions, scene detection, voice enhancement and background removal. These are **not active yet**. Each needs a selected AI model/provider, server-side credentials, integration, and testing. Do not place API keys in frontend JavaScript or commit them to GitHub.

## Important limitations

- This is an evolving MVP, not a finished one-click autonomous AI editor.
- Current Quick Polish applies a preset; it does not understand the story or automatically choose the best scenes.
- Browser export is WebM. MP4 export uses the optional FFmpeg backend.
- The backend processes uploads temporarily on its host and deletes temporary files after processing. Use only media you have permission to upload.
- Free hosting can sleep, impose request limits, or have limited temporary disk/CPU. Large and long videos may fail; start with a short test clip.
- The backend currently processes one render request synchronously. It is not a multi-user production render queue.

## Security and privacy

Keep provider keys in backend environment variables only. Before accepting public uploads, add authentication, per-user quotas, rate limiting, stronger file validation, abuse monitoring and an explicit privacy/retention policy.
