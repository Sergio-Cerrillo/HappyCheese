from decimal import Decimal
from pathlib import Path

import pdfplumber
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path('/Users/sergiocerrillo/Desktop/SCWebStudio/HappyCheese')
ASSETS = Path('/Users/sergiocerrillo/Desktop/SCWebStudio/SCWebStudio/Sources')
OUTPUT = ROOT / 'output/pdf/Presupuesto_Oficinaambulante_SCWebStudio.pdf'
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

for name, filename in [('Arial', 'Arial.ttf'), ('Arial-Bold', 'Arial Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, '/System/Library/Fonts/Supplemental/' + filename))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold')

WIDTH, HEIGHT = A4
MARGIN = 42
RIGHT = WIDTH - MARGIN
CONTENT_WIDTH = RIGHT - MARGIN
INK = colors.HexColor('#1D2528')
MUTED = colors.HexColor('#667274')
GREEN = colors.HexColor('#27685C')
LINE = colors.HexColor('#DCE4E1')
PALE = colors.HexColor('#EDF5F1')
pdf = canvas.Canvas(str(OUTPUT), pagesize=A4)
pdf.setTitle('Presupuesto Oficinaambulante | SCWebStudio')
pdf.setAuthor('SCWebStudio')
pdf.setSubject('Migración de un dominio y un buzón de correo. 7 horas a 25 EUR/h más IVA.')


def text(x, y, value, size=9, bold=False, color=INK, right=False):
    pdf.setFillColor(color)
    pdf.setFont('Arial-Bold' if bold else 'Arial', size)
    draw = pdf.drawRightString if right else pdf.drawString
    draw(x, HEIGHT - y, value)


def paragraph(value, x, y, width, size=8.3, leading=11, color=MUTED):
    style = ParagraphStyle('body', fontName='Arial', fontSize=size,
                           leading=leading, textColor=color)
    item = Paragraph(value, style)
    _, height = item.wrap(width, 300)
    item.drawOn(pdf, x, HEIGHT - y - height)
    return height


def line(y):
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.6)
    pdf.line(MARGIN, HEIGHT - y, RIGHT, HEIGHT - y)


def box(x, y, width, height, color, radius=6):
    pdf.setFillColor(color)
    pdf.roundRect(x, HEIGHT - y - height, width, height, radius, fill=1, stroke=0)


def euros(value):
    return f'{value:.2f}'.replace('.', ',') + ' €'


pdf.saveState()
pdf.setFillAlpha(0.035)
pdf.drawImage(ImageReader(str(ASSETS / 'logo-b.png')), 35, 350,
              width=530, height=530 * 990 / 2560, mask='auto')
pdf.restoreState()
pdf.drawImage(ImageReader(str(ASSETS / 'logo-full-b.png')), MARGIN, HEIGHT - 88,
              width=190, height=190 * 540 / 1920, mask='auto')
text(RIGHT, 48, 'PRESUPUESTO', 9, True, GREEN, True)
text(RIGHT, 64, 'SC-OA-20261109', 8.3, color=MUTED, right=True)
text(RIGHT, 79, '09 de noviembre de 2026', 8.3, color=MUTED, right=True)
line(106)

text(MARGIN, 141, 'Migración de dominio y correo', 23, True)
text(MARGIN, 164, 'Traslado, configuración y puesta en marcha del servicio', 10, color=MUTED)
text(MARGIN, 193, 'CLIENTE  Oficinaambulante', 9, True)
text(RIGHT, 193, '1 dominio · 1 buzón de correo', 8.5, color=MUTED, right=True)

box(MARGIN, 210, CONTENT_WIDTH, 36, PALE)
text(MARGIN + 12, 233, 'Tarifa especial de mano de obra', 9, True, GREEN)
text(RIGHT - 12, 233, '25,00 €/h', 12, True, GREEN, True)

