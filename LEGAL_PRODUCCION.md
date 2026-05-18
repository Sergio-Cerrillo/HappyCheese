# ⚖️ Consideraciones Legales y Administrativas

## ⚠️ IMPORTANTE - Requisitos Legales para E-commerce en España

Antes de aceptar pedidos y pagos reales, debes cumplir con la legislación española:

---

## 📋 Documentos Legales Obligatorios

### 1. Aviso Legal

**Obligatorio por LSSI** (Ley de Servicios de la Sociedad de la Información)

Debe incluir:
- Nombre o razón social de la empresa
- NIF/CIF
- Domicilio social
- Email de contacto
- Datos de inscripción en el Registro Mercantil (si aplica)
- Datos del responsable del sitio web

**Ubicación**: Debe ser accesible desde todas las páginas (normalmente en el footer)

Crea: `app/legal/aviso-legal/page.tsx`

### 2. Política de Privacidad

**Obligatorio por RGPD** (Reglamento General de Protección de Datos)

Debe explicar:
- Qué datos recoges (nombre, email, teléfono, etc.)
- Para qué los usas (procesamiento de pedidos, envío de emails)
- Cuánto tiempo los guardas
- Con quién los compartes (Stripe, Supabase, etc.)
- Derechos del usuario (acceso, rectificación, supresión, portabilidad)
- Cómo ejercer estos derechos
- Base legal del tratamiento

Crea: `app/legal/privacidad/page.tsx`

### 3. Política de Cookies

**Obligatorio por LSSI y RGPD**

Debe explicar:
- Qué cookies usas (esenciales, analytics, funcionales)
- Para qué sirven
- Cómo deshabilitarlas
- Terceros que usan cookies (Google Analytics, Stripe, Vercel)

Necesitas un **banner de cookies** con:
- Información clara
- Botón "Aceptar todas"
- Botón "Rechazar no esenciales"
- Link a política de cookies detallada

Crea: `app/legal/cookies/page.tsx`

### 4. Condiciones de Venta

**Obligatorio para e-commerce**

Debe incluir:
- Información del producto (descripción, precio, impuestos)
- Proceso de compra (pasos, confirmación)
- Métodos de pago aceptados
- **Derecho de desistimiento** (14 días naturales en productos no perecederos)
  - ⚠️ **IMPORTANTE**: Las tartas son productos perecederos
  - Debes especificar si aplica o no el derecho de desistimiento
  - Si no aplica, debe estar claramente indicado ANTES de la compra
- Política de cancelaciones y reembolsos
- Garantías
- Responsabilidades
- Ley aplicable y jurisdicción

Crea: `app/legal/condiciones-venta/page.tsx`

---

## 🛡️ Consentimientos Necesarios

### 1. En el formulario de pedido

Antes de procesar el pago, el usuario DEBE aceptar:

```typescript
<Checkbox required>
  He leído y acepto las{' '}
  <a href="/legal/condiciones-venta" target="_blank">
    Condiciones de Venta
  </a>
  {' '}y la{' '}
  <a href="/legal/privacidad" target="_blank">
    Política de Privacidad
  </a>
</Checkbox>
```

### 2. Marketing (Opcional)

Si quieres enviar newsletters o promociones:

```typescript
<Checkbox> // NO required - debe ser opt-in
  Acepto recibir información comercial y promociones de HappyCheese
</Checkbox>
```

⚠️ **Importante**: Si el usuario NO acepta, NO puedes enviar marketing.

### 3. Cookies

Necesitas un banner de cookies al cargar la página:

```typescript
// components/cookie-banner.tsx
'use client'

export function CookieBanner() {
  const [show, setShow] = useState(true)
  
  if (!show) return null
  
  return (
    <div className="fixed bottom-0 w-full bg-black/90 text-white p-4 z-50">
      <div className="container flex items-center justify-between gap-4">
        <p>
          Usamos cookies para mejorar tu experiencia.{' '}
          <a href="/legal/cookies" className="underline">
            Más información
          </a>
        </p>
        <div className="flex gap-2">
          <Button onClick={() => setShow(false)}>Aceptar</Button>
          <Button variant="outline" onClick={() => setShow(false)}>
            Rechazar no esenciales
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 💳 Información de Pago

### Obligatorio en el checkout:

1. **Desglose de precios**:
   - Precio base
   - IVA (indicar porcentaje - normalmente 10% para alimentación)
   - Precio total

2. **Información de Stripe**:
   - Stripe es el procesador de pagos
   - Los datos de pago nunca se guardan en tu servidor
   - Stripe cumple con PCI-DSS

3. **Confirmación de compra**:
   - Mostrar resumen completo ANTES de pagar
   - Botón claro: "Confirmar y pagar"
   - No puede haber confusión sobre qué está comprando

---

## 📧 Emails Obligatorios

Después de cada pedido, debes enviar:

### 1. Email de confirmación al cliente

Debe incluir:
- Número de pedido
- Fecha y hora del pedido
- Productos comprados
- Precio total con IVA desglosado
- Forma de pago
- Datos de recogida
- Información de contacto
- Link para ver el pedido
- Información sobre derecho de desistimiento (si aplica)

### 2. Factura o ticket

Según la ley española:
- Emitir factura o ticket simplificado
- Guardar copia durante mínimo 4 años
- Incluir todos los datos fiscales

Considera integrar:
- FacturaDirecta
- Holded
- A3Software
- O generar PDFs con tu propio sistema

---

## 🏢 Requisitos Fiscales

### 1. Alta en Hacienda

- IAE (Impuesto de Actividades Económicas)
- Modelo 036/037 (Alta en actividad económica)
- Epígrafe correspondiente

### 2. IVA

- Declaración trimestral (Modelo 303)
- Resumen anual (Modelo 390)
- Para alimentación: generalmente 10% IVA
- ⚠️ Confirma con tu asesor fiscal

### 3. IRPF / Impuesto de Sociedades

- Según tu forma jurídica
- Declaración anual

### 4. Facturación electrónica

- Sistema de facturación conforme a normativa
- Conservación durante al menos 4 años

---

## 🍰 Normativa Específica de Alimentación

### 1. Registro Sanitario (RGSEAA)

- **OBLIGATORIO** para vender alimentos
- Cada tienda/obrador debe estar registrado
- Número de registro debe aparecer en la web

### 2. Información Alimentaria

Debes informar sobre:
- Ingredientes
- **Alérgenos** (en negrita o destacado)
  - Leche y derivados
  - Huevos
  - Gluten
  - Frutos secos
  - Etc.
- Condiciones de conservación
- Fecha de consumo preferente

Ejemplo:
```
Ingredientes: Queso crema (LECHE), azúcar, HUEVOS, galleta (TRIGO), 
mantequilla (LECHE), vainilla.

