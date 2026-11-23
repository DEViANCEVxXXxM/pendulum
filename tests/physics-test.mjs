import {DEFAULTS,rk4,energy,begin,positions,separation} from '../assets/chaos-physics.js';
const opts={...DEFAULTS};
let {main,twin}=begin(opts);
const init=energy(main,opts).total;
let worst=0;const dt=1/240;
for(let i=0;i<240*70;i++){
  main=rk4(main,opts,dt);twin=rk4(twin,opts,dt);
  const e=energy(main,opts).total;
  const drift=Math.abs((e-init)/init)*100;
  worst=Math.max(worst,drift);
  if(!isFinite(e)||!main.every(Number.isFinite)||!twin.every(Number.isFinite))throw new Error('Non-finite trajectory');
}
const sep=separation(main,twin,opts);
console.log({seconds:70,initialEnergy:init,finalEnergy:energy(main,opts).total,maxEnergyDriftPct:worst,separationMeters:sep});
if(worst>.1)throw new Error('Large energy drift');
const damp={...opts,damping:0.08};main=begin(damp).main;
const dampInitial=energy(main,damp).total;
for(let i=0;i<240*25;i++)main=rk4(main,damp,dt);
const dampEnd=energy(main,damp).total;
console.log({dampedInitial:dampInitial,dampedEnd:dampEnd});
if(dampEnd>dampInitial)throw new Error('Damped energy unexpectedly rose');
for(const [a,b] of positions(main,damp))if(!Number.isFinite(a)||!Number.isFinite(b))throw new Error('Invalid position');
