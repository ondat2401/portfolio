"""Original screen artwork for the comic arcade; run with Python + Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).parent
INK, PAPER, RED, GOLD = '#191918', '#eee5d2', '#b34a40', '#d9ad61'
image = Image.new('RGB', (768, 640), INK)
d = ImageDraw.Draw(image)
font = lambda size: ImageFont.truetype('C:/Windows/Fonts/impact.ttf', size)
d.rounded_rectangle((16, 16, 751, 623), radius=25, outline=PAPER, width=4)
d.text((45, 35), '1UP  002400', font=font(29), fill=PAPER)
d.text((718, 35), 'HI  009900', font=font(29), fill=GOLD, anchor='ra')
d.text((384, 102), 'ONE MORE TRY', font=font(72), fill=PAPER, anchor='mt', stroke_width=1)
d.text((384, 190), 'SMALL STEPS. BIG JUMPS.', font=font(22), fill=GOLD, anchor='mt')
for x, y in [(80,270),(175,320),(620,260),(689,355),(410,265)]:
    d.line((x-5,y,x+5,y), fill=PAPER, width=2)
    d.line((x,y-5,x,y+5), fill=PAPER, width=2)
for x, y, w in [(40,490,210),(300,425,160),(530,355,195)]:
    d.rectangle((x,y,x+w,y+22), fill=PAPER)
    d.rectangle((x,y+22,x+w,y+48), fill=RED)
    for xx in range(x+7,x+w-4,16):
        d.line((xx,y+28,xx+9,y+40),fill=INK,width=3)
for x,y in [(315,365),(385,333),(455,300)]:
    d.ellipse((x-13,y-17,x+13,y+17), fill=GOLD)
    d.line((x,y-10,x,y+10),fill=INK,width=4)
# A tiny original robot caught mid-jump.
x,y,s=214,347,7
pixels=['  IIIII  ',' IPPPPII ',' IPIPIPI ',' IPPPPP I','  RRRR   ',' IRRRRRI ','I RRRR I ','  II II  ',' II   II ']
for row,line in enumerate(pixels):
    for col,p in enumerate(line):
        if p!=' ':
            d.rectangle((x+col*s,y+row*s,x+(col+1)*s-1,y+(row+1)*s-1),fill={'I':PAPER,'P':GOLD,'R':RED}[p])
d.line((192,407,161,432),fill=PAPER,width=4)
d.line((189,389,159,405),fill=RED,width=4)
d.text((384, 557), 'PRESS START', font=font(39), fill=PAPER, anchor='mt')
# Subtle CRT scanlines, deliberately baked into artwork rather than a shader.
overlay=Image.new('RGBA',image.size)
scan=ImageDraw.Draw(overlay)
for yy in range(0,640,5):
    scan.line((0,yy,768,yy),fill=(0,0,0,28))
image=Image.alpha_composite(image.convert('RGBA'),overlay).convert('RGB')
assert image.size==(768,640)
image.save(OUT/'screen.png', optimize=True)
