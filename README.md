# Libro operacional de transporte de personal

Aplicación web accesible para operación diaria de transporte, organizada como
**libro por hojas/pestañas** con permisos por rol.

## Hojas del libro

1. **Hoja 1 · Programación** (rol Programador)
   - Planilla base similar al formato original (Candelaria, Ojos del Salado y Especiales).
   - Registro manual y carga masiva por Excel.
   - Historial de cambios.

2. **Hoja 2 · Ejecución** (rol Coordinador)
   - Seguimiento operacional por servicio.
   - Cambio de estado y observaciones.

3. **Hoja 3 · Reportes** (rol Reportes)
   - Indicadores operacionales y asignación por vehículo/conductor.

4. **Hoja 4 · Conductores** (rol RRHH)
   - Carga masiva y edición manual con código de conductor.

5. **Hoja 5 · Mantenimiento** (rol Mantenimiento)
   - Programación semanal/mensual.
   - Cumplimiento y alertas de próximos 7 días.

## Roles y atribuciones

- Cada rol solo edita su hoja.
- Las demás hojas quedan en modo lectura.
- `Administrador` tiene acceso total.

## Ejecutar

```bash
npm install
npm start
```

Abrir `http://localhost:3000`.
