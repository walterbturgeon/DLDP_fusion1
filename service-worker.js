// ⚠ LES DEUX PWA PARTAGENT UNE ORIGINE (16 aout 2026).
// walterbturgeon.github.io/BPS_GPS/ (production) et .../BPS_GPS_DEV/ (cette
// version de travail) sont des pages de PROJET : meme schema, meme hote,
// meme port = MEME ORIGINE. Or `caches.keys()` liste les caches de toute
// l'origine, pas ceux du dossier.
//
// L'ancien nettoyage supprimait TOUT cache dont le nom differait du sien.
// Resultat : chaque PWA effacait le cache de l'autre a chaque activation,
// et le mode hors ligne devenait imprevisible -- precisement ce qui sert en
// piste quand le reseau est mauvais.
//
// Correction : un PREFIXE par PWA, et on ne nettoie que ses propres versions.
// ⚠ La PWA de production (DRAGLOG_v7/webapp, cache `draglog-v96`) porte
// ENCORE l'ancien filtre : tant qu'elle n'aura pas la meme correction, elle
// continuera d'effacer ce cache-ci. Les deux doivent etre corrigees.
// ⚠ PREFIXE PROPRE A CETTE PWA. La page DRAGLOG de developpement utilise
// `draglog-dev-` et celle de production `draglog-`. Garder l'un des deux ici
// ferait que cette page-ci EFFACE le cache de l'autre a chaque activation,
// et l'autre le sien -- le defaut decrit juste au-dessus, reintroduit par
// une simple copie de fichier.
const PREFIX = 'draglog-trlg-';
// ⚠ CE NUMERO DOIT MONTER A CHAQUE PUBLICATION. C'est lui qui distingue
// l'ancien cache du neuf : sans changement, le navigateur garde l'ancien
// et la page d'hier continue de s'afficher.
const CACHE = PREFIX + 'v27';  // v27 : journal de diagnostic, surbrillance de la ligne tenue
// ⚠ CETTE LISTE DOIT CORRESPONDRE AUX FICHIERS REELS. `cache.addAll()` est
// tout-ou-rien : un seul nom absent fait echouer l'installation ENTIERE du
// service worker. Et sans service worker installe, Chrome n'offre jamais
// d'installer la page comme application sur Android.
//
// Les deux icones s'appelaient `.webp` alors que ce sont des PNG (verifie le
// 3 septembre 2026 : les octets commencent par 89 50 4E 47). Renommees, et
// le manifeste declare maintenant le bon type.
const ASSETS = ['./', './index.html', './index_classique.html', './manifest.json', './logo.svg', './logo-draglogics.svg', './logo-tracklogics.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Reseau d'abord, cache en secours (hors-ligne seulement) : les mises a jour
// publiees sur GitHub Pages sont visibles au prochain chargement, sans purge
// manuelle du cache. L'ancienne strategie cache-d'abord servait l'index.html
// perime indefiniment sur Android (Chrome), pendant que Bluefy/iOS, qui ne
// persiste pas le service worker pareil, rechargeait la page fraiche.
self.addEventListener('fetch', (ev) => {
  ev.respondWith(
    fetch(ev.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(ev.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(ev.request))
  );
});
