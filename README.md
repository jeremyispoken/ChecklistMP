# Checklist de revisión de mantenimiento

Aplicación web ligera para capturar checklists de mantenimiento de manera digital.
El formulario replica los campos del formato original y envía las respuestas a una
colección de Firestore llamada **Checklists** utilizando Firebase Admin.

## Características

- Formulario dinámico generado desde `data/checklistTemplate.json` para que puedas
  ajustar los parámetros del checklist sin tocar el código de la interfaz.
- Envío de la información a Firestore mediante el SDK de `firebase-admin`.
- Almacenamiento local de respaldo en `data/localSubmissions.json` cuando Firebase
  no está configurado (útil para desarrollo).
- Interfaz moderna responsive que funciona en escritorio y móviles.

## Requisitos previos

1. Node.js 18 o superior.
2. Archivo de credenciales de servicio de Firebase (JSON) con permisos sobre
   Firestore. Puedes generarlo desde la consola de Firebase.

## Configuración

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia tu archivo de credenciales a la raíz del proyecto y nómbralo
   `serviceAccountKey.json`. También puedes colocar el archivo en cualquier
   ubicación y exponer la ruta mediante la variable de entorno `SERVICE_ACCOUNT_PATH`.

3. (Opcional) Ajusta los campos del checklist editando
   `data/checklistTemplate.json`.

## Ejecución

```bash
npm start
```

El servidor quedará disponible en `http://localhost:3000`. Abre esa URL en tu
navegador para cargar el formulario.

## Despliegue

- Configura una variable de entorno `SERVICE_ACCOUNT_PATH` o
  `GOOGLE_APPLICATION_CREDENTIALS` en tu plataforma de despliegue apuntando al
  JSON de credenciales.
- Asegúrate de que la base de datos de Firestore tenga la colección `Checklists`
  o permisos para crearla automáticamente.

## Estructura del payload

Cada envío genera un documento con la siguiente forma:

```json
{
  "metadata": { "fecha": "2024-04-01", "tecnico": "Nombre" },
  "sections": [
    {
      "id": "sistema-electrico",
      "items": [
        { "id": "bateria", "value": "OK" }
      ],
      "notes": "Observaciones"
    }
  ],
  "closing": {
    "observaciones-generales": "..."
  },
  "createdAt": "2024-04-01T12:00:00.000Z"
}
```

Si Firestore está operativo, `createdAt` usará `serverTimestamp()`; en modo
local se guardará como fecha ISO.

## Notas adicionales

- Los envíos almacenados localmente se acumulan en `data/localSubmissions.json`.
  El archivo se crea automáticamente cuando es necesario.
- Para adaptar el formulario a otros formatos, modifica la plantilla y el
  frontend se actualizará en el siguiente recarga.

