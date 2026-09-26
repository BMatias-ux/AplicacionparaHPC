# Pedido de cotización a proveedores de WhatsApp API — 26/09/2026

Texto para enviar por el formulario de contacto o correo de ventas de cada proveedor
(360dialog y al menos uno más). Adaptar el saludo y firmar como M Digital.

---

Asunto: Cotización WhatsApp Business API con coexistencia · 1 número · Argentina

Hola,

Soy Matías Benni, de M Digital (agencia digital, Salta, Argentina). Administro la comunicación de
Fundación Habilidades para el Cambio, un centro de salud mental con equipo en varias provincias.

Necesitamos conectar **un número argentino que hoy usa el equipo en la app WhatsApp Business** a la Cloud
API con **coexistencia**: el equipo tiene que seguir respondiendo desde la app en sus celulares, y un bot
propio (ya desarrollado, corriendo en Vercel/Node.js sobre la Cloud API de Meta) atiende el primer contacto y
deriva a una persona.

Datos:
- Volumen estimado: 200–400 conversaciones entrantes por mes, la mayoría iniciadas por el usuario.
- Plantillas salientes: muy pocas por ahora (avisos al equipo).
- Ya tenemos app de Meta, Business Portfolio y webhook funcionando en otro número.

Preguntas:
1. ¿Ofrecen coexistencia (WhatsApp Business App + API en el mismo número) para números de Argentina? ¿Qué requisitos
   tiene el Business Portfolio y hace falta verificación de negocio de Meta?
2. Precio mensual por número, cargos de alta, y si las tarifas de Meta se trasladan sin recargo.
3. ¿Podemos usar nuestro propio webhook (URL en Vercel) y recibimos los eventos `smb_message_echoes` cuando el
   equipo responde desde la app? ¿Cómo autentican las llamadas a nuestro webhook?
4. ¿Se puede migrar el número que ya está en la Cloud API con nuestra app propia, o conviene dar de alta el número
   del equipo directamente con ustedes?
5. Tiempos de alta, forma de pago desde Argentina y moneda de facturación.

Gracias,
Matías Benni · M Digital · mdigital.net.ar
