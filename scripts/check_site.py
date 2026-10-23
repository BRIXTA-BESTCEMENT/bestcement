#!/usr/bin/env python3
"""Basic CI validation using only Python's standard library."""
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if data.get("id"):
            self.ids.add(data["id"])
        if tag == "a" and "href" in data:
            self.links.append(data["href"])

page = SITE / "index.html"
assert page.exists(), "site/index.html is required"
parser = PageParser()
parser.feed(page.read_text(encoding="utf-8"))
assert len(parser.ids) >= 3, "Expected semantic page sections"
for href in parser.links:
    if href.startswith("#") and href != "#":
        assert href[1:] in parser.ids, f"Broken anchor: {href}"
for file in ("styles.css", "reader.js", "best-cement-logo.png", "documents/nclt-order-cp-ib-40-gb-2026.pdf"):
    assert (SITE / file).is_file(), f"Missing asset: {file}"
import re
for slug in re.findall(r'slug: "([a-z0-9-]+)"', (SITE / "reader.js").read_text()):
    for suffix in (".pdf", "-page.webp", "-thumb.webp", "-notice.webp", "-clip.webp"):
        assert (SITE / "newspapers" / (slug + suffix)).is_file(), f"Missing newspaper file: {slug}{suffix}"
for file in ():
    assert (SITE / file).is_file(), f"Missing asset: {file}"
print("Site validation passed.")
