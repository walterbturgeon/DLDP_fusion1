# DRAGLOG + TRLG — page unique

Une seule page web pilote deux métiers sur un même appareil embarqué :

- **DRAGLOGICS** — courses en ligne droite, jalons de performance.
- **TRLG** — tours de piste, chronométrés au passage devant un relais.

La page est une PWA. Elle parle en Bluetooth Web, sans serveur.

---

## L'interrupteur de métier

**Le maître est dans le module de la voiture, pas dans la page.**

La page lit la clé `app` du JSON de configuration et s'y range. Elle peut
*demander* un changement ; c'est le module qui l'applique, l'écrit en NVS,
puis redémarre.

⚠ **Un module rallumé seul au champ garde son métier.** Le premier téléphone
qui se connecte s'y range. L'inverse — une page qui impose son mode —
laisserait deux téléphones se disputer un même appareil.

⚠ **La carte du métier reste visible dans les deux modes.** Si elle
disparaissait en TRLG, il n'y aurait plus de marche arrière : le maître est
dans la voiture, et le relais n'a pas ce pouvoir.

---

## Deux connexions, pas une

| Appareil | Service BLE | Ce qu'il porte |
|---|---|---|
| Module voiture | `7a1e0000-9f2b-4b8e-8f21-3d6c9a1e0000` | le métier, les réglages, les courses |
| Relais TRLG | `b3d5a900-1a2b-4c3d-9e0f-56789abcdef0` | les tours et leurs traces |

⚠ **Le code du relais est entièrement préfixé `rl`.** La page DRAGLOG avait
déjà `bleDevice`, `laps` et `onNotify`. Réutiliser ces noms aurait fait que
la connexion au relais écrase celle de la voiture — et la marche arrière
vers DRAGLOGICS disparaîtrait au premier tour reçu.

⚠ **Le relais coupe son BLE entre les tours, volontairement.** Un seul ESP32
ne tient pas du BLE continu et une bonne réception radio en même temps ; le
relais choisit la radio et rallume le BLE juste après chaque tour. La page se
reconnecte seule. **Une déconnexion n'est pas une panne ici** — la traiter
comme telle afficherait une erreur vingt fois par séance.

---

## Découverte des capacités

La page découvre ce que le module sait faire par les **clés de son JSON**,
jamais par son numéro de version.

```js
{ grp: 'grp_app', cle: 'app', nom: 'interrupteur DRAGLOGICS / TRLG', materiel: true }
```

⚠ **`materiel: true` compte.** Un DRAGLOG ordinaire n'est pas un module
fusionné diminué, c'est un autre produit. Le nommer dans la bannière
« firmware plus ancien » mettrait une alerte permanente sur tous les modules
du parc, pour une fonction qu'ils n'auront jamais. Une alerte permanente
cesse d'être lue.

---

## Le cache hors ligne

```js
const PREFIX = 'draglog-trlg-';
```

⚠ **Ce préfixe doit rester unique.** Les pages de projet GitHub partagent une
origine : `caches.keys()` liste les caches de toute l'origine, pas ceux du
dossier. Deux PWA au même préfixe s'effacent le cache l'une l'autre à chaque
activation, et le mode hors ligne devient imprévisible — précisément ce qui
sert en piste quand le réseau est mauvais.

---

## Ce que la page dit et ne dit pas

**Elle nomme la source du chronométrage** à côté de chaque temps :

- `ligne GPS (précis)` — la voiture a franchi la ligne virtuelle.
- `radio, pic du signal` — chronométré au maximum du beacon.
- `radio, premier signal` — repli, le moins précis.

⚠ Un tour chronométré au radio ne vaut pas un tour chronométré à la ligne
GPS. Les afficher sans distinction ferait comparer deux mesures différentes.

**Elle dit quand un tracé est incomplet.** Un tracé auquel il manque des
morceaux ressemble au tracé complet d'un tour plus court.

**Elle dit quand la distance est saturée.** Le champ est sur 16 bits :
65 535 veut dire « au-delà de 65 km », donc en pratique que l'origine GPS
n'était pas valide. L'afficher comme une mesure ferait chercher une erreur
de trajet inexistante.

---

## Navigateurs

Le Bluetooth Web est nécessaire.

- **Android** — Chrome.
- **iPhone** — l'application **Bluefy**, un navigateur tiers de l'App Store.
  Safari ne fait pas le Bluetooth Web.
