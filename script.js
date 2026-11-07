(()=>{'use strict';
const $=id=>document.getElementById(id), video=$('sourceVideo'), canvas=$('renderCanvas'), ctx=canvas.getContext('2d');
let videoUrl=null,audioUrl=null,audioEl=null,filter='none',recording=false,toastTimer=null,audioContext=null,videoSource=null,musicSource=null,mixDestination=null;
const state={start:0,end:0,duration:0};
const fmt=t=>{if(!Number.isFinite(t))return'00:00';const s=Math.max(0,Math.floor(t));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800)}
const empty=$('previewStage').querySelector('.empty-preview');empty.id='emptyPreview';
function setLoaded(on){$('dropzone').classList.toggle('hidden',on);$('fileInfo').classList.toggle('hidden',!on);$('emptyPreview').classList.toggle('hidden',on);$('previewControls').classList.toggle('hidden',!on);$('exportBtn').disabled=!on;$('projectStatus').classList.toggle('hidden',on);$('projectLoaded').classList.toggle('hidden',!on)}
function loadVideo(file){
 if(!file||!file.type.startsWith('video/')){toast('Choose a valid video file.');return}
 if(videoUrl)URL.revokeObjectURL(videoUrl);
 videoUrl=URL.createObjectURL(file);video.pause();video.removeAttribute('src');video.load();video.src=videoUrl;video.preload='auto';
 $('fileName').textContent=file.name;$('fileMeta').textContent=(file.size/1048576).toFixed(1)+' MB · Loading video';$('projectName').textContent=file.name;setLoaded(true);
 let settled=false;const fail=()=>{if(settled)return;settled=true;$('fileMeta').textContent='Could not decode this video';toast('This video codec is not supported by your browser. Try exporting/saving it as MP4 (H.264) and upload again.')};
 video.onerror=fail;
 video.onloadedmetadata=()=>{if(settled)return;state.duration=video.duration;state.start=0;state.end=video.duration;$('duration').textContent=fmt(video.duration);$('currentTime').textContent='00:00';$('fileMeta').textContent=fmt(video.duration)+' · '+video.videoWidth+' × '+video.videoHeight;updateTrim();$('sourceVideo').style.display='block';$('sourceVideo').style.width='100%';$('sourceVideo').style.height='100%';$('sourceVideo').style.objectFit='contain';$('sourceVideo').style.background='#080a10';$('emptyPreview').classList.add('hidden');$('exportBtn').disabled=false;video.currentTime=0;settled=true;toast('Video ready. Use Quick polish for a one-click preset.')};
 video.load();setTimeout(()=>{if(!settled&&video.readyState===0)fail()},12000);
}
$('videoInput').addEventListener('change',e=>loadVideo(e.target.files[0]));
const dz=$('dropzone');['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('dragover')}));
['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('dragover')}));
dz.addEventListener('drop',e=>loadVideo(e.dataTransfer.files[0]));
$('removeVideo').onclick=()=>{video.pause();video.removeAttribute('src');video.load();if(videoUrl)URL.revokeObjectURL(videoUrl);videoUrl=null;state.duration=0;setLoaded(false);$('videoInput').value='';$('currentTime').textContent='00:00';$('duration').textContent='00:00';toast('Video removed.')};
video.addEventListener('timeupdate',()=>{$('currentTime').textContent=fmt(video.currentTime);if(!recording&&video.currentTime>=state.end&&state.end>0)video.pause()});
$('playBtn').onclick=()=>{if(!video.src)return;if(video.paused){if(video.currentTime<state.start||video.currentTime>=state.end)video.currentTime=state.start;video.play().catch(()=>toast('Playback could not start.'))}else video.pause()};
video.addEventListener('play',()=>$('playBtn').textContent='Ⅱ');video.addEventListener('pause',()=>$('playBtn').textContent='▶');
function updateTrim(){if(!state.duration)return;let a=Number($('trimStart').value),b=Number($('trimEnd').value);if(a>b-1){a=b-1;$('trimStart').value=a}if(b<a+1){b=a+1;$('trimEnd').value=b}state.start=state.duration*a/100;state.end=state.duration*b/100;$('rangeSelected').style.left=a+'%';$('rangeSelected').style.width=(b-a)+'%';$('trimReadout').textContent=fmt(state.start)+' — '+fmt(state.end);if(video.currentTime<state.start||video.currentTime>state.end)video.currentTime=state.start}
['trimStart','trimEnd'].forEach(id=>$(id).addEventListener('input',updateTrim));
function filterCss(){return({none:'none',cinematic:'contrast(1.18) saturate(.82) sepia(.12) brightness(.96)',warm:'sepia(.22) saturate(1.22) contrast(1.04)',mono:'grayscale(1) contrast(1.12)',vivid:'saturate(1.5) contrast(1.08)'})[filter]||'none'}
document.querySelectorAll('.filter-option').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter-option').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');filter=btn.dataset.filter;video.style.filter=filterCss();toast(btn.innerText.trim()+' look selected.')}));
function updateCaption(){const t=$('captionInput').value.trim(),el=$('previewCaption');el.textContent=t;el.style.display=t?'block':'none';el.className='preview-caption pos-'+$('captionPosition').value+' size-'+$('captionSize').value}
['captionInput','captionPosition','captionSize'].forEach(id=>$(id).addEventListener('input',updateCaption));
$('autoEditBtn').addEventListener('click',()=>{if(!video.src||!state.duration){toast('First import a video and wait until it finishes loading.');return}filter='cinematic';document.querySelectorAll('.filter-option').forEach(b=>b.classList.toggle('selected',b.dataset.filter==='cinematic'));video.style.filter=filterCss();$('aspectSelect').value='original';$('trimStart').value=0;$('trimEnd').value=100;updateTrim();$('captionPosition').value='bottom';$('captionSize').value='medium';toast('Quick polish applied: cinematic look, original framing and full clip. Add your own title if needed.')});
$('audioInput').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(audioUrl)URL.revokeObjectURL(audioUrl);if(musicSource){try{musicSource.disconnect()}catch(e){}musicSource=null}audioUrl=URL.createObjectURL(f);audioEl=new Audio(audioUrl);audioEl.preload='auto';musicSource=null;$('audioLabel').textContent=f.name;$('removeAudio').classList.remove('hidden');toast('Music selected. It will be mixed into the exported video.')});
$('removeAudio').onclick=()=>{if(audioEl){audioEl.pause();audioEl=null}if(musicSource){try{musicSource.disconnect()}catch(e){}musicSource=null}if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=null;$('audioInput').value='';$('audioLabel').textContent='Add an audio file from your device';$('removeAudio').classList.add('hidden')};
function dimensions(){const w=video.videoWidth,h=video.videoHeight,ratio=$('aspectSelect').value;let r=ratio==='original'?w/h:ratio==='16:9'?16/9:ratio==='9:16'?9/16:1;let max=$('qualitySelect').value==='high'?1920:1280;let cw,ch;if(r>=1){cw=Math.min(max,w||max);ch=Math.round(cw/r)}else{ch=Math.min(max,h||max);cw=Math.round(ch*r)}return{w:cw,h:ch}}
function wrapText(text,maxWidth){const words=text.split(/\s+/),lines=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);return lines.slice(0,3)}
function drawFrame(){const {w,h}=dimensions();if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}ctx.fillStyle='#080a10';ctx.fillRect(0,0,w,h);const vw=video.videoWidth,vh=video.videoHeight;if(vw&&vh){const r=Math.min(w/vw,h/vh),dw=vw*r,dh=vh*r;ctx.save();ctx.filter=filterCss();ctx.drawImage(video,(w-dw)/2,(h-dh)/2,dw,dh);ctx.restore()}const caption=$('captionInput').value.trim();if(caption){const size=$('captionSize').value==='small'?Math.round(h*.035):$('captionSize').value==='large'?Math.round(h*.07):Math.round(h*.05);ctx.font='700 '+size+'px Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';const lines=wrapText(caption,w*.84),lineH=size*1.25;let y=$('captionPosition').value==='top'?h*.14+lineH/2:$('captionPosition').value==='center'?h/2:h*.84-(lines.length-1)*lineH/2;lines.forEach((line,i)=>{ctx.lineWidth=Math.max(3,size*.16);ctx.strokeStyle='rgba(0,0,0,.85)';ctx.lineJoin='round';ctx.strokeText(line,w/2,y+i*lineH);ctx.fillStyle='#fff';ctx.fillText(line,w/2,y+i*lineH)})}}
function seekTo(time){return new Promise((resolve,reject)=>{if(Math.abs(video.currentTime-time)<.04){resolve();return}const timer=setTimeout(()=>{video.removeEventListener('seeked',done);reject(new Error('Video seek timed out. Try a shorter MP4 video.'))},12000);function done(){clearTimeout(timer);resolve()}video.addEventListener('seeked',done,{once:true});video.currentTime=time})}
async function exportVideo(){
 if(!video.src||recording)return;if(!canvas.captureStream||!window.MediaRecorder){toast('Video export is not supported. Try the latest Chrome or Edge.');return}
 if(!video.duration||!Number.isFinite(video.duration)){toast('Wait for the video to finish loading.');return}
 recording=true;$('exportBtn').disabled=true;$('progressWrap').classList.remove('hidden');$('progressLabel').textContent='Preparing your video...';$('progressPercent').textContent='0%';$('progressBar').style.width='0%';
 const oldTime=video.currentTime;let stream=null,recorder=null,chunks=[],audioContext=null,raf=0;
 try{
  const {w,h}=dimensions();canvas.width=w;canvas.height=h;video.pause();await seekTo(state.start);drawFrame();stream=canvas.captureStream(30);
  if(!audioContext)audioContext=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();
  if(!videoSource){videoSource=audioContext.createMediaElementSource(video);videoSource.connect(audioContext.destination)}
  if(mixDestination)try{mixDestination.disconnect()}catch(e){}
  mixDestination=audioContext.createMediaStreamDestination();videoSource.connect(mixDestination);
  if(audioEl){if(!musicSource)musicSource=audioContext.createMediaElementSource(audioEl);musicSource.connect(mixDestination);audioEl.currentTime=0}
  mixDestination.stream.getAudioTracks().forEach(t=>stream.addTrack(t));
  let mime='video/webm;codecs=vp9,opus';if(!MediaRecorder.isTypeSupported(mime))mime='video/webm;codecs=vp8,opus';if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:$('qualitySelect').value==='high'?6000000:3000000});
  recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  const done=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=()=>reject(new Error('Recording failed'))});
  recorder.start(250);$('progressLabel').textContent='Rendering your video...';await video.play();if(audioEl)await audioEl.play().catch(()=>{});
  await new Promise((resolve,reject)=>{const tick=()=>{if(!recording){resolve();return}try{drawFrame()}catch(e){}const elapsed=Math.max(0,video.currentTime-state.start),duration=Math.max(.1,state.end-state.start),pct=Math.min(99,Math.round(elapsed/duration*100));$('progressPercent').textContent=pct+'%';$('progressBar').style.width=pct+'%';if(video.currentTime>=state.end||video.ended){recording=false;resolve();return}raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);video.addEventListener('ended',()=>{recording=false;resolve()},{once:true})});
  if(recorder.state!=='inactive')recorder.stop();if(audioEl)audioEl.pause();await done;const blob=new Blob(chunks,{type:mime});if(!blob.size)throw new Error('Export file was empty. Please retry.');
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ajju-edited-video.webm';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);$('progressPercent').textContent='100%';$('progressBar').style.width='100%';$('progressLabel').textContent='Export complete!';toast('Edited video downloaded as WebM.')
 }catch(err){recording=false;toast(err.message||'Export failed. Try a shorter MP4 video.')}
 finally{cancelAnimationFrame(raf);if(recorder&&recorder.state!=='inactive')try{recorder.stop()}catch(e){}if(stream)stream.getTracks().forEach(t=>t.stop());if(audioEl)audioEl.pause();video.pause();if(Number.isFinite(oldTime)&&state.duration)try{await seekTo(Math.min(oldTime,state.duration))}catch(e){}if(mixDestination)try{mixDestination.disconnect()}catch(e){}$('exportBtn').disabled=!video.src;setTimeout(()=>$('progressWrap').classList.add('hidden'),5000)}
}
$('exportBtn').addEventListener('click',exportVideo);
$('helpBtn').onclick=()=>$('helpModal').classList.remove('hidden');$('closeHelp').onclick=()=>$('helpModal').classList.add('hidden');$('gotIt').onclick=()=>$('helpModal').classList.add('hidden');$('helpModal').addEventListener('click',e=>{if(e.target===$('helpModal'))$('helpModal').classList.add('hidden')});
$('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');document.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',()=>{$('sidebar').classList.remove('open');document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active'));a.classList.add('active')}));
setLoaded(false);
})();