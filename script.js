const menuToggle = document.querySelector('.menu-toggle');
const menuIcon = menuToggle.querySelector('use');
const navigation = document.querySelector('#main-nav');
const mobileViewport = window.matchMedia('(max-width: 720px)');

function setMenuOpen(isOpen) {
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.querySelector('span').textContent = isOpen ? 'Cerrar' : 'Menú';
  menuIcon.setAttribute('href', isOpen ? '#icon-close' : '#icon-menu');
  navigation.dataset.open = String(isOpen);
}

function updateNavigation() {
  menuToggle.hidden = !mobileViewport.matches;
  setMenuOpen(false);
}

updateNavigation();
mobileViewport.addEventListener('change', updateNavigation);

menuToggle.addEventListener('click', () => {
  setMenuOpen(menuToggle.getAttribute('aria-expanded') === 'false');
});

navigation.addEventListener('click', (event) => {
  if (mobileViewport.matches && event.target.closest('a')) {
    setMenuOpen(false);
  }
});

document.querySelector('.site-header').addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const downloadLink = document.querySelector('#download-link');
const serviceField = form.elements.namedItem('servicio');
const nameField = form.elements.namedItem('nombre');
const messageField = form.elements.namedItem('mensaje');
let draftUrl;

form.querySelector('button[type="submit"]').disabled = false;

function clearDraft() {
  if (!draftUrl) return;

  URL.revokeObjectURL(draftUrl);
  draftUrl = undefined;
  downloadLink.hidden = true;
  downloadLink.removeAttribute('href');
  status.textContent = '';
}

document.querySelectorAll('[data-service]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    serviceField.value = link.dataset.service;
    clearDraft();
  });
});

form.addEventListener('input', (event) => {
  event.target.setCustomValidity('');
  clearDraft();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearDraft();

  nameField.setCustomValidity(nameField.value.trim() ? '' : 'Escribe tu nombre.');
  messageField.setCustomValidity(messageField.value.trim() ? '' : 'Describe tu proyecto.');
  if (!form.reportValidity()) return;

  const draft = [
    'Consulta de proyecto — Vector',
    '',
    `Nombre: ${nameField.value.trim()}`,
    `Correo electrónico: ${form.elements.namedItem('correo').value.trim()}`,
    serviceField.value ? `Servicio: ${serviceField.selectedOptions[0].textContent}` : null,
    '',
    'Proyecto:',
    messageField.value.trim(),
  ].filter((line) => line !== null).join('\n');

  draftUrl = URL.createObjectURL(new Blob([draft], { type: 'text/plain;charset=utf-8' }));
  downloadLink.href = draftUrl;
  downloadLink.hidden = false;
  status.textContent = 'Tu borrador está listo.';
});
