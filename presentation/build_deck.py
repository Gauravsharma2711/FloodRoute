"""Build presentation/index.html from deck_template.html with the app screenshots embedded.

Screenshots come from web/scripts/capture-screens.mjs (real app output). Embedding makes the deck a
single file that opens offline on any laptop. Usage: python presentation/build_deck.py
"""
import base64
import io
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
SHOTS = HERE / "screens"

# placeholder -> (file, max width in px, jpeg quality, crop as fractions (x0, y0, x1, y1) or None)
IMAGES = {
    "{{IMG_DISPATCHER}}": ("dispatcher_bkc.png", 2160, 90, None),
    "{{IMG_MAP}}": ("dispatcher_bkc.png", 2000, 90, (0.25, 0.10, 0.99, 0.92)),  # zoom on the routes
    "{{IMG_CARD}}": ("decision_card.png", 960, 92, None),
    "{{IMG_DRIVER}}": ("driver_phone.png", 780, 90, None),
}


def data_uri(name: str, max_w: int, quality: int, crop=None) -> str:
    im = Image.open(SHOTS / name).convert("RGB")
    if crop:
        w, h = im.size
        im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=quality, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def main() -> None:
    html = (HERE / "deck_template.html").read_text(encoding="utf-8")
    for key, (name, max_w, q, crop) in IMAGES.items():
        html = html.replace(key, data_uri(name, max_w, q, crop))
    # drop the "this is the template" warning from the built deck
    start = html.find("<!-- TEMPLATE-WARNING")
    end = html.find("</script>", start) + len("</script>\n")
    if start != -1:
        html = html[:start] + html[end:]
    out = HERE / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