Alérgenos: Contiene LECHE, HUEVOS y GLUTEN.

Conservación: Mantener refrigerado entre 2°C y 5°C.
Consumir en las 48 horas siguientes a la recogida.
```

### 3. Trazabilidad

- Sistema de trazabilidad de ingredientes
- Registro de lotes producidos
- Control de cadena de frío (si aplica)

### 4. Manipuladores de Alimentos

- Carné de manipulador de alimentos
- Para todo el personal que trabaja con alimentos

---

## 📑 Templates de Páginas Legales

### Footer Component

```typescript
// components/footer.tsx
export function Footer() {
  return (
    <footer className="bg-gray-100 py-8">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3>HappyCheese</h3>
            <p>Tartas de queso artesanales</p>
          </div>
          
          <div>
            <h4>Información</h4>
            <ul>
              <li><a href="/nosotros">Sobre nosotros</a></li>
              <li><a href="/sabores">Nuestros sabores</a></li>
              <li><a href="/contacto">Contacto</a></li>
            </ul>
          </div>
          
          <div>
            <h4>Legal</h4>
            <ul>
              <li><a href="/legal/aviso-legal">Aviso Legal</a></li>
              <li><a href="/legal/privacidad">Política de Privacidad</a></li>
              <li><a href="/legal/cookies">Política de Cookies</a></li>
              <li><a href="/legal/condiciones-venta">Condiciones de Venta</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm">
          <p>
            © {new Date().getFullYear()} HappyCheese. Todos los derechos reservados.
          </p>
          <p className="mt-2">
            RGSEAA: XX.XXXXXX/PM (sustituir por tu número real)
          </p>
        </div>
      </div>
    </footer>
  )
}
```

---

## ✅ Checklist Legal Pre-Lanzamiento

### Documentación
- [ ] Aviso Legal publicado y accesible
- [ ] Política de Privacidad publicada
- [ ] Política de Cookies publicada
- [ ] Condiciones de Venta publicadas
- [ ] Banner de cookies implementado
- [ ] Checkbox de aceptación en formulario de pedido

### Fiscal y Legal
- [ ] Alta en Hacienda completada
- [ ] IAE pagado
- [ ] CIF/NIF visible en la web
- [ ] Sistema de facturación implementado
- [ ] Asesor fiscal/legal consultado

### Alimentación
- [ ] Registro Sanitario (RGSEAA) obtenido
- [ ] Número RGSEAA visible en la web
- [ ] Información de alérgenos clara y visible
- [ ] Carné de manipulador de alimentos vigente
- [ ] Condiciones de conservación informadas

### Datos y Privacidad
- [ ] Registro de actividades de tratamiento (RGPD)
- [ ] Procedimiento para ejercicio de derechos RGPD
- [ ] Medidas de seguridad implementadas
- [ ] Política de retención de datos definida

### E-commerce
- [ ] Proceso de compra claro y transparente
- [ ] Información de precios con IVA incluido
- [ ] Métodos de pago claramente indicados
- [ ] Política de devoluciones/cancelaciones clara
- [ ] Derecho de desistimiento informado (si aplica)

---

## 🤝 Recomendaciones

1. **Contrata un abogado especializado** en e-commerce para revisar todo
2. **Contrata un asesor fiscal** para configuración correcta de impuestos
3. **Usa generadores de políticas** como base (hay varios online), pero personalízalos
4. **Revisa la normativa local** de Baleares, puede haber requisitos adicionales
5. **Actualiza las políticas** al menos una vez al año

---

## 🔗 Recursos Útiles

- **AEPD** (Agencia Española de Protección de Datos): https://www.aepd.es
- **RGPD**: Reglamento (UE) 2016/679
- **LSSI**: Ley 34/2002
- **AESAN** (Agencia Española de Seguridad Alimentaria): https://www.aesan.gob.es
- **Conselleria de Salud (Baleares)**: https://www.caib.es

---

## ⚠️ Disclaimer

Esta guía es orientativa y no constituye asesoramiento legal. 
La legislación puede cambiar y cada caso es específico.

**Consulta siempre con profesionales:**
- Abogado especializado en e-commerce y RGPD
- Asesor fiscal
- Técnico en seguridad alimentaria

---

**Última actualización**: Mayo 2026

**IMPORTANTE**: No lances a producción sin consultar con profesionales legales y fiscales.
