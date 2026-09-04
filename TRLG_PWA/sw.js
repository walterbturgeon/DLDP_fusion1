// ⚠ CHANGER CE NOM A CHAQUE DEPLOIEMENT.
//
// C'est le seul declencheur de purge : l'evenement "activate" ne supprime que
// les caches dont le nom DIFFERE de celui-ci. Tant que le nom reste le meme,
// l'ancienne page survit sur le telephone, quoi qu'on pousse sur GitHub.
// ⚠⚠ UN PREFIXE PAR PWA, ET ON NE NETTOIE QUE SES PROPRES VERSIONS.
//
// Toutes les pages de projet d'un meme compte GitHub partagent UNE SEULE
// ORIGINE : walterbturgeon.github.io. Or `caches.keys()` liste les caches
// de l'ORIGINE, pas ceux du dossier.
//
// L'ancien nettoyage supprimait TOUT cache dont le nom differait du sien.
// Poser cette page a cote d'une autre l'aurait donc fait EFFACER le cache
// de l'autre a chaque activation -- et le mode hors ligne serait devenu
// imprevisible, precisement ce qui sert en piste quand le reseau est
// mauvais. Le defaut etait deja documente dans le service worker de la
// page fusion, date du 16 aout 2026.
//
// ⚠ CHANGER LE NUMERO A CHAQUE DEPLOIEMENT. C'est le seul declencheur de
// purge : tant que le nom ne change pas, l'ancienne page survit sur le
// telephone, quoi qu'on pousse sur GitHub.
const PREFIX = "trlg-pwa-";
const CACHE_NAME = PREFIX + "v4-adaptatif";
const ASSETS = ["./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      // ⚠ LE `startsWith` EST LA CORRECTION. Sans lui, cette ligne efface
      // les caches de TOUTES les autres pages de la meme origine.
      Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE_NAME)
                      .map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// RESEAU D'ABORD POUR LA PAGE, cache en secours.
//
// L'ancienne version faisait l'inverse : cache d'abord, reseau seulement si
// rien en cache. Une page servie depuis le cache ne se met JAMAIS a jour - le
// telephone affichait encore la version d'avant apres chaque deploiement, et
// rien ne le disait.
//
// Ici, la page vient du reseau quand il y en a, et du cache sinon. C'est ce
// que demande l'usage : le PWA sert en piste, parfois sans reseau, mais il
// doit se mettre a jour des qu'il en retrouve.
self.addEventListener("fetch", (event) => {
  const estPage = event.request.mode === "navigate" ||
                  event.request.destination === "document" ||
                  event.request.url.endsWith("index.html");

  if (estPage) {
    event.respondWith(
      fetch(event.request)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copie));
          return reponse;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
