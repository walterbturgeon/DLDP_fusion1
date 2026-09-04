# ⚠ CETTE COPIE EST PUBLIÉE, ELLE N'EST PAS LA SOURCE

**La source vit ici :**

```
C:\Users\W Turgeon\Documents\Arduino\TRLG_PWA\
```

On **édite là-bas**, puis on recopie ici et on pousse. Éditer directement
cette copie ferait diverger les deux, et la prochaine recopie effacerait le
travail sans un mot.

## Pourquoi il y a deux copies

Le dossier `Documents\Arduino` est un dépôt git **sans aucun remote** : il ne
vit que sur un disque. Cette copie-ci sert à **publier la page** sur GitHub
Pages, sous `.../DLDP_fusion1/TRLG_PWA/`.

## Ce qui a été corrigé au passage, le 4 septembre 2026

`sw.js` supprimait **tous** les caches de l'origine à chaque activation :

```js
keys.filter((k) => k !== CACHE_NAME)      // ancien -- efface tout
```

Or toutes les pages de projet d'un même compte GitHub partagent **une seule
origine** (`walterbturgeon.github.io`), et `caches.keys()` liste les caches de
l'origine, pas du dossier. Cette page aurait donc effacé le cache de la page
fusion à chaque ouverture — le mode hors ligne serait devenu imprévisible,
précisément ce qui sert en piste.

Corrigé par un **préfixe propre à cette page** :

```js
const PREFIX = "trlg-pwa-";
keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE_NAME)
```

⚠ Le même défaut est documenté depuis le 16 août 2026 dans le service worker
de la page fusion, qui nomme une **page de production encore non corrigée**.
Tant qu'elle ne l'est pas, elle continue d'effacer les caches des autres.

## Règle de déploiement

**Monter le numéro de `CACHE_NAME` à chaque publication.** C'est le seul
déclencheur de purge : sans changement, le téléphone garde l'ancienne page,
quoi qu'on pousse.
