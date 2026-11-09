// CL Studio Web Audio engine. Sample-accurate scheduling; original synthesized sounds.
const freq=p=>440*Math.pow(2,(p-69)/12);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function envelope(ctx, destination, start, peak, attack, decay){
  const gain=ctx.createGain();gain.connect(destination);
  gain.gain.setValueAtTime(0.0001,start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001,peak),start+Math.max(.002,attack));
  gain.gain.exponentialRampToValueAtTime(.0001,start+Math.max(.01,attack+decay));
  return gain;
}
function osc(ctx,type,hz,when,end,dest,level=1){
  const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(hz,when);
  g.gain.value=level;o.connect(g).connect(dest);o.start(when);o.stop(end);return o;
}
const noiseCache=new WeakMap();
function noise(ctx){
  if(noiseCache.has(ctx))return noiseCache.get(ctx);
  const length=Math.floor(ctx.sampleRate),b=ctx.createBuffer(1,length,ctx.sampleRate),data=b.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=Math.random()*2-1;
  noiseCache.set(ctx,b);return b;
}
function soundDrum(ctx,kind,when,dest,buffer=null){
  if(kind==='sampler'){
    if(!buffer)return;
    const source=ctx.createBufferSource();source.buffer=buffer;source.connect(dest);source.start(when);return;
  }
  if(kind==='kick'){
    const env=envelope(ctx,dest,when,.9,.003,.48);
    const o=osc(ctx,'sine',142,when,when+.52,env);o.frequency.exponentialRampToValueAtTime(45,when+.11);
    return;
  }
  if(kind==='perc'){
    const env=envelope(ctx,dest,when,.48,.002,.22);
    const o=osc(ctx,'triangle',240,when,when+.24,env);o.frequency.exponentialRampToValueAtTime(95,when+.2);return;
  }
  const source=ctx.createBufferSource();source.buffer=noise(ctx);const filter=ctx.createBiquadFilter();
  filter.type=kind==='hat'?'highpass':kind==='clap'?'bandpass':'highpass';
  filter.frequency.value=kind==='hat'?7200:kind==='clap'?1600:1300;
  const duration=kind==='hat'?.065:kind==='clap'?.22:.17;
  const env=envelope(ctx,dest,when,kind==='hat'?.28:.48,.003,duration);
  source.connect(filter).connect(env);source.start(when);source.stop(when+duration+.03);
  if(kind==='snare'){
    const tone=envelope(ctx,dest,when,.24,.003,.115);
    osc(ctx,'triangle',190,when,when+.15,tone);
  }
}
function soundSynth(ctx,kind,pitch,when,duration,dest,velocity){
  const hz=freq(pitch);const level=clamp(velocity/127,.08,1);
  let attack=.01,release=.14,peak=.27;
  if(kind==='bass'){attack=.003;release=.12;peak=.45;}
  if(kind==='pad'){attack=.18;release=.52;peak=.20;}
  if(kind==='keys'){attack=.006;release=.28;peak=.20;}
  const env=ctx.createGain();env.connect(dest);
  env.gain.setValueAtTime(.0001,when);
  env.gain.linearRampToValueAtTime(peak*level,when+attack);
  env.gain.setValueAtTime(peak*level*.78,when+Math.max(attack+.001,duration*.6));
  env.gain.exponentialRampToValueAtTime(.0001,when+duration+release);
  const end=when+duration+release+.02;
  if(kind==='bass'){
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=580;
    filter.connect(env);
    const a=osc(ctx,'sawtooth',hz,when,end,filter,.48);a.frequency.setValueAtTime(hz*1.015,when);a.frequency.exponentialRampToValueAtTime(hz,when+.07);
    osc(ctx,'sine',hz/2,when,end,env,.7);
  }else if(kind==='keys'){
    osc(ctx,'triangle',hz,when,end,env,.74);osc(ctx,'sine',hz*2,when,end,env,.18);
  }else if(kind==='pad'){
    osc(ctx,'sawtooth',hz*.997,when,end,env,.44);osc(ctx,'sawtooth',hz*1.003,when,end,env,.44);
  }else{
    osc(ctx,'sawtooth',hz,when,end,env,.58);osc(ctx,'square',hz*2,when,end,env,.12);
  }
}
function soundClick(ctx,when,accent,dest){
  const env=envelope(ctx,dest,when,accent?.34:.22,.001,.028);
  osc(ctx,'triangle',accent?1760:1320,when,when+.045,env,.9);
}
function buildGraph(ctx,project){
  const master=ctx.createGain();master.gain.value=project.masterVolume;
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=3;comp.attack.value=.006;comp.release.value=.18;
  master.connect(comp);
  const analyzer=ctx.createAnalyser();analyzer.fftSize=512;comp.connect(analyzer);analyzer.connect(ctx.destination);
  const solo=project.tracks.some(t=>t.solo);
  const tracks=new Map();
  for(const t of project.tracks){
    const input=ctx.createGain(),filter=ctx.createBiquadFilter(),pan=ctx.createStereoPanner(),volume=ctx.createGain();
    filter.type='lowpass';filter.frequency.value=t.cutoff;pan.pan.value=t.pan;
    volume.gain.value=(t.mute||(solo&&!t.solo))?0:t.volume;
    input.connect(filter);filter.connect(pan);pan.connect(volume);volume.connect(master);
    if(t.delay>0){
      const delay=ctx.createDelay(1),feedback=ctx.createGain(),wet=ctx.createGain();
      delay.delayTime.value=.24;feedback.gain.value=.25;wet.gain.value=t.delay*.45;
      filter.connect(delay);delay.connect(feedback).connect(delay);delay.connect(wet).connect(pan);
    }
    tracks.set(t.id,input);
  }
  return {master,analyzer,tracks};
}
export class AudioEngine {
  constructor(onStep,onStop,onMeter){this.ctx=null;this.playing=false;this.timer=null;this.onStep=onStep;this.onStop=onStop;this.onMeter=onMeter;this.samples=new Map();this.graph=null;this.step=0;this.nextTime=0;this.project=null;this.loop=true;this.metronome=false;this.raf=0;}
  async ensure(){
    if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();}
    if(this.ctx.state==='suspended')await this.ctx.resume();
    return this.ctx;
  }
  async loadSamples(project){
    const ctx=await this.ensure();
    for(const t of project.tracks){
      if(!t.sampleBase64){this.samples.delete(t.id);continue;}
      if(this.samples.get(t.id)?.source===t.sampleBase64)continue;
      try{
        this.samples.delete(t.id);
        const res=await fetch(t.sampleBase64);const array=await res.arrayBuffer();
        const buffer=await ctx.decodeAudioData(array);this.samples.set(t.id,{source:t.sampleBase64,buffer});
      }catch(e){console.warn('Cannot decode sample',t.name,e);}
    }
  }
  stepDuration(project){return 60/project.bpm/4;}
  scheduleStep(ctx,graph,project,absStep,when){
    const step=absStep%16,bar=Math.floor(absStep/16),unit=this.stepDuration(project);
    for(const t of project.tracks){
      if(!t.clips.includes(bar))continue;
      const output=graph.tracks.get(t.id);if(!output)continue;
      if(t.type==='drum' && t.steps[step])soundDrum(ctx,t.instrument,when,output,this.samples.get(t.id)?.buffer);
      if(t.type==='synth')for(const n of t.notes){if(n.start===step)soundSynth(ctx,t.instrument,n.pitch,when,Math.min(n.length,16-step)*unit,output,n.velocity);}
    }
    if(this.metronome && step%4===0)soundClick(ctx,when,step===0,graph.master);
  }
  async play(project,loop=true,metronome=false){
    if(this.playing){this.stop();return;}
    const ctx=await this.ensure();await this.loadSamples(project);
    this.project=JSON.parse(JSON.stringify(project));this.loop=loop;this.metronome=!!metronome;this.playing=true;this.step=0;this._finishScheduled=false;
    this.graph=buildGraph(ctx,this.project);this.nextTime=ctx.currentTime+.06;
    this.timer=setInterval(()=>this.tick(),22);this.tick();this.paintMeter();
  }
  tick(){
    if(!this.playing)return;
    const total=this.project.bars*16,ctx=this.ctx;
    while(this.nextTime<ctx.currentTime+.15){
      if(!this.loop&&this.step>=total){
        if(!this._finishScheduled){this._finishScheduled=true;this._finishTimer=setTimeout(()=>this.stop(),Math.max(0,(this.nextTime-ctx.currentTime)*1000)+800);}
        return;
      }
      const at=this.step%total;
      this.scheduleStep(ctx,this.graph,this.project,at,this.nextTime);
      const stepToDraw=at;
      const delay=Math.max(0,(this.nextTime-ctx.currentTime)*1000);
      setTimeout(()=>{if(this.playing)this.onStep?.(stepToDraw);},delay);
      this.nextTime+=this.stepDuration(this.project);this.step++;
    }
  }
  paintMeter(){
    if(!this.playing)return;
    const a=new Uint8Array(this.graph.analyzer.frequencyBinCount);this.graph.analyzer.getByteFrequencyData(a);
    let level=0;for(let i=0;i<a.length;i++)level+=a[i];level=level/a.length/255;
    this.onMeter?.(clamp(level*2.7,0,1));this.raf=requestAnimationFrame(()=>this.paintMeter());
  }
  stop(){
    if(this.timer)clearInterval(this.timer);this.timer=null;if(this._finishTimer)clearTimeout(this._finishTimer);this._finishTimer=null;this.playing=false;
    if(this.raf)cancelAnimationFrame(this.raf);
    // Reconstructing the graph avoids cutting effects in the main shared AudioContext.
    if(this.graph){try{this.graph.master.disconnect();}catch{}}
    this.graph=null;this.onStep?.(-1);this.onMeter?.(0);this.onStop?.();
  }
  async preview(track,pitch=60){const ctx=await this.ensure();
    const g=ctx.createGain();g.gain.value=Math.max(.04,track.volume*.65);g.connect(ctx.destination);
    const at=ctx.currentTime+.01;
    if(track.type==='drum')soundDrum(ctx,track.instrument,at,g,this.samples.get(track.id)?.buffer);
    else soundSynth(ctx,track.instrument,pitch,at,.24,g,100);
    setTimeout(()=>{try{g.disconnect();}catch{}},1200);
  }
  async renderWav(project,onProgress){
    await this.loadSamples(project);onProgress?.('Preparando la mezcla…');
    const seconds=project.bars*16*this.stepDuration(project)+1.5;
    const sampleRate=44100;
    const off=new OfflineAudioContext(2,Math.ceil(seconds*sampleRate),sampleRate);
    const graph=buildGraph(off,project);
    const previousMetronome=this.metronome;this.metronome=false;
    try{
      for(let s=0;s<project.bars*16;s++)this.scheduleStep(off,graph,project,s,s*this.stepDuration(project));
    }finally{this.metronome=previousMetronome;}
    onProgress?.('Procesando audio sin conexión…');
    const rendered=await off.startRendering();
    onProgress?.('Preparando archivo WAV…');
    return wavBlob(rendered.getChannelData(0),rendered.getChannelData(1),sampleRate);
  }
}
export function wavBlob(left,right,sampleRate=44100){
  const frames=Math.min(left.length,right.length),channels=2,bytes=44+frames*channels*2;
  const array=new ArrayBuffer(bytes),view=new DataView(array);let p=0;
  const writeText=x=>{for(let i=0;i<x.length;i++)view.setUint8(p++,x.charCodeAt(i));};
  const write16=x=>{view.setUint16(p,x,true);p+=2;};
  const write32=x=>{view.setUint32(p,x,true);p+=4;};
  writeText('RIFF');write32(bytes-8);writeText('WAVE');writeText('fmt ');write32(16);write16(1);write16(channels);write32(sampleRate);write32(sampleRate*channels*2);write16(channels*2);write16(16);writeText('data');write32(frames*channels*2);
  for(let i=0;i<frames;i++)for(const ch of [left,right]){const v=clamp(Number(ch[i])||0,-1,1);view.setInt16(p,v<0?v*32768:v*32767,true);p+=2;}
  return new Blob([array],{type:'audio/wav'});
}
export function midiBlob(project){
  const ppq=480,barTicks=ppq*4,tracks=[];
  const vlq=v=>{let b=[v&127];while((v>>=7))b.unshift((v&127)|128);return b;};
  const chunk=(id,data)=>[...id].map(c=>c.charCodeAt(0)).concat([(data.length>>>24)&255,(data.length>>>16)&255,(data.length>>>8)&255,data.length&255],data);
  const emit=(events)=>{
    events.sort((a,b)=>a.t-b.t||a.order-b.order);
    let out=[],last=0;
    for(const e of events){out.push(...vlq(e.t-last),...e.msg);last=e.t;}
    out.push(0,255,47,0);return chunk('MTrk',out);
  };
  const micros=Math.round(60000000/project.bpm);
  tracks.push(emit([{t:0,order:0,msg:[255,81,3,(micros>>16)&255,(micros>>8)&255,micros&255]}]));
  const drumNotes={kick:36,snare:38,hat:42,clap:39,perc:41,sampler:40};
  let melodicChannel=0;
  const nextMelodicChannel=()=>{
    if(melodicChannel===9)melodicChannel=10;
    const channel=melodicChannel;
    melodicChannel=(melodicChannel+1)%16;
    return channel;
  };
  project.tracks.forEach(tr=>{
    const channel=tr.type==='drum'?9:nextMelodicChannel();
    let events=[];
    tr.clips.forEach(bar=>{
      const base=bar*barTicks;
      if(tr.type==='drum')tr.steps.forEach((enabled,s)=>{if(enabled){const t=base+s*ppq/4;events.push({t,order:1,msg:[0x90|channel,drumNotes[tr.instrument]||36,96]},{t:t+ppq/16,order:0,msg:[0x80|channel,drumNotes[tr.instrument]||36,0]});}});
      else tr.notes.forEach(n=>{const t=base+n.start*ppq/4;const len=Math.min(n.length,16-n.start)*ppq/4;
        events.push({t,order:1,msg:[0x90|channel,n.pitch,n.velocity]},{t:t+len,order:0,msg:[0x80|channel,n.pitch,0]});});
    });
    tracks.push(emit(events));
  });
  const bytes=[...chunk('MThd',[0,1,0,tracks.length,ppq>>8,ppq&255]),...tracks.flat()];
  return new Blob([new Uint8Array(bytes)],{type:'audio/midi'});
}
