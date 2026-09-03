"""Genere le QR code de l'ADRESSE de la PWA DRAGLOG.

⚠⚠ CE SCRIPT NE TOUCHE A AUCUN IDENTIFIANT.
Il encode une simple adresse web, publique, sans jeton ni secret. C'est
volontaire et c'est la difference avec `gen_qr_jeton.py`, qui lui encode
un jeton GitHub d'ecriture -- un identifiant a part entiere, a ne jamais
imprimer ni laisser trainer.

Si un jour tu modifies ce script, la regle est simple :
    rien apres le '#' dans l'URL, jamais.
Le fragment sert justement a transporter un jeton dans l'autre script.
"""

import sys
from pathlib import Path

import segno

# Adresse servie par GitHub Pages pour le depot walterbturgeon/DLdisplay.
# ⚠ Elle ne repond QUE si GitHub Pages est active sur le depot :
#    Settings > Pages > Source = branche `main`, dossier `/ (root)`.
ADRESSE = "https://walterbturgeon.github.io/DLdisplay/"

SORTIE = Path(__file__).with_name("qr_page_dldisplay.png")


def main() -> int:
    if "#" in ADRESSE:
        print("REFUS : l'adresse contient un fragment '#'.")
        print("        Ce script n'encode que des adresses publiques.")
        return 1

    qr = segno.make(ADRESSE, error="h")   # correction d'erreur haute :
                                          # lisible meme un peu abime
    qr.save(str(SORTIE), scale=10, border=4, dark="black", light="white")

    print(f"adresse encodee : {ADRESSE}")
    print(f"fichier ecrit   : {SORTIE}")
    print(f"version du QR   : {qr.version}, correction d'erreur : {qr.error}")
    print()
    print("Aucun identifiant n'est encode dans ce QR. Il peut etre imprime,")
    print("photographie ou partage sans risque.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
