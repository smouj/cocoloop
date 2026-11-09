// CL Studio project model — original MIT-licensed implementation.
export const INSTRUMENTS = {
  kick: {label:'Kick', type:'drum', color:'#fb7f72'},
  snare: {label:'Snare', type:'drum', color:'#ecad75'},
  hat: {label:'Closed Hat', type:'drum', color:'#e5cd7c'},
  clap: {label:'Clap', type:'drum', color:'#eb9ab5'},
  perc: {label:'Percussion', type:'drum', color:'#c2a3f2'},
  bass: {label:'808 Bass', type:'synth', color:'#65dbb7'},
  keys: {label:'Electric Keys', type:'synth', color:'#7ca9f4'},
  lead: {label:'Analog Lead', type:'synth', color:'#c29af5'},
  pad: {label:'Soft Pad', type:'synth', color:'#81c6da'},
  sampler: {label:'Audio Sampler', type:'drum', color:'#f8ad7c'},
};
const copy = value => JSON.parse(JSON.stringify(value));
let serial = 0;
export function uid(){return `cl_${Date.now().toString(36)}_${(++serial).toString(36)}`;}
export const clamp = (x,a,b) => Math.max(a, Math.min(b,x));
export function makeTrack(instrument='bass', name='', bars=8){
  if (!INSTRUMENTS[instrument]) throw Error('Instrumento no reconocido');
  const info=INSTRUMENTS[instrument];
  return {
    id:uid(), name: name || info.label, type:info.type, instrument, color:info.color,
    steps: Array(16).fill(false), notes:[], clips:Array.from({length:bars},(_,i)=>i),
    volume:.75, pan:0, cutoff:12000, delay:0, mute:false, solo:false,
    sampleName:null, sampleBase64:null,
  };
}
function steps(track, indices){indices.forEach(i=>track.steps[i]=true);return track;}
function melody(track, notes){track.notes=notes.map(([pitch,start,length=2,velocity=90])=>({pitch,start,length,velocity}));return track;}
export function starterProject(style='trap'){
  const bpm={trap:140,house:124,lofi:86}[style]||140;
  const bars=8;
  const instruments=['kick','snare','hat','clap','bass','keys','lead'];
  const tracks=instruments.map(k=>makeTrack(k,'',bars));
  tracks[0].name='KICK / Punch'; tracks[1].name='SNARE / Rim';
  tracks[2].name='HAT / Tight'; tracks[3].name='CLAP / Layer';
  tracks[4].name='808 / Sub bass'; tracks[5].name='KEYS / Chords'; tracks[6].name='LEAD / Texture';
  if(style==='house'){
    steps(tracks[0],[0,4,8,12]);steps(tracks[1],[4,12]);steps(tracks[2],[2,6,10,14]);steps(tracks[3],[4,12]);
    melody(tracks[4],[[36,0,2],[36,4,2],[39,8,2],[41,12,2]]);
    melody(tracks[5],[[60,0,4],[63,0,4],[67,0,4],[58,8,4],[62,8,4],[65,8,4]]);
  } else if(style==='lofi'){
    steps(tracks[0],[0,7,10]);steps(tracks[1],[4,12]);steps(tracks[2],[0,3,6,8,11,14]);
    melody(tracks[4],[[36,0,4],[39,7,3],[41,11,4]]);
    melody(tracks[5],[[60,0,7],[63,0,7],[67,0,7],[58,8,7],[62,8,7],[65,8,7]]);
  } else {
    steps(tracks[0],[0,7,10]);steps(tracks[1],[4,12]);steps(tracks[2],[0,2,4,6,8,10,12,14]);steps(tracks[3],[12]);
    melody(tracks[4],[[36,0,4],[36,6,2],[39,8,3],[34,12,4]]);
    melody(tracks[5],[[60,0,4],[63,0,4],[67,0,4],[58,8,4],[62,8,4],[65,8,4]]);
    melody(tracks[6],[[72,0,1],[75,3,1],[79,6,2],[75,12,2]]);
  }
  tracks[3].clips=[1,3,5,7];tracks[6].clips=[2,3,6,7];
  tracks[5].volume=.48; tracks[6].volume=.35;tracks[4].volume=.72;
  return {schema:'clstudio.project',version:1,id:uid(),title:'Untitled session',style,bpm,bars,masterVolume:.78,tracks};
}
export function validateProject(input){
  if(!input||!['clstudio.project','alstudio.project'].includes(input.schema)||input.version!==1) throw Error('Formato de proyecto incompatible');
  if(!Number.isFinite(input.bpm)||input.bpm<40||input.bpm>260)throw Error('BPM inválido');
  if(!Number.isInteger(input.bars)||input.bars<1||input.bars>32)throw Error('Compases inválidos');
  if(typeof input.title!=='string'||input.title.length>120)throw Error('Título inválido');
  if(!Number.isFinite(input.masterVolume)||input.masterVolume<0||input.masterVolume>1)throw Error('Volumen maestro inválido');
  if(!Array.isArray(input.tracks)||input.tracks.length>32)throw Error('Demasiadas pistas');
  const ids=new Set();
  input.tracks.forEach(t=>{
    if(typeof t.id!=='string'||!/^[a-zA-Z0-9_-]{1,90}$/.test(t.id)||ids.has(t.id))throw Error('Identificador de pista inválido');
    ids.add(t.id);
    if(!INSTRUMENTS[t.instrument]||t.type!==INSTRUMENTS[t.instrument].type)throw Error('Instrumento inválido');
    if(typeof t.name!=='string'||t.name.length>90)throw Error('Nombre de pista inválido');
    if(typeof t.color!=='string'||!/^#[0-9a-fA-F]{6}$/.test(t.color))throw Error('Color de pista inválido');
    if(typeof t.mute!=='boolean'||typeof t.solo!=='boolean')throw Error('Estado de pista inválido');
    if(t.sampleName!==null&&(typeof t.sampleName!=='string'||t.sampleName.length>90))throw Error('Nombre de muestra inválido');
    if(!Array.isArray(t.steps)||t.steps.length!==16||!t.steps.every(x=>typeof x==='boolean'))throw Error('Patrón inválido');
    if(!Array.isArray(t.notes)||t.notes.length>1024)throw Error('Notas inválidas');
    t.notes.forEach(n=>{
      if(!Number.isInteger(n.pitch)||n.pitch<0||n.pitch>127||!Number.isInteger(n.start)||n.start<0||n.start>15||!Number.isInteger(n.length)||n.length<1||n.length>16||!Number.isFinite(n.velocity)||n.velocity<1||n.velocity>127)throw Error('Nota inválida');
    });
    if(!Array.isArray(t.clips)||t.clips.length>32||!t.clips.every(b=>Number.isInteger(b)&&b>=0&&b<input.bars))throw Error('Clips inválidos');
    if(!Number.isFinite(t.volume)||t.volume<0||t.volume>1||!Number.isFinite(t.pan)||t.pan< -1||t.pan>1||!Number.isFinite(t.cutoff)||t.cutoff<200||t.cutoff>18000||!Number.isFinite(t.delay)||t.delay<0||t.delay>1)throw Error('Mezclador inválido');
    if(t.sampleBase64!==null&&(typeof t.sampleBase64!=='string'||t.sampleBase64.length>20000000||!/^data:audio\/(?:wav|wave|x-wav|mpeg|mp3|ogg|webm|aiff|x-aiff|mp4);base64,/.test(t.sampleBase64)))throw Error('Muestra no válida');
  });
  const result=copy(input);
  // Import projects from the previous AL Studio prototype without changing the original file.
  result.schema='clstudio.project';
  return result;
}
function getTrack(p,id){let t=p.tracks.find(t=>t.id===id);if(!t)throw Error('Pista inexistente: '+id);return t;}
function integer(v,min,max,label){if(!Number.isInteger(v)||v<min||v>max)throw Error(label+' fuera de rango');return v;}
function numeric(v,min,max,label){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error(label+' fuera de rango');return v;}
export function applyAction(project, action){
  if(!action||typeof action!=='object'||Array.isArray(action))throw Error('Acción inválida');
  const p=copy(project);
  const a=action;
  switch(a.type){
    case 'set_tempo':p.bpm=integer(a.bpm,40,260,'BPM');break;
    case 'set_title': if(typeof a.title!=='string'||!a.title.trim()||a.title.length>120)throw Error('Título inválido');p.title=a.title.trim();break;
    case 'set_bars':{
      p.bars=integer(a.bars,1,32,'Compases');p.tracks.forEach(t=>t.clips=t.clips.filter(b=>b<p.bars));break;
    }
    case 'set_master':p.masterVolume=numeric(a.volume,0,1,'Volumen maestro');break;
    case 'add_track':{
      if(p.tracks.length>=32)throw Error('Límite de pistas alcanzado');
      const name=a.name===undefined?'':a.name;
      if(typeof name!=='string'||name.length>90)throw Error('Nombre inválido');
      const t=makeTrack(a.instrument||'bass',name,p.bars);
      // Optional stable id for agents to address newly created tracks predictably.
      if(a.id!==undefined){if(typeof a.id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(a.id)||p.tracks.some(x=>x.id===a.id))throw Error('ID de pista inválido');t.id=a.id;}
      p.tracks.push(t);break;
    }
    case 'delete_track':{const ix=p.tracks.findIndex(t=>t.id===a.track_id);if(ix<0)throw Error('Pista inexistente');p.tracks.splice(ix,1);break;}
    case 'rename_track':{
      if(typeof a.name!=='string'||!a.name.trim()||a.name.length>90)throw Error('Nombre inválido');getTrack(p,a.track_id).name=a.name.trim();break;
    }
    case 'set_step':{if(typeof a.enabled!=='boolean')throw Error('enabled debe ser booleano');getTrack(p,a.track_id).steps[integer(a.step,0,15,'Paso')]=a.enabled;break;}
    case 'set_steps':{
      if(!Array.isArray(a.steps)||a.steps.length>16||!a.steps.every(i=>Number.isInteger(i)&&i>=0&&i<=15))throw Error('Pasos inválidos');
      const t=getTrack(p,a.track_id);t.steps=Array(16).fill(false);a.steps.forEach(s=>t.steps[s]=true);break;
    }
    case 'add_note':{
      const t=getTrack(p,a.track_id);if(t.type!=='synth')throw Error('La pista no admite notas MIDI');
      const n={pitch:integer(a.pitch,0,127,'Nota'),start:integer(a.start,0,15,'Inicio'),length:integer(a.length??2,1,16,'Duración'),velocity:integer(a.velocity??100,1,127,'Velocidad')};
      t.notes=t.notes.filter(x=>!(x.pitch===n.pitch&&x.start===n.start));
      if(t.notes.length>=1024)throw Error('Límite de notas alcanzado');t.notes.push(n);break;
    }
    case 'remove_note':{
      const t=getTrack(p,a.track_id);const pitch=integer(a.pitch,0,127,'Nota'),start=integer(a.start,0,15,'Inicio');
      t.notes=t.notes.filter(x=>!(x.pitch===pitch&&x.start===start));break;
    }
    case 'set_track':{
      const t=getTrack(p,a.track_id);
      const allowed={volume:[0,1],pan:[-1,1],cutoff:[200,18000],delay:[0,1]};
      if(a.field in allowed){const [lo,hi]=allowed[a.field];t[a.field]=numeric(a.value,lo,hi,a.field);}
      else if(['mute','solo'].includes(a.field)){if(typeof a.value!=='boolean')throw Error('Valor booleano esperado');t[a.field]=a.value;}
      else throw Error('Parámetro de pista no permitido');break;
    }
    case 'set_clip':{
      if(typeof a.enabled!=='boolean')throw Error('enabled debe ser booleano');const t=getTrack(p,a.track_id);const bar=integer(a.bar,0,p.bars-1,'Compás');
      t.clips=t.clips.filter(x=>x!==bar);if(a.enabled)t.clips.push(bar);t.clips.sort((a,b)=>a-b);break;
    }
    case 'clear_track':{
      const t=getTrack(p,a.track_id);t.steps=Array(16).fill(false);t.notes=[];break;
    }
    default:throw Error('Acción no permitida: '+a.type);
  }
  return p;
}
export function applyActions(project,actions){
  if(!Array.isArray(actions)||actions.length===0||actions.length>64)throw Error('Lote inválido (1-64 acciones)');
  return actions.reduce((p,a)=>applyAction(p,a),project);
}
export function pitchLabel(p){const notes=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];return notes[p%12]+(Math.floor(p/12)-1);}
