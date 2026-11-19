"""Prepare reference demo assets and a Shopify product import. Requires bs4 and requests.

Usage: python3 scripts/prepare-demo.py /tmp/twin-reference.html
The input is the public reference homepage, never Shopify admin HTML.
"""
import concurrent.futures
import csv
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'demo'
OUT.mkdir(exist_ok=True)
soup = BeautifulSoup(Path(sys.argv[1]).read_text(), 'html.parser')
manifest = {}

def register(url):
    if not url or not url.startswith(('//', 'https://')):
        return None
    url = 'https:' + url if url.startswith('//') else url
    path = urlsplit(url).path
    if '/cdn/shop/' not in path and '/cdn/fonts/' not in path:
        return None
    name = 'ref-' + path.rsplit('/', 1)[1]
    # Keep full-resolution sources; responsive sizes are rendered by the theme.
    name = re.sub(r'_\d+x(?=\.)', '', name)
    source = re.sub(r'_\d+x(?=\.)', '', url.split('?')[0])
    manifest[name] = source
    return name

for image in soup.select('main img'):
    register(image.get('src'))
for url in re.findall(r'url\("([^\"]+\.woff2)"\)', soup.select_one('style').text):
    if any(x in url for x in ('inter_n4.', 'inter_n7.', 'playfairdisplay_n7.')):
        register(url)

products = {}
for card in soup.select('.product-grid-item'):
    title = card.select_one('h3 a')
    if not title:
        continue
    handle = title.get('href').split('/products/')[-1].split('?')[0]
    if handle in products:
        continue
    regular = card.select_one('.price__regular .price-item')
    sale = card.select_one('.price-item--sale')
    compare = card.select_one('s.price-item')
    def amount(el):
        match = re.search(r'[\d,]+\.\d+', el.get_text() if el else '')
        return round(float(match[0].replace(',', '')) * 100, 2) if match else None
    images = list(dict.fromkeys(register(i.get('src')) for i in card.select('img') if i.get('src')))
    rating = card.select_one('.rating[aria-label]')
    products[handle] = {
        'handle': handle, 'title': title.get_text(' ', strip=True),
        'price': amount(sale or regular), 'compare_at_price': amount(compare),
        'images': [x for x in images if x],
        'available': 'Sold out' not in card.get_text(),
        'rating': float(re.search(r'[\d.]+', rating['aria-label'])[0]) if rating else 5.0,
    }

def download(item):
    name, url = item
    target = ROOT / 'assets' / name
    if target.exists():
        return name, 'cached'
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        target.write_bytes(response.content)
        return name, len(response.content)
    except requests.RequestException as error:
        return name, str(error)

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(download, manifest.items()))
print(json.dumps({'assets': len(manifest), 'products': len(products), 'downloads': results}))
(OUT / 'asset-sources.json').write_text(json.dumps(manifest, indent=2) + '\n')
(OUT / 'catalog.json').write_text(json.dumps(list(products.values()), indent=2) + '\n')
