#!/usr/bin/env python3
"""
Genera imagenes placeholder abstractas (texturas calidas) en WebP.
Uso dev-time. No se sube al hosting: puedes borrar la carpeta tools/.
Cuando el cliente entregue sus fotos reales, ponlas en assets/photos/source/
y conviertelas con scripts/webp_convert.py de la skill.
"""
import math
import random
from PIL import Image, ImageDraw, ImageFilter

OUT = "assets/img"

PALETAS = {
    "terracota": [(184, 92, 58), (204, 124, 84), (146, 66, 42)],
    "musgo":     [(74, 93, 58), (104, 122, 82), (56, 72, 44)],
    "arena":     [(232, 223, 208), (214, 198, 176), (196, 176, 150)],
    "vino":      [(122, 46, 52), (156, 76, 74), (92, 34, 40)],
    "oliva":     [(138, 132, 84), (166, 158, 108), (110, 104, 64)],
    "canela":    [(166, 112, 62), (196, 146, 92), (132, 84, 44)],
    "humo":      [(90, 84, 78), (124, 116, 106), (66, 62, 58)],
}

CREMA = (244, 239, 230)


def lienzo(w, h, base):
    img = Image.new("RGB", (w, h), base)
    return img


def manchas(img, colores, n, radio_rel, semilla):
    rnd = random.Random(semilla)
    w, h = img.size
    capa = Image.new("RGB", (w, h), colores[0])
    d = ImageDraw.Draw(capa)
    for i in range(n):
        c = colores[rnd.randrange(len(colores))]
        cx = rnd.uniform(-0.1, 1.1) * w
        cy = rnd.uniform(-0.1, 1.1) * h
        r = rnd.uniform(radio_rel * 0.5, radio_rel * 1.5) * min(w, h)
        d.ellipse([cx - r, cy - r * rnd.uniform(0.7, 1.3), cx + r, cy + r], fill=c)
    capa = capa.filter(ImageFilter.GaussianBlur(radius=min(w, h) * 0.10))
    return Image.blend(img, capa, 0.9)


def grano(img, fuerza, semilla):
    rnd = random.Random(semilla + 999)
    w, h = img.size
    ruido = Image.new("L", (w // 2, h // 2))
    ruido.putdata([rnd.randrange(256) for _ in range((w // 2) * (h // 2))])
    ruido = ruido.resize((w, h), Image.BILINEAR)
    ruido_rgb = Image.merge("RGB", (ruido, ruido, ruido))
    return Image.blend(img, ruido_rgb, fuerza)


def vineta(img, fuerza=0.35):
    w, h = img.size
    mascara = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mascara)
    m = int(min(w, h) * 0.05)
    d.ellipse([-w * 0.15, -h * 0.15, w * 1.15, h * 1.15], fill=255)
    mascara = mascara.filter(ImageFilter.GaussianBlur(radius=min(w, h) * 0.12))
    oscuro = Image.new("RGB", (w, h), (26, 22, 18))
    base = Image.composite(img, Image.blend(img, oscuro, fuerza), mascara)
    return base


def trazos(img, semilla, luminosa):
    """Arcos y lineas finas: convierten el degradado en una composicion."""
    rnd = random.Random(semilla + 4242)
    w, h = img.size
    capa = img.convert("RGBA")
    d = ImageDraw.Draw(capa, "RGBA")
    tinta = (26, 22, 18, 42) if luminosa else (244, 239, 230, 48)
    grosor = max(1, int(min(w, h) * 0.0035))

    cx = rnd.uniform(0.25, 0.75) * w
    cy = rnd.uniform(0.25, 0.75) * h
    for k in range(rnd.randrange(3, 6)):
        r = min(w, h) * (0.22 + k * 0.14)
        ini = rnd.randrange(0, 360)
        d.arc([cx - r, cy - r, cx + r, cy + r], ini, ini + rnd.randrange(90, 260),
              fill=tinta, width=grosor)

    for _ in range(rnd.randrange(2, 4)):
        y = rnd.uniform(0.15, 0.85) * h
        d.line([(0, y), (w, y + rnd.uniform(-0.06, 0.06) * h)], fill=tinta, width=grosor)

    return capa.convert("RGB")


def textura(nombre, w, h, paleta, semilla, luminosa=False, vin=0.3):
    colores = PALETAS[paleta]
    base = CREMA if luminosa else colores[2]
    img = lienzo(w, h, base)
    img = manchas(img, colores + ([CREMA] if luminosa else []), 9, 0.42, semilla)
    img = trazos(img, semilla, luminosa)
    img = grano(img, 0.055, semilla)
    if vin:
        img = vineta(img, vin)
    img = img.filter(ImageFilter.GaussianBlur(radius=0.4))
    ruta = f"{OUT}/{nombre}.webp"
    img.save(ruta, "WEBP", quality=82, method=6)
    print(f"  {ruta}  {w}x{h}")


def qr(nombre, texto, px=900):
    import qrcode
    q = qrcode.QRCode(box_size=20, border=2,
                      error_correction=qrcode.constants.ERROR_CORRECT_M)
    q.add_data(texto)
    q.make(fit=True)
    img = q.make_image(fill_color=(26, 26, 26), back_color=CREMA).convert("RGB")
    img = img.resize((px, px), Image.NEAREST)
    ruta = f"{OUT}/{nombre}.webp"
    img.save(ruta, "WEBP", quality=90, method=6)
    print(f"  {ruta}  {px}x{px}")


if __name__ == "__main__":
    print("Generando texturas placeholder...")
    textura("hero-comedor", 1920, 1080, "terracota", 11, vin=0.42)
    textura("sala-tarde", 1400, 933, "canela", 22, luminosa=True, vin=0.18)
    textura("mano-masa", 1000, 1250, "arena", 33, luminosa=True, vin=0.14)

    for i, (pal, s) in enumerate(
        [("vino", 41), ("oliva", 52), ("canela", 63),
         ("musgo", 74), ("terracota", 85), ("humo", 96)], start=1
    ):
        textura(f"plato-{i}", 1000, 1250, pal, s, vin=0.26)

    textura("og-portada", 1200, 630, "terracota", 107, vin=0.3)
    qr("qr-carta", "https://casaroble.example/carta.html")
    print("Listo.")