box(MARGIN, 263, CONTENT_WIDTH, 26, INK, 4)
text(MARGIN + 11, 280, 'TRABAJOS INCLUIDOS', 8, True, colors.white)
text(443, 280, 'HORAS', 8, True, colors.white, True)
text(RIGHT - 11, 280, 'IMPORTE', 8, True, colors.white, True)

rows = [
    ('Revisión inicial y copias de seguridad',
     'Inventario de la configuración actual, copia de los registros DNS y respaldo del correo antes del traslado.', '1'),
    ('Migración y configuración del dominio',
     'Gestión del traslado al proveedor de destino y ajuste de DNS, servidores de nombres y registros de web y correo.', '1'),
    ('Creación y preparación del nuevo buzón',
     'Alta de la cuenta de correo, configuración de acceso y preparación del buzón para recibir el contenido existente.', '0.75'),
    ('Migración del correo existente',
     'Transferencia de mensajes y carpetas disponibles en origen, con revisión del contenido y sincronización final.', '1.5'),
    ('Autenticación y seguridad del correo',
     'Configuración de registros MX, SPF, DKIM y DMARC según el servicio de destino, y comprobación de su publicación.', '0.75'),
    ('Configuración de acceso y dispositivos',
     'Ajuste del cliente de correo en un ordenador y un móvil, comprobación de acceso web y entrega de los datos de conexión.', '1'),
    ('Pruebas y comprobaciones finales',
     'Verificación de envío y recepción, revisión de la propagación DNS y comprobación del dominio y del buzón tras la migración.', '1'),
]

y = 289
total_hours = Decimal('0')
rate = Decimal('25')
for title, description, hours_text in rows:
    hours = Decimal(hours_text)
    total_hours += hours
    text(MARGIN + 11, y + 17, title, 9, True)
    description_height = paragraph(description, MARGIN + 11, y + 24, 324, size=8, leading=10.5)
    assert description_height <= 22
    text(443, y + 18, str(hours).replace('.', ','), 8.7, right=True)
    text(RIGHT - 11, y + 18, euros(hours * rate), 9, right=True)
    y += 55
    line(y)

assert total_hours == Decimal('7')
subtotal = total_hours * rate
vat = subtotal * Decimal('0.21')
total = subtotal + vat
assert (subtotal, vat, total) == (Decimal('175'), Decimal('36.75'), Decimal('211.75'))

y += 18
text(MARGIN + 11, y, '7 horas × 25,00 €/h', 10, True)
paragraph('Servicio de migración de un dominio y un buzón de correo, con preparación, copias de seguridad y validación final.',
          MARGIN + 11, y + 10, 255, size=8.2, leading=11)
text(453, y, 'Base imponible', 8.5, color=MUTED, right=True)
text(RIGHT - 11, y, euros(subtotal), 9, right=True)
text(453, y + 19, 'IVA (21 %)', 8.5, color=MUTED, right=True)
text(RIGHT - 11, y + 19, euros(vat), 9, right=True)
text(453, y + 46, 'TOTAL', 9, True, GREEN, True)
text(RIGHT - 11, y + 46, euros(total), 18, True, GREEN, True)

paragraph('Los costes de dominio, renovación, alojamiento y licencia del servicio de correo se abonan al proveedor correspondiente. El calendario del traslado depende de sus plazos y de la propagación DNS.',
          MARGIN, 756, CONTENT_WIDTH, size=7.7, leading=10)
line(803)
text(MARGIN, 820, 'SCWebStudio', 8, True)
text(RIGHT, 820, 'Presupuesto · Oficinaambulante · 1 / 1', 7.6, color=MUTED, right=True)
pdf.showPage()
pdf.save()

with pdfplumber.open(OUTPUT) as document:
    assert len(document.pages) == 1
    content = document.pages[0].extract_text()
    for expected in ['Oficinaambulante', '25,00 €/h', '7 horas', '175,00 €', '36,75 €', '211,75 €']:
        assert expected in content, expected
print(OUTPUT)
print('Verified one page, 7 hours, subtotal 175.00 EUR, VAT 36.75 EUR, total 211.75 EUR.')
