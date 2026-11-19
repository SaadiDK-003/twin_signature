"""Reassign existing demo variant photos using the observed reference swatches.

Uses native Shopify CDN URLs captured from the rendered product galleries.
Only handle/title/options/image columns are included; pricing and stock stay intact.
"""
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
import csv,json
root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'demo/catalog.json').read_text())
reference=json.loads((root/'demo/variant-media.json').read_text())
native=json.loads((root/'demo/native-media-audit.json').read_text())
def filename(url):return urlsplit(url).path.rsplit('/',1)[-1]
def full_url(url):
 if url.startswith('//'):url='https:'+url
 elif url.startswith('/'):url='https://twin-signature-4u8gmwse.myshopify.com'+url
 u=urlsplit(url);return urlunsplit(('https',u.netloc,u.path,'',''))
lookup={}
for item in catalog:
 images=native[item['handle']]['images']
 assert len(images)>=len(item['images'])
 for original,stored in zip(item['images'],images):lookup[original.removeprefix('ref-')]=full_url(stored['url'])
rows=[]
for item in catalog:
 handle=item['handle']; local_lookup={original.removeprefix('ref-'):full_url(stored['url']) for original,stored in zip(item['images'],native[handle]['images'])}; mapping={v['value']:local_lookup.get(filename(v['image']),lookup[filename(v['image'])]) for v in reference[handle] if v.get('image')}
 if not mapping:continue
 product_rows=[]
 for i,variant in enumerate(native[handle]['variants']):
  opts=variant['options']; assert opts[0] in mapping
  product_rows.append({'Handle':handle,'Title':item['title'] if i==0 else '', 'Option1 Name':'Color','Option1 Value':opts[0], 'Option2 Name':'Weight' if len(opts)>1 else '', 'Option2 Value':opts[1] if len(opts)>1 else '', 'Variant Image':mapping[opts[0]], 'Variant Price':f"{variant['price']/100:.2f}"})
 gallery=list(dict.fromkeys([full_url(v['url']) for v in native[handle]['images']]+list(mapping.values())))
 for i,image in enumerate(gallery):
  if i>=len(product_rows): product_rows.append({'Handle':handle})
  product_rows[i].update({'Image Src':image,'Image Position':i+1})
 rows.extend(product_rows)
 # Keep the repeatable full catalog import faithful too.
 item['variant_images']={v['value']:'ref-'+filename(v['image']) for v in reference[handle] if v.get('image')}
with (root/'demo/variant-images-update.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=['Handle','Title','Option1 Name','Option1 Value','Option2 Name','Option2 Value','Variant Image','Variant Price','Image Src','Image Position']);w.writeheader();w.writerows(rows)
(root/'demo/catalog.json').write_text(json.dumps(catalog,indent=2)+'\n')
print('Prepared',sum(bool(r.get('Variant Image')) for r in rows),'image assignments across',len(set(r['Handle'] for r in rows)),'products.')
