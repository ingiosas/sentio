document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu toggle
const header = document.querySelector('.site-header');
const menuToggle = document.getElementById('menu-toggle');

menuToggle.addEventListener('click', () => {
  const isOpen = header.classList.toggle('nav-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.main-nav a').forEach(link => {
  link.addEventListener('click', () => {
    header.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

// Contact form — envía los datos a contact.php, que reenvía el mensaje por correo.
const form = document.getElementById('contact-form');
const note = document.getElementById('form-note');
const submitBtn = form.querySelector('.form-submit');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  note.textContent = 'Enviando...';

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: new FormData(form),
    });
    const data = await response.json();
    note.textContent = data.message;
    if (data.success) form.reset();
  } catch (err) {
    note.textContent = 'Hubo un problema al enviar tu mensaje. Intenta de nuevo o escríbenos directamente por correo.';
  } finally {
    submitBtn.disabled = false;
  }
});
