import assert from 'node:assert/strict';
import {starterProject,applyActions,applyAction,validateProject,makeTrack,pitchLabel} from '../app/model.js';
import {midiBlob,wavBlob} from '../app/audio.js';
let p=starterProject('trap');
assert.equal(p.tracks.length,7);assert.equal(p.bpm,140);assert.equal(p.bars,8);
assert.deepEqual(p.tracks[0].steps.length,16);
assert.equal(pitchLabel(60),'C4');
assert.equal(pitchLabel(36),'C2');
assert.doesNotThrow(()=>validateProject(p));
assert.equal(p.schema,'clstudio.project');
const legacy=JSON.parse(JSON.stringify(p)); legacy.schema='alstudio.project';
assert.equal(validateProject(legacy).schema,'clstudio.project','legacy project is migrated');
assert.equal(legacy.schema,'alstudio.project','migration does not change source');
let id=p.tracks[0].id;
let next=applyActions(p,[{type:'set_tempo',bpm:124},{type:'set_step',track_id:id,step:2,enabled:true}]);
assert.equal(next.bpm,124);assert.equal(next.tracks[0].steps[2],true);
assert.equal(p.bpm,140);assert.equal(p.tracks[0].steps[2],false,'original must not mutate');
let before=JSON.stringify(p);
assert.throws(()=>applyActions(p,[{type:'set_tempo',bpm:124},{type:'run_shell',command:'rm -rf /'}]),/Acción no permitida/);
assert.equal(JSON.stringify(p),before,'failed batch must not alter original');
assert.throws(()=>applyAction(p,{type:'set_tempo',bpm:999}),/rango/);
assert.throws(()=>applyAction(p,{type:'add_track',instrument:'arbitrary'}),/Instrumento/);
assert.throws(()=>applyAction(p,{type:'set_track',track_id:id,field:'prototype',value:'x'}),/no permitido/);
assert.throws(()=>applyActions(p,[]),/Lote inválido/);
assert.throws(()=>applyActions(p,Array.from({length:65},()=>({type:'set_tempo',bpm:120}))),/Lote inválido/);
const created=applyActions(p,[{type:'add_track',instrument:'pad',id:'agent_pad_1',name:'New pad'},{type:'add_note',track_id:'agent_pad_1',pitch:64,start:0,length:4}]);
assert.equal(created.tracks.length,8);assert.equal(created.tracks.at(-1).notes[0].pitch,64);
assert.doesNotThrow(()=>validateProject(created));
assert.throws(()=>validateProject({...p,bars:500}),/Compases/);
assert.throws(()=>validateProject({...p,tracks:[p.tracks[0],p.tracks[0]]}),/Identificador/);
assert.equal((await midiBlob(p).arrayBuffer()).byteLength>100,true);
const header=new Uint8Array(await midiBlob(p).arrayBuffer());
assert.equal(String.fromCharCode(...header.slice(0,4)),'MThd');
assert.equal((header[10]<<8)+header[11],p.tracks.length+1);
// Every documented agent action must be accepted with the documented fields.
const full=applyActions(p,[
  {type:'set_title',title:'Full action coverage'},
  {type:'set_bars',bars:4},
  {type:'set_master',volume:.6},
  {type:'add_track',instrument:'sampler',id:'agent_sampler',name:'Sampler'},
  {type:'add_track',instrument:'pad',id:'agent_pad_2',name:'Pad'},
  {type:'rename_track',track_id:'agent_sampler',name:'Sampler renamed'},
  {type:'set_step',track_id:id,step:1,enabled:true},
  {type:'set_steps',track_id:id,steps:[0,2,4]},
  {type:'add_note',track_id:'agent_pad_2',pitch:60,start:2,length:3,velocity:88},
  {type:'remove_note',track_id:'agent_pad_2',pitch:60,start:2},
  {type:'set_track',track_id:'agent_sampler',field:'pan',value:-.5},
  {type:'set_track',track_id:'agent_sampler',field:'cutoff',value:8000},
  {type:'set_track',track_id:'agent_sampler',field:'delay',value:.3},
  {type:'set_track',track_id:'agent_sampler',field:'mute',value:true},
  {type:'set_track',track_id:'agent_sampler',field:'solo',value:false},
  {type:'set_clip',track_id:'agent_sampler',bar:2,enabled:true},
  {type:'clear_track',track_id:'agent_sampler'},
  {type:'delete_track',track_id:'agent_sampler'},
  {type:'delete_track',track_id:'agent_pad_2'}
]);
assert.equal(full.title,'Full action coverage');
assert.equal(full.bars,4);
assert.equal(full.masterVolume,.6);
assert.equal(full.tracks.some(t=>t.id==='agent_sampler'),false);
assert.equal(full.tracks.some(t=>t.id==='agent_pad_2'),false);
assert.doesNotThrow(()=>validateProject(full));

// WAV encoder: canonical 44-byte RIFF/WAVE header, stereo 16-bit PCM.
const wav=wavBlob(new Float32Array([0,.5,-.5]),new Float32Array([0,-.25,.25]),44100);
const wavBytes=new Uint8Array(await wav.arrayBuffer());
assert.equal(String.fromCharCode(...wavBytes.slice(0,4)),'RIFF');
assert.equal(String.fromCharCode(...wavBytes.slice(8,12)),'WAVE');
assert.equal(String.fromCharCode(...wavBytes.slice(12,16)),'fmt ');
assert.equal(String.fromCharCode(...wavBytes.slice(36,40)),'data');
const wavView=new DataView(wavBytes.buffer);
assert.equal(wavView.getUint16(20,true),1,'PCM');
assert.equal(wavView.getUint16(22,true),2,'stereo');
assert.equal(wavView.getUint32(24,true),44100);
assert.equal(wavView.getUint16(34,true),16,'16-bit');
assert.equal(wavView.getUint32(40,true),3*2*2,'data size');
assert.equal(wavBytes.length,44+12);

// MIDI: melodic tracks must never share the General MIDI drum channel (10 / index 9).
const midiBytes=new Uint8Array(await midiBlob(p).arrayBuffer());
const midiTracks=[];let cursor=14;
while(cursor<midiBytes.length){
  assert.equal(String.fromCharCode(...midiBytes.slice(cursor,cursor+4)),'MTrk');
  const size=(midiBytes[cursor+4]<<24)|(midiBytes[cursor+5]<<16)|(midiBytes[cursor+6]<<8)|midiBytes[cursor+7];
  midiTracks.push(midiBytes.slice(cursor+8,cursor+8+size));cursor+=8+size;
}
assert.equal(midiTracks.length,p.tracks.length+1);
function channelsInTrack(data){
  const channels=new Set();let i=0;
  while(i<data.length){
    while(data[i]&128)i++;
    i++;
    if(data[i]===0xFF){i+=2;let length=0;while(data[i]&128)length=(length<<7)|(data[i++]&127);length=(length<<7)|data[i++];i+=length;continue;}
    const status=data[i++];channels.add(status&0x0F);
    const kind=status&0xF0;i+=kind===0xC0||kind===0xD0?1:2;
  }
  return channels;
}
assert.deepEqual([...channelsInTrack(midiTracks[1])],[9],'drum track uses channel 10');
for(const track of midiTracks.slice(5))assert.equal(channelsInTrack(track).has(9),false,'melodic tracks avoid channel 10');

console.log('PASS: project schema, immutable transactions, atomic errors, all agent actions, WAV header, MIDI channels');
