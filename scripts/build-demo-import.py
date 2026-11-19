"""Build repeatable demo imports; prices are sample PKR amounts, not exchange rates."""
from pathlib import Path
import csv, itertools, json
p=Path(__file__).resolve().parents[1]
a=json.loads((p/'demo/catalog.json').read_text())
options={
'aersace-for-men':(['Green','Blue','Red','Black'],['100ML','200ML','300ML']),
'arome-le-parfum':(['Black','Red','Green','Blue'],['100ML','200ML','500ML']),
'arome-virtual-flower':(['Black'],['500ML','300ML','200ML','100ML']),
'black-wild-fragrance':(['red','green','blue','yellow'],['100g','200g','500g']),
'brown-devotion-man':(['Black','Green','Blue','Red'],['100g','200g','300g']),
'eau-de-toilette-for-men':(['Black','Red','Green','Blue'],['100ML','200ML','500ML']),
'essence-pour-home':(['Black','Blue','Green','Red'],['100ML','200ML','500ML']),
'klein-women-spray':(['Black','Blue','Red','Green'],[]),
'love-edition-for-her':(['red','green','blue','yellow'],['100ML','200ML','500ML']),
'men-caramel-dream':(['Black','Blue','Green','Red'],['100ML','200ML','500ML']),
'million-gold-for-her':(['green','red','black'],['100ML','200ML','500ML']),
'orchid-flora-geous':(['Black','Blue','Green','Red'],['100g','200g','500g']),
'profondo-parfum-her':(['green','red','black'],['100ML','200ML','500ML'])}
notes=['Jasmine','Bergamot','Lavender','Vanilla','Sandalwood','Leather']
women=['love-edition-for-her','klein-women-spray','orchid-flora-geous','profondo-parfum-her','men-caramel-dream','black-wild-fragrance','arome-virtual-flower']
men=['aersace-for-men','arome-le-parfum','brown-devotion-man','eau-de-toilette-for-men','essence-pour-home','men-caramel-dream','black-wild-fragrance','arome-virtual-flower','million-gold-for-her']
popular=['aersace-for-men','black-wild-fragrance','men-caramel-dream','klein-women-spray','arome-le-parfum','brown-devotion-man','essence-pour-home','arome-virtual-flower']
common=['ref-5_3d766c86-88c7-466f-9a42-8969ff6e4ad8.jpg','ref-1_08ff09db-b9b0-4781-8774-8c5872176160.jpg','ref-2_e3cd7c76-5530-4779-914d-aced9fc7bff6.jpg','ref-3_4a5e3cd4-c4da-4955-a739-3dcdebf6f303.jpg','ref-4_c34c39eb-5494-4ff8-966d-15b7e484c7ca.jpg','ref-6_97af0291-abf5-47ee-99ed-a00696fb134a.jpg','ref-7.jpg','ref-8.jpg']
headers=['Handle','Title','Body (HTML)','Vendor','Type','Tags','Published','Option1 Name','Option1 Value','Option2 Name','Option2 Value','Variant SKU','Variant Grams','Variant Inventory Tracker','Variant Inventory Qty','Variant Inventory Policy','Variant Fulfillment Service','Variant Price','Variant Compare At Price','Variant Requires Shipping','Variant Taxable','Image Src','Image Position','Image Alt Text','Variant Image','Status']
rows=[];metarows=[]
metaheaders=['product.metafields.custom.notes','product.metafields.custom.gender','product.metafields.custom.longevity','product.metafields.custom.demo_rating','product.metafields.custom.demo_rating_count']
headers.extend(metaheaders)
for index,item in enumerate(a):
 h=item['handle']; colors,sizes=options[h]; gallery=list(dict.fromkeys(item['images']+list(item.get('variant_images',{}).values()))); item['images']=gallery
 tags=['Twin Signature Demo','New Arrivals']; memberships=[]
 if h in women:tags.append('Women Perfumes');memberships.append('women-perfumes')
 if h in men:tags.append('Men Colognes');memberships.append('men-colognes')
 if index<10:tags.append('Gift Sets');memberships.append('gift-sets')
 if index<8:tags.append('Best Sellers');memberships.append('best-sellers')
 if h in popular:tags.append('Popular Perfumes');memberships.append('popular-perfumes')
 if item['compare_at_price']:tags.append('Sale');memberships.append('sale')
 gender='Women' if h in women and h not in men else 'Men' if h in men and h not in women else 'Unisex'
 item.update(options=[dict(name='Color',values=colors)]+([dict(name='Weight',values=sizes)] if sizes else []),notes=notes[index%len(notes)],gender=gender,longevity=['Moderate','Strong','8–12 hours'][index%3],collections=memberships,rating_count=2 if index%2 else 1)
 description=f'<p>{item["title"]} is a fragrance for the moments that become your story. Discover a memorable balance of {item["notes"].lower()} and carefully layered notes.</p><p>Wear it your way, from everyday rituals to special occasions. Apply lightly to pulse points and store away from direct sunlight.</p><p><em>Demo catalog item. Product descriptions, fragrance notes, prices, and review values are sample content for development.</em></p>'
 combos=list(itertools.product(colors,sizes or ['']))
 for i,(color,size) in enumerate(combos):
  price=item['price'];compare=item['compare_at_price']
  if h=='arome-virtual-flower':price={'100ML':20000,'200ML':40000,'300ML':60000,'500ML':80000}[size];compare=price+10000
  elif h in ['arome-le-parfum','eau-de-toilette-for-men','essence-pour-home']:
   factor={'100ML':1,'200ML':1.5,'500ML':2}[size];price=round(price*factor,2);compare=round(compare*factor,2) if compare else None
  image_name=item.get('variant_images',{}).get(color,gallery[min(colors.index(color),len(gallery)-1)])
  url=lambda name:'https://arrax-preview.myshopify.com/cdn/shop/files/'+name.removeprefix('ref-')
  row={'Handle':h,'Option1 Name':'Color','Option1 Value':color,'Option2 Name':'Weight' if sizes else '','Option2 Value':size,'Variant SKU':f'TS-{index+1:02}-{i+1:02}','Variant Grams':100,'Variant Inventory Tracker':'shopify','Variant Inventory Qty':15 if item['available'] else 0,'Variant Inventory Policy':'deny','Variant Fulfillment Service':'manual','Variant Price':f'{price:.2f}','Variant Compare At Price':f'{compare:.2f}' if compare else '','Variant Requires Shipping':'TRUE','Variant Taxable':'TRUE','Variant Image':url(image_name)}
  if i==0:row.update({'Title':item['title'],'Body (HTML)':description,'Vendor':'Twin Signature','Type':'Eau de Parfum','Tags':', '.join(tags),'Published':'TRUE','Status':'active'})
  if i==0:row.update(dict(zip(metaheaders,[item['notes'],gender,item['longevity'],item['rating'],item['rating_count']])))
  if i<len(gallery):row.update({'Image Src':url(gallery[i]),'Image Position':i+1,'Image Alt Text':item['title']})
  rows.append(row)
 for i in range(len(combos),len(gallery)):
  rows.append({'Handle':h,'Image Src':url(gallery[i]),'Image Position':i+1,'Image Alt Text':item['title']})
 metarows.append({'Handle':h,'product.metafields.custom.notes':item['notes'],'product.metafields.custom.gender':gender,'product.metafields.custom.longevity':item['longevity'],'product.metafields.custom.demo_rating':item['rating'],'product.metafields.custom.demo_rating_count':item['rating_count']})
with (p/'demo/products.csv').open('w',newline='') as file:
 writer=csv.DictWriter(file,fieldnames=headers);writer.writeheader();writer.writerows(rows)
with (p/'demo/metafields.csv').open('w',newline='') as file:
 writer=csv.DictWriter(file,fieldnames=list(metarows[0]));writer.writeheader();writer.writerows(metarows)
(p/'demo/catalog.json').write_text(json.dumps(a,indent=2)+'\n')
print(f'Prepared {len(a)} products and {sum(len(x[0])*max(1,len(x[1])) for x in options.values())} variants.')
