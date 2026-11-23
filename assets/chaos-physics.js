// CHAOS / Double pendulum. All angles measured from the downward vertical.
// Positions are in metres, time in seconds, masses in kilograms.
// The standard coupled equations follow from the Lagrangian for two point masses
// on massless rigid rods in uniform gravity. RK4 uses a fixed time step.
export const RAD = Math.PI / 180;
export const DEFAULTS = Object.freeze({
  m1:1.2, m2:1.0, L1:2.1, L2:1.9, g:9.81, damping:0,
  theta1:124, theta2:-28, delta:0.20, timeScale:1,
  trailSeconds:13, trailLight:1.0, compare:true, trails:true,
  grid:true, phase:true, paused:false
});
export function acceleration(y,p){
  const [a,b,u,v]=y;
  const {m1,m2,L1,L2,g,damping=0}=p;
  const d=a-b, s=Math.sin(d), c=Math.cos(d);
  const denominator=2*m1+m2-m2*Math.cos(2*d);
  const du=(-g*(2*m1+m2)*Math.sin(a)-m2*g*Math.sin(a-2*b)
    -2*m2*s*(v*v*L2+u*u*L1*c))/(L1*denominator) - damping*u;
  const dv=(2*s*(u*u*L1*(m1+m2)+g*(m1+m2)*Math.cos(a)
    +v*v*L2*m2*c))/(L2*denominator) - damping*v;
  return [u,v,du,dv];
}
export function rk4(y,p,dt){
  const k1=acceleration(y,p);
  const k2=acceleration(y.map((v,i)=>v+k1[i]*dt/2),p);
  const k3=acceleration(y.map((v,i)=>v+k2[i]*dt/2),p);
  const k4=acceleration(y.map((v,i)=>v+k3[i]*dt),p);
  return y.map((v,i)=>v+dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
}
export function positions(y,p){
  const [a,b]=y;
  const x1=p.L1*Math.sin(a), yy1=-p.L1*Math.cos(a);
  return [[x1,yy1],[x1+p.L2*Math.sin(b), yy1-p.L2*Math.cos(b)]];
}
export function energy(y,p){
  const [a,b,u,v]=y;
  const kinetic=.5*(p.m1+p.m2)*p.L1**2*u*u + .5*p.m2*p.L2**2*v*v
    +p.m2*p.L1*p.L2*u*v*Math.cos(a-b);
  // Zero potential is both arms hanging vertically down.
  const potential=(p.m1+p.m2)*p.g*p.L1*(1-Math.cos(a))
    +p.m2*p.g*p.L2*(1-Math.cos(b));
  return {kinetic,potential,total:kinetic+potential};
}
export function begin(p){
  return {main:[p.theta1*RAD,p.theta2*RAD,0,0],
    twin:[(p.theta1+p.delta)*RAD,p.theta2*RAD,0,0]};
}
export function separation(yA,yB,p){
  const a=positions(yA,p)[1],b=positions(yB,p)[1];
  return Math.hypot(a[0]-b[0],a[1]-b[1]);
}
export function deg(angle){return ((angle/RAD+180)%360+360)%360-180;}
