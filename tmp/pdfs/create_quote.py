from pathlib import Path
from decimal import Decimal
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
import pdfplumber

ROOT = Path('/Users/sergiocerrillo/Desktop/SCWebStudio/HappyCheese')
OUT = ROOT / 'output/pdf/Presupuesto_Happycheese_SCWebStudio.pdf'
ASSETS = Path('/Users/sergiocerrillo/Desktop/SCWebStudio/SCWebStudio/Sources')
for name, file in [('Arial', 'Arial.ttf'), ('Arial-Bold', 'Arial Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, '/System/Library/Fonts/Supplemental/' + file))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold')
W, H = A4
M = 42
RIGHT = W - M
INK = HexColor('#1D2528')
MUTED = HexColor('#667274')
GREEN = HexColor('#27685C')
LINE = HexColor('#DCE4E1')
PALE = HexColor('#EDF5F1')
c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle('Presupuesto Happycheese | SCWebStudio')
c.setAuthor('SCWebStudio')
c.setSubject('Mejoras web: 450 EUR más IVA. Animación opcional: 150 EUR más IVA.')

def text(x, y, s, size=9, font='Arial', color=INK, align='left'):
    c.setFillColor(color)
    c.setFont(font, size)
    {'left': c.drawString, 'right': c.drawRightString}[align](x, H-y, s)

def para(s, x, y, width, size=8.4, leading=11, color=MUTED):
    p = Paragraph(s, ParagraphStyle('p', fontName='Arial', fontSize=size,
                  leading=leading, textColor=color))
    _, h = p.wrap(width, 200)
    p.drawOn(c, x, H-y-h)
    return h

def rule(y, color=LINE):
    c.setStrokeColor(color)
    c.setLineWidth(.6)
    c.line(M, H-y, RIGHT, H-y)

def rect(x,y,w,h,color,r=0):
    c.setFillColor(color)
    c.setStrokeColor(color)
    c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=0)

def eur(v):
    return f'{v:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.') + ' €'

# Original assets; PDF opacity keeps the watermark discreet without altering logos.
c.saveState()
c.setFillAlpha(.035)
c.drawImage(ImageReader(str(ASSETS/'logo-b.png')), 35, 350, width=530,
            height=530*990/2560, mask='auto')
c.restoreState()
c.drawImage(ImageReader(str(ASSETS/'logo-full-b.png')), M, H-88,
            width=190, height=190*540/1920, mask='auto')
text(RIGHT, 48, 'PRESUPUESTO', 9, 'Arial-Bold', GREEN, 'right')
text(RIGHT, 64, 'SC-HC-20261104', 8.3, color=MUTED, align='right')
text(RIGHT, 79, '04 de noviembre de 2026', 8.3, color=MUTED, align='right')
rule(106)

text(M, 139, 'Mejoras para Happycheese', 23, 'Arial-Bold')
text(M, 161, 'Web y proceso de pedidos online', 10.2, color=MUTED)
text(M, 188, 'CLIENTE  Happycheese', 8.4, 'Arial-Bold')
text(RIGHT, 188, 'Tarifa habitual: 65,00 €/h · Tarifa aplicada: 45,00 €/h', 8.4, color=MUTED, align='right')

rect(M,203,RIGHT-M,25,INK,4)
text(M+11,219,'CONCEPTO',8,'Arial-Bold',white)
text(443,219,'HORAS',8,'Arial-Bold',white,'right')
text(RIGHT-11,219,'IMPORTE',8,'Arial-Bold',white,'right')

rows = [
 ('Botón de reseñas en el correo',
  'Enlace a Google de la tienda correspondiente en la confirmación.', '.75', 36),
 ('Bases personalizadas para tartas',
  'Creación y gestión desde el dashboard, con suplemento. Activación por sabor y tienda para medianas y grandes; detalle en pedido, pago y correos.', '2', 49),
 ('Orden personalizado de sabores',
  'Gestión desde el dashboard y aplicación de un orden general en la web.', '4', 36),
 ('Aviso de antelación de 36 horas',
  'Franja animada o carrusel informativo visible en la web.', '.75', 36),
 ('Introducción solo en el primer paso',
  'El mensaje inicial se muestra al elegir tienda y se oculta al avanzar.', '.5', 36),
 ('Barra inferior fija para continuar',
  'Resumen del carrito y acceso al siguiente paso en móvil y escritorio.', '2', 36),
]
y=228
total_h=Decimal('0')
total=Decimal('0')
for title, desc, hs, height in rows:
    hours=Decimal(hs)
    amount=hours*45
    total_h+=hours
    total+=amount
    text(M+11,y+16,title,9,'Arial-Bold')
    para(desc,M+11,y+21,326,size=8,leading=10)
    text(443,y+17,str(hours).replace('.',','),8.6,align='right')
    text(RIGHT-11,y+17,eur(amount),9,align='right')
    y+=height
    rule(y)

