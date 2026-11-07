'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const multer = require('multer');
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const MAX_UPLOAD = Number(process.env.MAX_UPLOAD_MB || 500) * 1024 * 1024;
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://ajayavn512.github.io,http://localhost:5500').split(',').map(value => value.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); callback(new Error('Origin is not allowed.')); }, methods: ['GET','POST'] }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'AJJU AI VIDEO EDITOR', engine: 'FFmpeg', features: ['trim','filters','aspect-ratio','mp4-h264'], aiFeaturesEnabled: false }));

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: MAX_UPLOAD, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname !== 'video' || !file.mimetype.startsWith('video/')) return cb(new Error('Upload one valid video file.'));
    cb(null, true);
  }
});

const filters = {
  original: 'null',
  cinematic: 'eq=contrast=1.12:saturation=0.88:brightness=-0.01',
  warm: 'colorbalance=rs=0.04:gs=0.01:bs=-0.04,eq=saturation=1.12',
  mono: 'hue=s=0,eq=contrast=1.12',
  vivid: 'eq=contrast=1.08:saturation=1.3'
};
function even(n) { return Math.max(2, Math.floor(n / 2) * 2); }
function videoFilter(aspect, look, width) {
  const w = even(width);
  if (aspect === 'original') return filters[look];
  const targetW = aspect === '9:16' ? even(Math.round(w * 9 / 16)) : w;
  const targetH = aspect === '9:16' ? w : aspect === '1:1' ? w : even(Math.round(w * 9 / 16));
  const base = `scale='min(${targetW}/iw,${targetH}/ih)*iw':'min(${targetW}/iw,${targetH}/ih)*ih',crop=${targetW}:${targetH}`;
  return filters[look] === 'null' ? base : base + ',' + filters[look];
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ['ignore','ignore','pipe'] });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk.toString(); if (stderr.length > 200000) stderr = stderr.slice(-200000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stderr) : reject(new Error(stderr || 'FFmpeg analysis failed.')));
  });
}
app.post('/api/analyze', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Video file is required.' });
  const input = req.file.path;
  try {
    const info = await runFfmpeg(['-hide_banner','-i',input]);
    const durationMatch = info.match(/Duration: (\\d{2}):(\\d{2}):(\\d{2}(?:\\.\\d+)?)/);
    const duration = durationMatch ? Number(durationMatch[1])*3600 + Number(durationMatch[2])*60 + Number(durationMatch[3]) : null;
    if (!duration || duration > 3600) return res.status(400).json({ error: 'Could not read duration or video is over 60 minutes.' });
    const [sceneLog, silenceLog] = await Promise.all([
      runFfmpeg(['-hide_banner','-i',input,'-vf',"select='gt(scene,0.35)',showinfo",'-an','-f','null','-']),
      runFfmpeg(['-hide_banner','-i',input,'-af','silencedetect=noise=-35dB:d=0.8','-vn','-f','null','-'])
    ]);
    const scenes = [...sceneLog.matchAll(/pts_time:([0-9.]+)/g)].map(m=>Number(m[1])).filter(n=>Number.isFinite(n)&&n>0&&n<duration).slice(0,200);
    const starts = [...silenceLog.matchAll(/silence_start: ([0-9.]+)/g)].map(m=>Number(m[1]));
    const ends = [...silenceLog.matchAll(/silence_end: ([0-9.]+)/g)].map(m=>Number(m[1]));
    const silences = starts.map((start,i)=>({start,end:ends[i]??duration})).filter(x=>x.end-x.start>=0.8).slice(0,200);
    res.json({ok:true,duration,scenes,silences,method:'FFmpeg scene-change and silence analysis',note:'These are algorithmic suggestions, not semantic AI understanding.'});
  } catch (error) {
    res.status(500).json({error:'Could not analyze this video. Try a shorter MP4 (H.264) clip.'});
  } finally { fs.unlink(input,()=>{}); }
});
app.post('/api/render', upload.single('video'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Video file is required.' });
  const work = path.join(os.tmpdir(), 'ajju-' + crypto.randomUUID());
  const input = file.path;
  const output = path.join(work, 'ajju-edited.mp4');
  try {
    const start = Math.max(0, Number(req.body.start || 0));
    const end = Number(req.body.end);
    const duration = end - start;
    if (!Number.isFinite(start) || !Number.isFinite(end) || duration <= 0 || duration > 3600) {
      fs.unlink(input, () => {});
      return res.status(400).json({ error: 'Invalid trim range. Maximum clip length is 60 minutes.' });
    }
    const look = Object.hasOwn(filters, req.body.filter) ? req.body.filter : 'original';
    const aspect = ['original','16:9','9:16','1:1'].includes(req.body.aspect) ? req.body.aspect : 'original';
    const width = req.body.quality === 'high' ? 1920 : 1280;
    fs.mkdirSync(work, { recursive: true });
    const args = ['-hide_banner','-loglevel','error','-y','-ss',String(start),'-i',input,'-t',String(duration),'-vf',videoFilter(aspect,look,width),'-c:v','libx264','-preset','veryfast','-crf',req.body.quality === 'high' ? '20' : '23','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',output];
    await new Promise((resolve, reject) => {
      const child = spawn(ffmpegPath, args, { stdio: ['ignore','ignore','pipe'] });
      let error = '';
      child.stderr.on('data', chunk => { error += chunk.toString(); if (error.length > 4000) error = error.slice(-4000); });
      child.on('error', reject);
      child.on('close', code => code === 0 ? resolve() : reject(new Error(error || 'FFmpeg processing failed.')));
    });
    res.download(output, 'ajju-edited.mp4', () => cleanup());
  } catch (error) {
    cleanup();
    if (!res.headersSent) res.status(500).json({ error: 'Video processing failed. Try a shorter MP4 video.' });
  }
  function cleanup() {
    fs.rm(input, { force: true }, () => {});
    fs.rm(work, { recursive: true, force: true }, () => {});
  }
});
app.use((err, _req, res, _next) => {
  const status = err instanceof multer.MulterError ? 413 : 400;
  res.status(status).json({ error: err.message || 'Upload failed.' });
});
app.listen(PORT, '0.0.0.0', () => console.log(`AJJU video API listening on ${PORT}`));
