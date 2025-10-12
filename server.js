const fs = require('fs');
const path = require('path');
const express = require('express');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;
const TEMPLATE_PATH = path.join(__dirname, 'data', 'checklistTemplate.json');
const FALLBACK_STORAGE = path.join(__dirname, 'data', 'localSubmissions.json');

let template = { sections: [], metadataFields: [], closingFields: [] };
try {
  const rawTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  template = JSON.parse(rawTemplate);
} catch (error) {
  console.error('No se pudo cargar la plantilla del checklist:', error.message);
}

const resolveServiceAccountPath = () => {
  const candidate = process.env.SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || 'serviceAccountKey.json';
  return path.isAbsolute(candidate) ? candidate : path.join(__dirname, candidate);
};

let firestore = null;
try {
  const serviceAccountPath = resolveServiceAccountPath();
  const credentialContent = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(credentialContent);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  firestore = admin.firestore();
  console.log('Firebase Admin inicializado correctamente.');
} catch (error) {
  console.warn('No se pudo inicializar Firebase Admin. Las solicitudes se almacenarán localmente. Detalles:', error.message);
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/template', (_req, res) => {
  res.json(template);
});

const validatePayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return 'Cuerpo de la solicitud inválido.';
  }

  if (!payload.metadata || typeof payload.metadata !== 'object') {
    return 'La sección de metadata es obligatoria.';
  }

  if (!Array.isArray(payload.sections)) {
    return 'La sección de detalles es obligatoria.';
  }

  return null;
};

const persistLocally = async (entry) => {
  let existing = [];
  try {
    const raw = fs.readFileSync(FALLBACK_STORAGE, 'utf8');
    existing = JSON.parse(raw);
    if (!Array.isArray(existing)) {
      existing = [];
    }
  } catch (error) {
    existing = [];
  }

  existing.push(entry);
  fs.writeFileSync(FALLBACK_STORAGE, JSON.stringify(existing, null, 2), 'utf8');
};

app.post('/api/checklists', async (req, res) => {
  const payload = req.body;
  const error = validatePayload(payload);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const entry = {
    ...payload,
    createdAt: new Date().toISOString()
  };

  if (firestore) {
    try {
      const docRef = await firestore.collection('Checklists').add({
        ...payload,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(201).json({ id: docRef.id, message: 'Checklist almacenado correctamente en Firestore.' });
    } catch (firebaseError) {
      console.error('Error al guardar en Firestore:', firebaseError);
    }
  }

  try {
    await persistLocally(entry);
    return res.status(201).json({
      id: null,
      message: 'Firebase no disponible. Checklist almacenado localmente en data/localSubmissions.json.'
    });
  } catch (fileError) {
    console.error('No se pudo almacenar el checklist:', fileError);
    return res.status(500).json({ message: 'No se pudo almacenar el checklist en este momento.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
