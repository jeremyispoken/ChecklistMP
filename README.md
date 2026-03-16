# Plataforma de transporte de personal

Aplicación web para coordinar la operación diaria de transporte de personal,
basada en la estructura de planillas Excel de turnos (A/B/Administrativo),
servicios especiales y control de mantenimiento preventivo.

## Módulos incluidos

1. **Programación de servicios e historial**
   - Registro manual por turno, faena, servicio, hora, vehículo y conductor.
   - Historial de cambios para trazabilidad operativa.
   - Carga masiva desde Excel (`.xlsx`, `.xls`, `.csv`) para programación.

2. **Ejecución diaria (coordinador)**
   - Estado por servicio: Programado, En ruta, Completado, Incidencia.
   - Observaciones operacionales por servicio.

3. **Reportes**
   - Resumen de servicios, vehículos activos, completados e incidencias.
   - Tabla de asignación vehículo/conductor y cantidad de servicios.

4. **Gestión de conductores**
   - Carga masiva por Excel con código de conductor.
   - Alta y modificación manual de conductores existentes.

5. **Mantenimiento preventivo**
   - Programación semanal/mensual por vehículo.
   - Seguimiento de cumplimiento.
   - Notificaciones de calendario (próximos 7 días).

## Ejecución local

```bash
npm install
npm start
```

Servidor disponible en `http://localhost:3000`.

## Persistencia

- La aplicación guarda datos en `localStorage` del navegador (`transportePersonalDataV1`).
- La carga Excel se procesa en el navegador usando SheetJS.
