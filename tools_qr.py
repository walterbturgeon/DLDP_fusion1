"""Genere les deux QR du projet DLDP_fusion1.

⚠⚠ CE SCRIPT NE TOUCHE A AUCUN IDENTIFIANT.
Il encode des adresses web publiques, sans jeton ni secret. C'est
volontaire, et c'est la difference avec `gen_qr_jeton.py` du projet
DRAGLOG, qui lui encode un jeton GitHub d'ecriture -- un identifiant a
part entiere, a ne jamais imprimer ni laisser trainer.

Si un jour tu modifies ce script, la regle est simple :
    rien apres le '#' dans l'URL, jamais.
Le fragment sert justement a transporter un jeton dans l'autre script.

DEUX QR, ET PAS UN SEUL :
  - celui de la PAGE sert a INSTALLER l'application sur un telephone ;
  - celui du DEPOT sert a lire le code et l'historique.
Les confondre ferait scanner le depot en piste, ou l'on veut l'appli.
"""

import sys
from pathlib import Path

import segno

# Adresse servie par GitHub Pages.
# ⚠ Elle ne repond QUE si GitHub Pages est active sur le depot :
#    Settings > Pages > Source = branche `main`, dossier `/ (root)`.
PAGE = "https://walterbturgeon.github.io/DLDP_fusion1/"

# Adresse du depot lui-meme. Toujours joignable, Pages active ou non.
DEPOT = "https://github.com/walterbturgeon/DLDP_fusion1"

CIBLES = [
    (PAGE,  "qr_page.png",  "la PAGE  -- a scanner pour installer l'appli"),
    (DEPOT, "qr_depot.png", "le DEPOT -- a scanner pour lire le code"),
]


def main() -> int:
    ici = Path(__file__).parent
    for adresse, nom, role in CIBLES:
        if "#" in adresse:
            print("REFUS : l'adresse contient un fragment '#'.")
            print("        Ce script n'encode que des adresses publiques.")
            return 1
        # ⚠ CORRECTION D'ERREUR MOYENNE, PAS HAUTE. La haute ajoute des
        # modules : le QR devient plus dense, donc chaque case plus petite a
        # taille d'image egale. Scanne A L'ECRAN, ou l'image est deja reduite
        # par le telephone, cette densite fait echouer la lecture -- constate
        # le 3 septembre 2026. La haute ne se justifie que pour un QR IMPRIME,
        # qui peut se salir ou se dechirer ; un QR affiche ne s'abime pas.
        #
        # Et une bordure plus large : la zone calme est ce que le lecteur
        # cherche en premier pour trouver le code. Trop mince, il ne le voit
        # pas du tout.
        qr = segno.make(adresse, error="m")
        sortie = ici / nom
        qr.save(str(sortie), scale=16, border=4)
        print("%-14s %s" % (nom, role))
        print("               %s" % adresse)
    return 0


if __name__ == "__main__":
    sys.exit(main())
