# AJJU AI VIDEO EDITOR

A responsive, browser-based video editing starter studio by AJJU Creative Studio.

## Current features
- Drag-and-drop or file-picker video import
- Browser video preview and playback
- Start/end trimming
- Visual looks: Original, Cinematic, Warm, Mono and Vivid
- Custom title/caption overlay with position and size controls
- Optional user-supplied background audio track
- Aspect-ratio selection and local browser export
- Responsive desktop and mobile layout

## Important current limitations
This is the first browser-only MVP, not a full autonomous AI editor yet. It does **not** currently perform AI scene understanding, automatic removal of pauses/filler words, speech-to-text captions, generative effects, or MP4 encoding. The current export is WebM using the browser's MediaRecorder API; audio-track mixing depends on browser support. Your source video is processed locally in the browser and is not uploaded to a server.

## Run locally
Open `index.html` in a modern browser, preferably Chrome or Edge. For best compatibility, serve the folder with VS Code Live Server.

## GitHub Pages
In the repository, open **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, then Save. The site will be available at:

https://ajayavn512.github.io/AJJU-AI-VIDEO-EDITOR/

## Next development milestones
1. Add a proper FFmpeg/WebCodecs export pipeline and MP4 output where supported.
2. Add speech recognition and word-level subtitle editing.
3. Add scene detection and automatic edit suggestions.
4. Add secure server-side processing only if larger AI models or cloud rendering are needed.

Never put private API keys in frontend files or a public GitHub repository.
