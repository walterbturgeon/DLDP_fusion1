// Verifie que le PWA decode un paquet de trace exactement comme la voiture
// l'encode. Le test construit les octets selon la struct C, puis appelle le
// decodeur de la page - sans navigateur.
const fs = require('fs');
const h = fs.readFileSync('C:/Users/W Turgeon/Documents/Arduino/TRLG_PWA/index.html','utf8');
const src = h.match(/<script>([\s\S]*)<\/script>/)[1];

// DOM minimal : le decodeur touche a l'historique et au canvas.
const faux = () => ({ innerHTML:'', textContent:'', title:'', style:{}, className:'',
  clientWidth:600, width:0, height:0, dataset:{}, name:'', content:'',
  classList:{add(){},remove(){},toggle(){}},
  appendChild(){}, removeChild(){}, remove(){}, querySelectorAll(){return []},
  addEventListener(){}, setAttribute(){}, removeAttribute(){}, getAttribute(){return null},
  getContext(){ return new Proxy({}, {get:()=>()=>{}}) } });

// documentElement et head sont indispensables : la bascule de theme y pose
// data-theme et y remplace la balise theme-color.
global.document = { getElementById:()=>faux(), createElement:()=>faux(),
                    querySelectorAll:()=>[], addEventListener(){},
                    documentElement: faux(), head: faux(), body: faux() };
global.window = { addEventListener(){}, devicePixelRatio:1,
                  matchMedia:()=>({ matches:false, addEventListener(){} }) };
global.navigator = {};
const memoire = {};
global.localStorage = { getItem:(k)=>memoire[k]||null, setItem:(k,v)=>{memoire[k]=v;} };

const g = {};
require('vm').runInThisContext(src.replace(/^\s*"use strict";?/,''));

// --- fabrique un morceau de trace, octet par octet, comme le firmware ---
function morceau(lap, idx, count, points, intervalMs, lat, lon) {
  const buf = new ArrayBuffer(16 + 46*5);
  const v = new DataView(buf);
  v.setUint8(0, 0x04);
  v.setUint16(1, lap, true);
  v.setUint8(3, idx);
  v.setUint8(4, count);
  v.setUint8(5, points.length);
  v.setUint16(6, intervalMs, true);
  v.setInt32(8, Math.round(lat*1e7), true);
  v.setInt32(12, Math.round(lon*1e7), true);
  let o = 16;
  for (const p of points) {
    v.setInt16(o, p.dx, true); v.setInt16(o+2, p.dy, true); v.setUint8(o+4, p.kmh);
    o += 5;
  }
  return new Uint8Array(buf);
}

// Parcours en boucle : 138 points, vitesse variable
const tous = [];
for (let i = 0; i < 138; i++) {
  const a = 2*Math.PI*i/138;
  tous.push({ dx: Math.round(300*Math.cos(a)), dy: Math.round(180*Math.sin(a)),
              kmh: Math.round(80 + 60*Math.sin(2*a)) });
}

console.log('--- envoi des 3 morceaux, dans le desordre ---');
for (const idx of [1, 0, 2]) {
  const pts = tous.slice(idx*46, idx*46+46);
  dispatchPacket(morceau(7, idx, 3, pts, 430, 45.4067702, -72.7509981));
  const t = traces.get(7);
  console.log('  morceau %d recu -> %d points assembles', idx, traceComplete(t).length);
}

const t = traces.get(7);
const rec = traceComplete(t);
let ok = rec.length === 138;
console.log('\n--- controle ---');
console.log('points attendus : 138, recus : %d', rec.length);
console.log('intervalle : %d ms', t.intervalMs);
console.log('origine : %s, %s', t.originLat.toFixed(7), t.originLon.toFixed(7));

let ecarts = 0;
for (let i = 0; i < Math.min(rec.length, tous.length); i++) {
  if (rec[i].dx !== tous[i].dx || rec[i].dy !== tous[i].dy || rec[i].kmh !== tous[i].kmh) ecarts++;
}
console.log('points differents de l original : %d', ecarts);
if (ecarts) ok = false;
if (Math.abs(t.originLat - 45.4067702) > 1e-6) ok = false;

console.log('\n--- morceau manquant ---');
traces.delete(9);
dispatchPacket(morceau(9, 0, 3, tous.slice(0,46), 430, 45.4, -72.7));
dispatchPacket(morceau(9, 2, 3, tous.slice(92,138), 430, 45.4, -72.7));
const t9 = traces.get(9);
console.log('2 morceaux sur 3 -> %d points (la page dessine ce qu elle a)', traceComplete(t9).length);
if (traceComplete(t9).length !== 92) ok = false;

// --- theme : les trois etats, et la persistance ---
console.log("");
console.log("--- theme ---");
appliquerTheme('dark');
let themeOk = localStorage.getItem('trlg-theme') === 'dark';
appliquerTheme('light');
themeOk = themeOk && localStorage.getItem('trlg-theme') === 'light';
appliquerTheme('auto');
themeOk = themeOk && localStorage.getItem('trlg-theme') === 'auto';
console.log('bascule auto / clair / sombre et memorisation : %s', themeOk ? 'OK' : 'ECHEC');
if (!themeOk) ok = false;

// --- simulateur : il doit passer par le MEME chemin que les vrais paquets ---
console.log("");
console.log("--- simulateur ---");
const avant = laps.length;
simulerUnTour();
const apres = laps.length;
console.log('un tour simule -> %d tour(s) ajoute(s)', apres - avant);
const dernier = laps[laps.length - 1];
console.log('duree %d ms, source %d, rpm max %d',
            dernier.durationMs, dernier.timingSource, dernier.values[0].max);
if (apres !== avant + 1) ok = false;
if (!(dernier.durationMs > 40000 && dernier.durationMs < 70000)) ok = false;
if (dernier.values[0].max < 6000) ok = false;

effacerSimulation();
console.log('apres effacement : %d tour(s), %d trace(s)', laps.length, traces.size);
if (laps.length !== 0 || traces.size !== 0) ok = false;

console.log("");
console.log(ok ? 'REUSSITE - trace, theme et simulateur' : 'ECHEC');
process.exit(ok ? 0 : 1);
