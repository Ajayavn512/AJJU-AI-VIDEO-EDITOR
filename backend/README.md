# AJJU AI VIDEO EDITOR — Processing API

This Node.js + Express service uses FFmpeg to trim, apply a basic color look, crop to common aspect ratios, and export H.264 MP4.

## Local setup

1. Install Node.js 20 or newer.
2. Open this folder in a terminal.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and adjust settings.
5. Run `npm start`.
6. Check `http://localhost:3001/api/health`.

## Render endpoint

`POST /api/render` as multipart/form-data:
- `video`: one video file
- `start`: trim start in seconds
- `end`: trim end in seconds
- `filter`: original, cinematic, warm, mono, vivid
- `aspect`: original, 16:9, 9:16, 1:1
- `quality`: standard or high

The response is an MP4 download. Temporary uploads and render files are deleted after the response.

`POST /api/analyze` accepts one `video` upload and returns FFmpeg scene-change timestamps and long-silence intervals. This is signal-based analysis, not semantic AI editing.

## Deployment

Deploy this folder as a Docker web service on a host that supports Docker. Set `ALLOWED_ORIGINS` to the exact frontend origin. Configure a request/upload limit and persistent monitoring before public use.

## Current limitations

This API is an FFmpeg processing foundation, not a complete AI editor. It does not yet transcribe speech, detect scenes, remove backgrounds, or enhance voices with AI. Those features need separately selected models/services and credentials. Do not put API keys in frontend JavaScript or commit secrets to GitHub. The current upload API stores temporary files on the server while processing; use only videos you have permission to upload.