assert total_h==10 and total==450

# Complimentary work is explicit and carries no billable hours.
y+=13
text(M+11,y,'MEJORAS INCLUIDAS DE CORTESÍA',8,'Arial-Bold',GREEN)
y+=8
text(M+11,y+14,'Rediseño del selector de hora de recogida',8.6,'Arial-Bold')
text(RIGHT-11,y+14,'GRATIS · 0,00 €',8.5,'Arial-Bold',GREEN,'right')
para('Presentación más limpia y compacta de las horas disponibles.',M+11,y+19,370,size=8,leading=10)
y+=36
text(M+11,y+10,'Descripción de la base en Happycheese Lux',8.6,'Arial-Bold')
text(RIGHT-11,y+10,'GRATIS · 0,00 €',8.5,'Arial-Bold',GREEN,'right')
para('“Elaboradas sobre nuestra base de crumble artesanal, de producción propia y textura crujiente.”',M+11,y+15,365,size=8,leading=10)
y+=39
text(M+11,y+10,'Ajuste automático del horario de tiendas',8.6,'Arial-Bold')
text(RIGHT-11,y+10,'GRATIS · 0,00 €',8.5,'Arial-Bold',GREEN,'right')
para('Actualización automática del horario mostrado de cada tienda.',M+11,y+15,365,size=8,leading=10)
y+=34
rule(y)

# Main quote totals. The optional service is excluded here.
y+=19
text(M+11,y,'10 h presupuestadas × 45,00 €/h',9,'Arial-Bold')
para('<b>Se mantiene la tarifa de 45 €/h de su primer desarrollo.</b><br/>Incluye pruebas, adaptación a móvil y escritorio, puesta en producción y una ronda de ajustes sobre el alcance descrito.',M+11,y+8,265,size=8,leading=11)
text(453,y,'Base imponible',8.5,color=MUTED,align='right')
text(RIGHT-11,y,eur(total),9,align='right')
text(453,y+17,'IVA (21 %)',8.5,color=MUTED,align='right')
text(RIGHT-11,y+17,eur(total*Decimal('.21')),9,align='right')
text(453,y+40,'TOTAL',9,'Arial-Bold',GREEN,'right')
text(RIGHT-11,y+40,eur(total*Decimal('1.21')),17,'Arial-Bold',GREEN,'right')

y+=64
rect(M,y,RIGHT-M,92,PALE,6)
text(M+13,y+18,'OPCIONAL · ANIMACIÓN DE TARTA',8.5,'Arial-Bold',GREEN)
text(RIGHT-13,y+19,'150,00 € + IVA',11,'Arial-Bold',GREEN,'right')
para('Animación de una tarta que se monta o se separa en capas al hacer scroll, integrada en una sección de la web y adaptada a móvil.',M+13,y+28,RIGHT-M-26,size=8.5,leading=11)
text(M+13,y+65,'Extra: 150,00 € + 31,50 € de IVA = 181,50 €',8.5,'Arial-Bold')
text(M+13,y+81,'Total con animación: 600,00 € + 126,00 € de IVA = 726,00 €',8.5,'Arial-Bold')

y+=100
para('La animación es opcional y no está incluida en el total principal. Cualquier ampliación del alcance se valorará por separado.',M,y,RIGHT-M,size=7.7,leading=10)
rule(803)
text(M,820,'SCWebStudio',8,'Arial-Bold')
text(RIGHT,820,'Presupuesto · Happycheese · 1 / 1',7.6,color=MUTED,align='right')
assert y+20 < 803, y
c.showPage()
c.save()

with pdfplumber.open(OUT) as pdf:
    assert len(pdf.pages)==1
    full=pdf.pages[0].extract_text()
    for expected in ['544,50 €','726,00 €','450,00 €','150,00 €','GRATIS','10 h presupuestadas']:
        assert expected in full, expected
    assert '2D' not in full
    assert full.count('GRATIS') == 3
    assert '65,00 €/h' in full
    assert 'primer desarrollo' in full
    assert 'Ajuste automático del horario de tiendas' in full
print(OUT)
print('Verified: 1 page; 10 billable hours; base 450.00; VAT 94.50; total 544.50; optional gross 181.50; combined 726.00.')
