import {INSTRUMENTS,starterProject,makeTrack,validateProject,applyActions,pitchLabel,uid} from './model.js';
import {AudioEngine,midiBlob} from './audio.js';

const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={
 layout:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 piano:'<path d="M3 5h18v14H3zM8 5v9M12 5v9M16 5v9M6.5 5v7M10.5 5v7M14.5 5v7"/>',
 sliders:'<path d="M4 5v14M12 5v14M20 5v14"/><circle cx="4" cy="10" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="9" r="2" fill="currentColor" stroke="none"/>',
 sparkles:'<path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3ZM5 18l.6 1.4L7 20l-1.4.6L5 22l-.6-1.4L3 20l1.4-.6L5 18ZM19 2l.6 1.4L21 4l-1.4.6L19 6l-.6-1.4L17 4l1.4-.6L19 2Z"/>',
 'file-plus':'<path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v5h5M8 15h7m-3.5-3.5v7"/>',
 'folder-open':'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2M3 10l-1 9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2l2-8H5a2 2 0 0 0-2 2"/>',
 save:'<path d="M4 3h14l3 3v15H3V3h1Z"/><path d="M7 3v7h10V3M7 21v-8h10v8"/>',
 download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',music:'<path d="M9 18V5l12-2v13M9 9l12-2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
 undo:'<path d="M9 14 4 9l5-5M4 9h9a7 7 0 1 1 0 14h-2"/>',redo:'<path d="m15 14 5-5-5-5m5 5h-9a7 7 0 1 0 0 14h2"/>',
 shield:'<path d="m12 2 9 4v6c0 5-3 8-9 10-6-2-9-5-9-10V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
 activity:'<path d="M3 12h4l3-7 4 14 3-7h4"/>',square:'<rect x="5" y="5" width="14" height="14" rx="2"/>',
 play:'<path d="m8 5 11 7-11 7V5Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',repeat:'<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3"/>',
 waveform:'<path d="M2 12h2m2-5v10m3-14v18m3-12v6m3-10v14m3-12v10m3-5h2"/>',
 'chevron-down':'<path d="m6 9 6 6 6-6"/>',plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 shuffle:'<path d="M16 3h5v5M21 3l-6 6M3 3l18 18M16 21h5v-5M21 21l-6-6M3 21l6-6"/>',eraser:'<path d="m19 4 3 3a2 2 0 0 1 0 3L12 20H6L2 16 14 4a3 3 0 0 1 5 0Zm-13 16h16"/>',
 'volume-2':'<path d="M11 5 6 9H3v6h3l5 4V5Zm4 4a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/>',upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
 x:'<path d="M5 5 19 19M19 5 5 19"/>',headphones:'<path d="M3 13v-2a9 9 0 0 1 18 0v2M3 13h4v8H5a2 2 0 0 1-2-2v-6Zm18 0h-4v8h2a2 2 0 0 0 2-2v-6Z"/>',
 keyboard:'<path d="M2 5h20v14H2V5ZM2 13h20M7 13v6m5-6v6m5-6v6M6 5v4m5-4v4m5-4v4"/>',
 drum:'<ellipse cx="12" cy="6" rx="9" ry="3"/><path d="M3 6v10c0 4 18 4 18 0V6M3 11c4 4 14 4 18 0M6 19l-2 3m14-3 2 3"/>'
};
function ico(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.music}</svg>`;}
function installIcons(root=document){root.querySelectorAll('[data-icon]').forEach(n=>{n.innerHTML=ico(n.dataset.icon)});}
installIcons();

const KEY='cocoloop.autosave.v1';
let project;
try{
  const saved=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('alstudio.autosave.v1'));
  project=validateProject(saved);
}catch{project=starterProject('trap');}
let selectedId=project.tracks.find(t=>t.instrument==='bass')?.id||project.tracks[0]?.id;
let undoStack=[],redoStack=[],currentView='studio',noteLength=2,noteVelocity=100,looping=true,metronomeOn=false,playStep=-1;
let bridgeOnline=false,agentEditingAllowed=false,connectionSequence=0,toastTimer=0;
const activity=[];
const audio=new AudioEngine(step=>{playStep=step;paintPlayhead();},()=>updatePlayButton(),level=>paintMeter(level));
const selected=()=>project.tracks.find(t=>t.id===selectedId)||project.tracks[0];
function toast(message,error=false){const t=$('#toast');t.textContent=message;t.className='toast visible'+(error?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.className='toast',3100);}
function log(message){activity.unshift({message,time:new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})});if(activity.length>15)activity.pop();renderActivity();}
function renderActivity(){$('#activity').innerHTML=activity.map(a=>`<div class="activity-row"><i></i><span>${esc(a.message)}</span><time>${a.time}</time></div>`).join('')||'<div class="activity-row">No actions yet</div>';}
log('Session initialized');
let syncTimer;
function bridgeSnapshot(){const view=JSON.parse(JSON.stringify(project));view.tracks.forEach(t=>{t.sampleBase64=null;});return view;}
function syncState(){clearTimeout(syncTimer);syncTimer=setTimeout(()=>{
  const autosave=JSON.parse(JSON.stringify(project));
  autosave.tracks.forEach(t=>{if(t.sampleBase64)t.sampleBase64=null;});
  try{localStorage.setItem(KEY,JSON.stringify(autosave));}catch(e){console.warn('Autosave failed',e);}
  fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:bridgeSnapshot()})}).then(r=>{if(!r.ok)bridgeOnline=false;}).catch(()=>{bridgeOnline=false;});
},120);}
function commit(actions,{source='user',silent=false}={}){
  try{
    const candidate=applyActions(project,actions);
    undoStack.push(project);if(undoStack.length>70)undoStack.shift();redoStack=[];
    if(audio.playing)audio.stop();project=candidate;
    if(!project.tracks.find(t=>t.id===selectedId))selectedId=project.tracks[0]?.id;
    render();syncState();
    if(!silent)log(source==='agent'?`Agent applied ${actions.length} action(s)`:`Edited ${actions.length} action(s)`);
    return {ok:true,message:`${actions.length} action(s) applied`};
  }catch(e){toast(e.message,true);return {ok:false,message:e.message};}
}
function replaceProject(p,reason='Project loaded'){
  try{const checked=validateProject(p);undoStack.push(project);redoStack=[];if(audio.playing)audio.stop();project=checked;selectedId=project.tracks.find(t=>t.instrument==='bass')?.id||project.tracks[0]?.id;render();syncState();log(reason);return true;}
  catch(e){toast('No se pudo cargar: '+e.message,true);return false;}
}
function undo(){if(!undoStack.length)return;redoStack.push(project);if(audio.playing)audio.stop();project=undoStack.pop();selectedId=project.tracks.some(t=>t.id===selectedId)?selectedId:project.tracks[0]?.id;render();syncState();log('Undo');}
function redo(){if(!redoStack.length)return;undoStack.push(project);if(audio.playing)audio.stop();project=redoStack.pop();selectedId=project.tracks.some(t=>t.id===selectedId)?selectedId:project.tracks[0]?.id;render();syncState();log('Redo');}
function setSelected(id){selectedId=id;renderRack();renderPiano();renderInspector();renderMixer();}
function render(){
  $('#project-title').value=project.title;$('#bpm').value=project.bpm;
  $('#project-style').textContent=(project.style||'CUSTOM').toUpperCase()+' SESSION';
  $('#stat-tracks').textContent=String(project.tracks.length).padStart(2,'0');
  $('#stat-bars').textContent=String(project.bars).padStart(2,'0');
  $('#stat-notes').textContent=String(project.tracks.reduce((acc,t)=>acc+t.notes.length,0)).padStart(3,'0');
  $('#arrangement-info').textContent=project.bars+' bars · 4/4';
  $('#undo').disabled=!undoStack.length;$('#redo').disabled=!redoStack.length;
  renderArrangement();renderRack();renderPiano();renderMixer();renderInspector();paintPlayhead();
}
function renderArrangement(){
  const el=$('#arrangement');let html=`<div class="arr-grid" style="--bars:${project.bars}"><div class="arr-playhead" id="arr-playhead"></div><div class="arr-headlabel">TRACK / BAR</div>`;
  for(let bar=0;bar<project.bars;bar++)html+=`<div class="arr-bar">${String(bar+1).padStart(2,'0')}</div>`;
  for(const t of project.tracks){
    html+=`<div class="arr-track" data-select-track="${esc(t.id)}"><span class="dot" style="background:${t.color}"></span><span class="arr-track-name">${esc(t.name)}</span></div>`;
    for(let bar=0;bar<project.bars;bar++){
      const enabled=t.clips.includes(bar);
      html+=`<div class="arr-cell" data-clip-track="${esc(t.id)}" data-bar="${bar}" title="${enabled?'Remove':'Add'} pattern clip">${enabled?`<div class="arr-clip" style="background:${t.color};opacity:${t.mute?.36:.86}"><span>${esc(t.name.split('/')[0].trim())}</span><i class="clip-wave"></i></div>`:''}</div>`;
    }
  }
  el.innerHTML=html+'</div>';
  el.querySelectorAll('[data-clip-track]').forEach(cell=>cell.addEventListener('click',()=>{
    const t=project.tracks.find(t=>t.id===cell.dataset.clipTrack);const b=Number(cell.dataset.bar);
    commit([{type:'set_clip',track_id:t.id,bar:b,enabled:!t.clips.includes(b)}],{silent:true});
  }));
  el.querySelectorAll('[data-select-track]').forEach(cell=>cell.addEventListener('click',()=>setSelected(cell.dataset.selectTrack)));
}
function renderRack(){
  const el=$('#rack');el.innerHTML=project.tracks.map(t=>{
    const label=INSTRUMENTS[t.instrument]?.label||t.instrument;
    return `<div class="rack-row ${selectedId===t.id?'selected':''}" data-id="${esc(t.id)}" style="--track-color:${t.color}">
      <span class="channel-icon">${ico(t.type==='drum'?'drum':'piano')}</span><span class="channel-name" data-select="${esc(t.id)}"><strong style="color:${t.color}">${esc(t.name)}</strong><small>${esc(label.toUpperCase())}</small></span>
      <button class="channel-mute ${t.mute?'is-muted':''}" data-mute="${esc(t.id)}" title="Mute track">${t.mute?'M':'ON'}</button><div class="step-grid">${Array.from({length:16},(_,s)=>{
        const enabled=t.type==='drum'?t.steps[s]:t.notes.some(n=>n.start===s);
        return `<button class="step ${enabled?'on':''} ${playStep%16===s?'playing':''}" data-step="${s}" data-track="${esc(t.id)}" title="Step ${s+1}" aria-label="${esc(t.name)} step ${s+1}"></button>`;
      }).join('')}</div><button class="channel-audition" data-audition="${esc(t.id)}" aria-label="Preview ${esc(t.name)}" title="Preview">${ico('play')}</button></div>`;
  }).join('');
  el.querySelectorAll('[data-select]').forEach(n=>n.addEventListener('click',()=>setSelected(n.dataset.select)));
  el.querySelectorAll('[data-mute]').forEach(n=>n.addEventListener('click',()=>{const t=project.tracks.find(t=>t.id===n.dataset.mute);commit([{type:'set_track',track_id:t.id,field:'mute',value:!t.mute}],{silent:true});}));
  el.querySelectorAll('[data-audition]').forEach(n=>n.addEventListener('click',async()=>{
    const t=project.tracks.find(t=>t.id===n.dataset.audition);
    try{await audio.loadSamples(project);await audio.preview(t,t.instrument==='bass'?36:60)}catch(e){toast('Audio: '+e.message,true)};
  }));
  el.querySelectorAll('[data-step]').forEach(n=>n.addEventListener('click',()=>{
    const t=project.tracks.find(t=>t.id===n.dataset.track),s=Number(n.dataset.step);setSelected(t.id);
    if(t.type==='drum')commit([{type:'set_step',track_id:t.id,step:s,enabled:!t.steps[s]}],{silent:true});
    else{
      const existing=t.notes.find(n=>n.start===s),pitch=existing?.pitch??(t.instrument==='bass'?36:60);
      commit([{type:existing?'remove_note':'add_note',track_id:t.id,pitch,start:s,...(!existing?{length:noteLength,velocity:noteVelocity}:{})}],{silent:true});
    }
  }));
}
const pianoPitches=Array.from({length:48},(_,i)=>83-i);
function renderPiano(){
  const t=selected();$('#piano-track-label').textContent=t? t.name.toUpperCase(): 'NO CHANNEL';
  if(!t||t.type==='drum'){
    $('#piano').innerHTML=`<div class="piano-empty">${ico('piano')}<b>Select a melodic instrument</b><span>Kick, snare and percussion are programmed in the Channel Rack.</span></div>`;
    return;
  }
  const scroll=$('.piano-content'),prior=scroll.scrollTop,first=!scroll.dataset.pianoVisited;
  let keys='',cells='';
  const notes=new Map();for(const n of t.notes){for(let s=n.start;s<Math.min(16,n.start+n.length);s++)notes.set(n.pitch+':'+s,s===n.start?'start':'continue');}
  for(const pitch of pianoPitches){const pitchName=pitchLabel(pitch),black=pitchName.includes('#');
    keys+=`<div class="piano-key ${black?'black':''} ${pitch%12===0?'marker':''}">${pitch%12===0?esc(pitchName):black?'':esc(pitchName.slice(0,-1))}</div>`;
    for(let s=0;s<16;s++){
      const active=notes.get(pitch+':'+s);
      cells+=`<button class="piano-cell ${black?'black':''} ${s%4===0?'beat-start':''} ${active==='start'?'active-note':active==='continue'?'note-continue':''}" data-pitch="${pitch}" data-start="${s}" title="${pitchName} · step ${s+1}"></button>`;
    }
  }
  $('#piano').innerHTML=`<div class="piano-main"><div class="piano-keys">${keys}</div><div class="piano-grid">${cells}</div></div>`;
  $('#piano').querySelectorAll('.piano-cell').forEach(cell=>{
    const update=(remove=false)=>{
      const pitch=Number(cell.dataset.pitch),start=Number(cell.dataset.start);
      const found=t.notes.find(n=>n.pitch===pitch&&start>=n.start&&start<n.start+n.length);
      if(found){commit([{type:'remove_note',track_id:t.id,pitch:found.pitch,start:found.start}],{silent:true});}
      else if(!remove){commit([{type:'add_note',track_id:t.id,pitch,start,length:noteLength,velocity:noteVelocity}],{silent:true});audio.preview(t,pitch).catch(()=>{});}
    };
    cell.addEventListener('click',()=>update(false));cell.addEventListener('contextmenu',e=>{e.preventDefault();update(true)});
  });
  if(first){scroll.scrollTop=t.instrument==='bass'?620:190;scroll.dataset.pianoVisited='true';}
  else scroll.scrollTop=prior;
}
function masterStripHtml(){
  const value=Math.round(project.masterVolume*100);
  return `<div class="mixer-strip master-strip" data-master-strip style="--track-color:var(--mint)"><div class="mixer-strip-head"><i style="background:var(--mint)"></i><span>MASTER</span></div><div class="fader-body"><div class="fader-ui"><div class="fader-track"><div class="fader-fill" style="height:${value}%"></div><div class="fader-knob" style="bottom:${value}%"></div></div><input type="range" aria-label="Master volume" data-master-fader min="0" max="100" value="${value}"></div></div><div class="mixer-percent" data-master-val>${value}%</div></div>`;
}
function renderMixer(){
  const el=$('#mixer-banks');el.innerHTML=project.tracks.map(t=>{
    const value=Math.round(t.volume*100);
    return `<div class="mixer-strip ${t.id===selectedId?'selected':''}" data-select-mixer="${esc(t.id)}" style="--track-color:${t.color}"><div class="mixer-strip-head"><i style="background:${t.color}"></i><span>${esc(t.name.split('/')[0])}</span></div><div class="fader-body"><div class="fader-ui"><div class="fader-track"><div class="fader-fill" style="height:${value}%"></div><div class="fader-knob" style="bottom:${value}%"></div></div><input type="range" aria-label="Volume ${esc(t.name)}" data-fader="${esc(t.id)}" min="0" max="100" value="${value}"></div></div><div class="mixer-percent" data-mixer-val="${esc(t.id)}">${value}%</div></div>`;
  }).join('')+masterStripHtml();
  el.querySelectorAll('[data-select-mixer]').forEach(n=>n.addEventListener('click',e=>{if(!e.target.closest('input'))setSelected(n.dataset.selectMixer)}));
  el.querySelectorAll('[data-fader]').forEach(input=>{
    input.addEventListener('input',()=>{
      const strip=input.closest('.mixer-strip');strip.querySelector('.fader-fill').style.height=input.value+'%';strip.querySelector('.fader-knob').style.bottom=input.value+'%';strip.querySelector('.mixer-percent').textContent=input.value+'%';
    });
    input.addEventListener('change',()=>commit([{type:'set_track',track_id:input.dataset.fader,field:'volume',value:Number(input.value)/100}],{silent:true}));
  });
  const master=el.querySelector('[data-master-fader]');
  if(master){
    master.addEventListener('input',()=>{
      const strip=master.closest('.mixer-strip');strip.querySelector('.fader-fill').style.height=master.value+'%';strip.querySelector('.fader-knob').style.bottom=master.value+'%';strip.querySelector('[data-master-val]').textContent=master.value+'%';
    });
    master.addEventListener('change',()=>commit([{type:'set_master',volume:Number(master.value)/100}],{silent:true}));
  }
}
function renderInspector(){
  const t=selected();if(!t){$('#track-name').textContent='No tracks';$('#sample-section').classList.add('hidden');return;}
  $('#track-name').textContent=t.name;$('#track-instrument').textContent=INSTRUMENTS[t.instrument].label.toUpperCase();
  $('#track-avatar').style.background=t.color+'24';$('#track-avatar').style.color=t.color;
  $('#mute-track').classList.toggle('active',t.mute);$('#solo-track').classList.toggle('active',t.solo);
  $('#track-volume').value=Math.round(t.volume*100);$('#volume-output').textContent=Math.round(t.volume*100)+'%';
  $('#track-pan').value=Math.round(t.pan*100);$('#pan-output').textContent=t.pan===0?'C':t.pan<0?'L '+Math.abs(Math.round(t.pan*100)):'R '+Math.round(t.pan*100);
  $('#track-cutoff').value=t.cutoff;$('#cutoff-output').textContent=t.cutoff>=1000?(t.cutoff/1000).toFixed(1)+' kHz':t.cutoff+' Hz';
  $('#track-delay').value=Math.round(t.delay*100);$('#delay-output').textContent=Math.round(t.delay*100)+'%';
  $('#sample-section').classList.toggle('hidden',t.instrument!=='sampler');
  $('#sample-info').textContent=t.sampleName?`Loaded: ${t.sampleName}`:'Load a WAV, MP3 or OGG file. Embedded in exported project; not in browser autosave.';
}
function paintPlayhead(){
  const play=playStep>=0,step=play?playStep%16:-1,bar=play?Math.floor(playStep/16):0;
  $$('.step').forEach(el=>el.classList.toggle('playing',play&&Number(el.dataset.step)===step));
  $('#bar-indicator').textContent=play?`${String(bar+1).padStart(2,'0')} : ${String(Math.floor(step/4)+1).padStart(2,'0')} : ${String(step%4+1).padStart(2,'0')}`:'01 : 01 : 01';
  const head=$('#arr-playhead'),grid=$('.arr-grid');
  if(head&&grid){head.style.display=play?'block':'none';if(play){const width=grid.clientWidth-146;head.style.left=(146+width*(bar+step/16)/project.bars)+'px';}}
}
function paintMeter(level){const bars=$$('#master-meter i'),count=Math.round(level*bars.length);bars.forEach((x,i)=>x.classList.toggle('lit',i<count));$('#engine-db').textContent=level>0?(20*Math.log10(Math.max(level,.001))).toFixed(1)+' dB':'-∞ dB';}
function updatePlayButton(){$('#play-icon').innerHTML=ico(audio.playing?'pause':'play');$('#play').title=audio.playing?'Stop':'Play';}
async function togglePlay(){try{if(audio.playing)audio.stop();else await audio.play(project,looping,metronomeOn);updatePlayButton();}catch(e){toast('Audio: '+e.message,true);}}
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function safeFileName(){return project.title.replace(/[^\p{L}\p{N} _-]+/gu,'').trim().replace(/\s+/g,'-')||'cocoloop-cl-studio-project';}
function saveProject(){download(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),safeFileName()+'.clstudio.json');log('Project downloaded');toast('Proyecto guardado (con muestras integradas)');}
let rendering=false;
async function exportWav(){if(rendering)return;rendering=true;try{toast('Preparando exportación WAV…');const blob=await audio.renderWav(project,message=>console.info('[CL Studio]',message));download(blob,safeFileName()+'.wav');log('WAV rendered locally');toast('Archivo WAV de 44.1 kHz exportado');}
  catch(e){console.error(e);toast('No se pudo exportar: '+e.message,true);}finally{rendering=false;}}

$('#undo').onclick=undo;$('#redo').onclick=redo;
$('#play').onclick=togglePlay;$('#stop').onclick=()=>audio.stop();
$('#loop-toggle').onclick=()=>{looping=!looping;$('#loop-toggle').classList.toggle('on',looping);$('#loop-toggle').setAttribute('aria-pressed',String(looping));};
$('#metronome').onclick=()=>{metronomeOn=!metronomeOn;audio.metronome=metronomeOn;$('#metronome').classList.toggle('on',metronomeOn);$('#metronome').setAttribute('aria-pressed',String(metronomeOn));};
$('#bpm').addEventListener('change',e=>{const bpm=Number(e.target.value);const res=commit([{type:'set_tempo',bpm}],{silent:true});if(!res.ok)e.target.value=project.bpm;});
$('#project-title').addEventListener('change',e=>{const res=commit([{type:'set_title',title:e.target.value}],{silent:true});if(!res.ok)e.target.value=project.title;});
$('#new-project').onclick=()=>{
  if(!window.confirm('¿Crear un proyecto nuevo? El proyecto actual solo se conservará si lo has guardado.'))return;
  const kind=window.prompt('Plantilla: trap, house o lofi','trap');if(kind===null)return;
  const style=['trap','house','lofi'].includes(kind.trim().toLowerCase())?kind.trim().toLowerCase():'trap';replaceProject(starterProject(style),'New '+style+' session');
};
$('#open-project').onclick=()=>$('#project-input').click();
$('#project-input').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>22_000_000){toast('Archivo demasiado grande (máximo 22 MB)',true);return;}
  try{replaceProject(JSON.parse(await file.text()));}catch(err){toast('Error de lectura: '+err.message,true)}
  e.target.value='';
};
$('#save-project').onclick=saveProject;$('#export-wav').onclick=exportWav;$('#top-export').onclick=exportWav;
$('#export-midi').onclick=()=>{try{download(midiBlob(project),safeFileName()+'.mid');log('MIDI exported');toast('Archivo MIDI exportado');}catch(e){toast(e.message,true)}};
$('#add-bar').onclick=()=>commit([{type:'set_bars',bars:project.bars+1}],{silent:true});
$('#remove-bar').onclick=()=>commit([{type:'set_bars',bars:project.bars-1}],{silent:true});
$('#random-hats').onclick=()=>{
  const hat=project.tracks.find(t=>t.instrument==='hat');if(!hat)return toast('Añade una pista de Hi Hat primero',true);
  const steps=Array.from({length:16},(_,i)=>i).filter(i=>i%2===0||(Math.random()>.78));
  commit([{type:'set_steps',track_id:hat.id,steps}],{silent:true});toast('Variación de Hi Hat aplicada');
};
$('#note-length').onchange=e=>noteLength=Number(e.target.value);
$('#note-velocity').onchange=e=>noteVelocity=Number(e.target.value);
$('#clear-notes').onclick=()=>{const t=selected();if(t)commit([{type:'clear_track',track_id:t.id}],{silent:true})};
$('#preview-track').onclick=async()=>{const t=selected();if(!t)return;try{await audio.loadSamples(project);await audio.preview(t,t.instrument==='bass'?36:60)}catch(e){toast(e.message,true)}};
$('#mute-track').onclick=()=>{const t=selected();if(t)commit([{type:'set_track',track_id:t.id,field:'mute',value:!t.mute}],{silent:true})};
$('#solo-track').onclick=()=>{const t=selected();if(t)commit([{type:'set_track',track_id:t.id,field:'solo',value:!t.solo}],{silent:true})};
$('#delete-track').onclick=()=>{const t=selected();if(t&&window.confirm(`¿Eliminar la pista «${t.name}»?`))commit([{type:'delete_track',track_id:t.id}])};
$('#duplicate-track').onclick=()=>{
  const t=selected();if(!t)return;
  try{
    const candidate=JSON.parse(JSON.stringify(project));const clone=JSON.parse(JSON.stringify(t));
    clone.id=uid();clone.name=(t.name+' copy').slice(0,90);candidate.tracks.push(clone);
    const checked=validateProject(candidate);
    undoStack.push(project);if(undoStack.length>70)undoStack.shift();redoStack=[];if(audio.playing)audio.stop();
    project=checked;selectedId=clone.id;render();syncState();log('Track duplicated: '+clone.name);toast('Pista duplicada');
  }catch(e){toast('No se pudo duplicar: '+e.message,true);}
};
for(const [selector,field,converter,formatter] of [
 ['#track-volume','volume',n=>n/100,n=>n+'%'],
 ['#track-pan','pan',n=>n/100,n=>n===0?'C':n<0?'L '+Math.abs(n):'R '+n],
 ['#track-cutoff','cutoff',n=>n,n=>n>=1000?(n/1000).toFixed(1)+' kHz':n+' Hz'],
 ['#track-delay','delay',n=>n/100,n=>n+'%']
]){
  const input=$(selector),output=$({'volume':'#volume-output','pan':'#pan-output','cutoff':'#cutoff-output','delay':'#delay-output'}[field]);
  input.addEventListener('input',()=>output.textContent=formatter(Number(input.value)));
  input.addEventListener('change',()=>{const t=selected();if(t)commit([{type:'set_track',track_id:t.id,field,value:converter(Number(input.value))}],{silent:true})});
}
$('#upload-sample').onclick=()=>$('#sample-input').click();
$('#sample-input').onchange=async e=>{
  const file=e.target.files?.[0],t=selected();if(!file||!t||t.instrument!=='sampler')return;
  if(file.size>12_000_000){toast('Máximo 12 MB por muestra',true);return;}
  try{
    const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('FileReader failed'));r.readAsDataURL(file);});
    const candidate=JSON.parse(JSON.stringify(project)),target=candidate.tracks.find(x=>x.id===t.id);
    target.sampleBase64=base64.replace(/^data:[^;]+;/,`data:audio/${file.type.includes('mpeg')?'mpeg':file.type.includes('ogg')?'ogg':file.type.includes('mp4')?'mp4':'wav'};`);
    target.sampleName=file.name.slice(0,90);
    const validated=validateProject(candidate);
    await audio.loadSamples(validated);
    undoStack.push(project);project=validated;redoStack=[];render();syncState();log('Loaded sample: '+file.name);toast('Muestra cargada');
  }catch(err){toast('Muestra incompatible: '+err.message,true)}e.target.value='';
};
function showModal(){
  $('#instrument-picker').innerHTML=Object.entries(INSTRUMENTS).map(([key,info])=>`<button class="instrument-item" style="--color:${info.color}" data-instrument="${key}">${ico(info.type==='drum'?'drum':'piano')}<strong>${esc(info.label)}</strong><small>${info.type==='drum'?'DRUM / SAMPLER':'SYNTH / MIDI'}</small></button>`).join('');
  $('#instrument-picker').querySelectorAll('[data-instrument]').forEach(btn=>btn.onclick=()=>{
    const instrument=btn.dataset.instrument;const res=commit([{type:'add_track',instrument}]);if(res.ok){selectedId=project.tracks.at(-1).id;render();hideModal();toast(INSTRUMENTS[instrument].label+' added');}
  });
  $('#modal-overlay').classList.remove('hidden');
}
function hideModal(){$('#modal-overlay').classList.add('hidden');}
$('#add-track').onclick=showModal;$('#modal-close').onclick=hideModal;$('#modal-cancel').onclick=hideModal;
$('#modal-overlay').onclick=e=>{if(e.target.id==='modal-overlay')hideModal()};

function chooseView(view){
  currentView=view;$$('.nav-link[data-view]').forEach(el=>el.classList.toggle('selected',el.dataset.view===view));
  $('#scroll-area').scrollTop=0;
  const area=$('.main-area');area.classList.remove('view-piano','view-mixer','view-agents');
  if(view!=='studio')area.classList.add('view-'+view);
  const existing=$('#agent-full-panel');if(existing)existing.remove();
  if(view==='agents'){
    const panel=document.createElement('section');panel.className='panel agent-full';panel.id='agent-full-panel';
    panel.innerHTML=`<div class="eyebrow">AGENT-NATIVE MUSIC PRODUCTION</div><h2>Your AI can edit this session.</h2><p>Conecta Codex mediante MCP u OpenClaw mediante el adaptador de comandos. Los agentes pueden ver las pistas y modificar el proyecto musical con permisos explícitos.</p><label class="toggle-row" for="agent-allowed-page" style="max-width:340px"><div><strong>Autorizar edición por agentes</strong><small>Desactivado al abrir cada sesión</small></div><input type="checkbox" id="agent-allowed-page" role="switch" ${agentEditingAllowed?'checked':''}></label><div class="section-label" style="margin:22px 0 10px">ENCARGO PARA TU AGENTE</div><textarea id="agent-task-text" class="agent-task-text" aria-label="Encargo para el agente" placeholder="Crea un patrón de batería house a 124 BPM con un bajo sencillo…"></textarea><button class="outline-button" id="agent-task-copy" style="max-width:310px">${ico('copy')} Copiar encargo e instrucciones</button><p style="margin-top:13px;font-size:11px">En esta versión alfa, el encargo se copia para enviarlo a tu agente. El chat directo dentro de CL Studio está previsto para una versión posterior.</p><pre>Codex:  python bridge/mcp_server.py\nOpenClaw: python bridge/clctl.py project\n           python bridge/clctl.py action '{"type":"set_tempo","bpm":132}'\n\nConsulta README.md para configurar las rutas completas.</pre><button class="outline-button" id="agent-view-copy">${ico('copy')} Copiar guía de conexión</button>`;
    $('#scroll-area').insertBefore(panel,$('.bottom-note'));$('#agent-view-copy').onclick=copyAgentGuide;
    $('#agent-allowed-page').onchange=e=>{$('#agent-allowed').checked=e.target.checked;$('#agent-allowed').dispatchEvent(new Event('change'));};
    $('#agent-task-copy').onclick=async()=>{const task=$('#agent-task-text').value.trim();if(!task)return toast('Escribe primero una tarea',true);try{await navigator.clipboard.writeText(agentGuide()+'\n\nTASK: '+task);toast('Encargo copiado para OpenClaw / Codex');}catch{toast('No se pudo copiar el encargo',true)}};
  }
}
$$('.nav-link[data-view]').forEach(el=>el.onclick=()=>chooseView(el.dataset.view));
function agentGuide(){return `You are working with CL Studio (CocoLoop), an open-source DAW. The app must be running at http://127.0.0.1:38475. Read its current project and track IDs before changing anything. The user must switch on "Allow agent editing". For Codex, connect the MCP server at bridge/mcp_server.py. For OpenClaw, use python bridge/clctl.py project and python bridge/clctl.py action '{"type":"set_tempo","bpm":128}'. Never edit application source files to change the music project; use the CL Studio agent tools. Use only documented actions and verify applied/rejected outcomes. You can set_tempo, set_title, set_bars, add_track, rename_track, set_step, set_steps, add_note, remove_note, set_track, set_clip and clear_track. Notes have MIDI pitch and start 0-15. Give the user a concise summary of actual changes.`;}
async function copyAgentGuide(){try{await navigator.clipboard.writeText(agentGuide());toast('Instrucciones copiadas para el agente');}catch{toast('El navegador no permite copiar. Usa la documentación del proyecto.',true)}}
$('#copy-agent-guide').onclick=copyAgentGuide;
$('#agent-allowed').onchange=e=>{agentEditingAllowed=e.target.checked;if($('#agent-allowed-page'))$('#agent-allowed-page').checked=agentEditingAllowed;log(agentEditingAllowed?'Agent editing enabled':'Agent editing disabled');toast(agentEditingAllowed?'Control del agente habilitado':'Control del agente deshabilitado');};
async function heartbeat(){
  try{const res=await fetch('/api/health');const json=await res.json();bridgeOnline=json.ok;}catch{bridgeOnline=false;}
  $('#bridge-health').classList.toggle('connected',bridgeOnline);
  $('#bridge-health').innerHTML=`<i></i>${bridgeOnline?'Local agent bridge available':'Bridge unavailable · start server.py'}`;
  if(bridgeOnline){
    try{await fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:bridgeSnapshot()})});
      const response=await fetch('/api/commands?after='+connectionSequence);const result=await response.json();
      for(const cmd of result.commands||[]){connectionSequence=Math.max(connectionSequence,cmd.id);
        let outcome;
        if(!agentEditingAllowed)outcome={ok:false,message:'El usuario no ha habilitado la edición por agentes'};
        else outcome=commit(cmd.actions,{source:'agent'});
        await fetch(`/api/commands/${cmd.id}/result`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:outcome.ok?'applied':'rejected',message:outcome.message})});
        if(!outcome.ok)log('Agent action rejected');else toast('Agente: cambios aplicados');
      }
    }catch(e){console.warn('[CL Studio] Agent bridge sync:',e);}
  }
}
window.addEventListener('keydown',e=>{
  const tag=e.target.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
  if(e.code==='Space'){e.preventDefault();togglePlay();}
  if(e.key==='Escape')hideModal();
  if(['1','2','3','4'].includes(e.key))chooseView(['studio','piano','mixer','agents'][Number(e.key)-1]);
  if(e.key.toLowerCase()==='m')$('#metronome').click();
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveProject();}
});
window.addEventListener('beforeunload',()=>{if(audio.playing)audio.stop()});
render();heartbeat();setInterval(heartbeat,1100);syncState();
