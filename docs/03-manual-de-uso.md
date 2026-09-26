# 03 · Manual de uso

> Se completa a medida que cada función existe de verdad.
> Cada sección describe *qué hace la persona, paso a paso, y qué pasa del otro lado*.

## Para cualquier persona (v1)

### Entrar al portal
Abrir **portal.habilidadesparaelcambio.com.ar** desde el celular o la computadora. No hace falta registrarse.

### Instalar el portal en el celular
- **Android (Chrome):** menú ⋮ → *Instalar aplicación* (o *Agregar a la pantalla principal*).
- **iPhone (Safari):** botón *Compartir* → *Agregar a inicio*.

Queda un ícono como el de cualquier app. Se actualiza solo: no hay que descargar versiones nuevas.

### Escribir por WhatsApp
Todos los botones verdes abren WhatsApp con un mensaje ya escrito según lo que la persona estaba mirando
(ej. "Hola, quisiera información sobre el programa DBT." + "(Escribo desde el portal web)"). La persona sólo toca *Enviar*.

**Del otro lado:** el mensaje llega al número del equipo (+54 9 387 523-3693), el bot muestra su menú, pide los datos
y registra la consulta en la hoja 'Demanda'. Una persona del equipo continúa la conversación.

## Para el equipo de admisión
### Reconocer consultas que vienen del portal
Terminan con el texto *(Escribo desde el portal web)*.
### Tomar una conversación del bot
_Pendiente (derivación a persona)._
### Alertas de riesgo
_Pendiente._

## Para profesionales
### Acceso para profesionales
_Pendiente (v2)._

## Para quien mantiene el portal
### Cambiar el número de WhatsApp, el correo o el horario
Archivo `src/config.ts`. Un solo lugar.
### Cambiar textos de los servicios o las sedes
Archivo `src/content.ts`. Mantenerlo alineado con `lib/textos.js` del bot.
