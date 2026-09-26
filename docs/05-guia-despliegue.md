# 05 · Guía de despliegue

## Cómo se publica hoy

GitHub (`AplicacionparaHPC`, rama `main`) → Vercel (proyecto `app-hpc`) despliega solo en cada `git push`.
URL actual: `app-hpc.vercel.app`.

## Conectar el subdominio

> Mismo mecanismo que un subdominio de Caja Eureka: el dominio sigue en Hostinger y solo un registro DNS apunta a Vercel.
> **No se toca el dominio raíz** (`habilidadesparaelcambio.com.ar` es el WordPress).

### 1. En Vercel
1. Proyecto `app-hpc` → **Settings → Domains → Add Domain**.
2. Escribir el subdominio elegido, `portal.habilidadesparaelcambio.com.ar`.
3. Vercel muestra el registro DNS que necesita (normalmente un **CNAME**). **Copiar exactamente el valor que muestre**
   (Vercel puede dar un valor específico del proyecto; no usar uno de memoria).

### 2. En Hostinger
1. hPanel → **Dominios** → `habilidadesparaelcambio.com.ar` → **DNS / Nameservers**.
2. Verificar que los nameservers sean los de Hostinger (si apuntan a otro lado, el DNS se edita allá).
3. **Agregar registro**: Tipo `CNAME` · Nombre `portal` (solo la parte del subdominio) · Destino: el valor que dio Vercel · TTL por defecto.
4. Guardar. Revisar antes que no exista ya un registro `portal` (A o CNAME) que choque.

### 3. Verificar
- Volver a Vercel → Domains: pasa a **Valid Configuration** (puede tardar de minutos a unas horas).
- Vercel emite el certificado HTTPS solo.
- Desde PowerShell se puede comprobar la propagación:

```powershell
# Muestra a dónde apunta el subdominio
Resolve-DnsName portal.habilidadesparaelcambio.com.ar -Type CNAME
```

## Trabajo local

```powershell
cd C:\Proyectos
git clone https://github.com/BMatias-ux/AplicacionparaHPC.git app-hpc
cd app-hpc
npm install          # el repo trae bun.lock; con npm también funciona
npm run dev          # abre en http://localhost:3000
npm run build        # prueba el build de producción antes de subir
```

Subir cambios (Vercel despliega solo):

```powershell
git add .
git commit -m "descripción clara del cambio"
git push
```
