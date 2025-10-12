const form = document.getElementById('checklist-form');
const metadataContainer = document.getElementById('metadata-fields');
const sectionsContainer = document.getElementById('section-fields');
const closingContainer = document.getElementById('closing-fields');
const statusMessage = document.getElementById('status-message');
const previewContainer = document.getElementById('preview');
const previewJson = document.getElementById('preview-json');
const appTitle = document.getElementById('app-title');
const appDescription = document.getElementById('app-description');

let template = null;

const getEmbeddedTemplate = () => {
  const script = document.getElementById('embedded-template');
  if (!script) {
    return null;
  }

  try {
    return JSON.parse(script.textContent);
  } catch (error) {
    console.error('No se pudo analizar la plantilla incrustada:', error);
    return null;
  }
};

const createInput = (field, prefix) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';

  const label = document.createElement('label');
  label.setAttribute('for', `${prefix}-${field.id}`);
  label.textContent = field.label;

  let input;
  switch (field.type) {
    case 'textarea':
      input = document.createElement('textarea');
      input.rows = field.rows || 3;
      break;
    case 'select':
      input = document.createElement('select');
      if (Array.isArray(field.options)) {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Selecciona una opción';
        placeholder.disabled = true;
        placeholder.selected = true;
        input.appendChild(placeholder);

        field.options.forEach((option) => {
          const opt = document.createElement('option');
          opt.value = option;
          opt.textContent = option;
          input.appendChild(opt);
        });
      }
      break;
    case 'date':
    case 'time':
    case 'number':
    case 'text':
    default:
      input = document.createElement('input');
      input.type = field.type || 'text';
      break;
  }

  input.id = `${prefix}-${field.id}`;
  input.name = `${prefix}-${field.id}`;
  if (field.required) {
    input.required = true;
  }

  if (field.type === 'number' && field.min !== undefined) {
    input.min = field.min;
  }
  if (field.type === 'number' && field.max !== undefined) {
    input.max = field.max;
  }

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  return wrapper;
};

const buildForm = (data) => {
  template = data;
  appTitle.textContent = data.title || 'Checklist de revisión de mantenimiento';
  appDescription.textContent = data.description || '';

  metadataContainer.replaceChildren();
  data.metadataFields.forEach((field) => {
    metadataContainer.appendChild(createInput(field, 'metadata'));
  });

  sectionsContainer.replaceChildren();
  data.sections.forEach((section) => {
    const sectionWrapper = document.createElement('section');
    sectionWrapper.className = 'section-block';

    const heading = document.createElement('h3');
    heading.textContent = section.title;
    sectionWrapper.appendChild(heading);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'grid';

    section.items.forEach((item) => {
      itemsContainer.appendChild(createInput(item, `${section.id}`));
    });

    sectionWrapper.appendChild(itemsContainer);

    if (section.notesField) {
      const notes = createInput({
        ...section.notesField,
        type: section.notesField.type || 'textarea'
      }, `${section.id}`);
      notes.classList.add('full');
      sectionWrapper.appendChild(notes);
    }

    sectionsContainer.appendChild(sectionWrapper);
  });

  closingContainer.replaceChildren();
  data.closingFields.forEach((field) => {
    closingContainer.appendChild(createInput(field, 'closing'));
  });
};

const collectMetadata = () => {
  const metadata = {};
  template.metadataFields.forEach((field) => {
    const element = form.elements[`metadata-${field.id}`];
    metadata[field.id] = element ? element.value : '';
  });
  return metadata;
};

const collectSections = () => {
  return template.sections.map((section) => {
    const items = section.items.map((item) => {
      const element = form.elements[`${section.id}-${item.id}`];
      return {
        id: item.id,
        label: item.label,
        value: element ? element.value : ''
      };
    });

    let notes = '';
    if (section.notesField) {
      const element = form.elements[`${section.id}-${section.notesField.id}`];
      notes = element ? element.value : '';
    }

    return {
      id: section.id,
      title: section.title,
      items,
      notes
    };
  });
};

const collectClosing = () => {
  const closing = {};
  template.closingFields.forEach((field) => {
    const element = form.elements[`closing-${field.id}`];
    closing[field.id] = element ? element.value : '';
  });
  return closing;
};

const updatePreview = (payload) => {
  previewJson.textContent = JSON.stringify(payload, null, 2);
  previewContainer.hidden = false;
};

const submitChecklist = async (payload) => {
  try {
    const response = await fetch('/api/checklists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      throw new Error('El servidor no devolvió una respuesta válida.');
    }

    if (!response.ok) {
      throw new Error(result.message || 'No se pudo guardar el checklist.');
    }

    const message = result.message || 'Checklist guardado correctamente.';
    statusMessage.textContent = message;
    statusMessage.className = 'success';

    updatePreview({ ...payload, response: result });
  } catch (error) {
    console.error(error);
    statusMessage.textContent = error.message;
    statusMessage.className = 'error';
  }
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    statusMessage.textContent = 'Revisa los campos obligatorios antes de guardar.';
    statusMessage.className = 'error';
    return;
  }

  const payload = {
    metadata: collectMetadata(),
    sections: collectSections(),
    closing: collectClosing()
  };

  statusMessage.textContent = 'Guardando checklist...';
  statusMessage.className = 'info';
  submitChecklist(payload);
});

form.addEventListener('reset', () => {
  statusMessage.textContent = 'Completa los campos y guarda el checklist.';
  statusMessage.className = '';
  previewContainer.hidden = true;
  previewJson.textContent = '';
});

const loadTemplate = async () => {
  try {
    const response = await fetch('/api/template');
    if (!response.ok) {
      throw new Error('Respuesta no válida del servidor');
    }
    const data = await response.json();
    buildForm(data);
  } catch (error) {
    if (template) {
      statusMessage.textContent = 'Usando la plantilla incrustada por falta de conexión con el servidor.';
      statusMessage.className = 'info';
    } else {
      statusMessage.textContent = 'No se pudo cargar la plantilla del checklist.';
      statusMessage.className = 'error';
    }
  }
};

const embeddedTemplate = getEmbeddedTemplate();
if (embeddedTemplate) {
  buildForm(embeddedTemplate);
}

loadTemplate();
