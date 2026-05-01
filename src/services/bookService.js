const API_BASE = 'http://localhost:8080/api/books';

const headers = { 'Content-Type': 'application/json' };

async function handle(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const bookService = {
  getAll: () =>
    fetch(API_BASE).then(handle),

  getById: (id) =>
    fetch(`${API_BASE}/${id}`).then(handle),

  search: ({ title, author } = {}) => {
    const params = new URLSearchParams();
    if (title)  params.set('name',   title);
    if (author) params.set('author', author);
    return fetch(`${API_BASE}/search?${params}`).then(handle);
  },

  create: (form) =>
    fetch(API_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify(formToBook(form)),
    }).then(handle),

  update: (id, form) =>
    fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ...formToBook(form), id }),
    }).then(handle),

  delete: (id) =>
    fetch(`${API_BASE}/${id}`, { method: 'DELETE' }).then(handle),
};

function formToBook(form) {
  return {
    title:       form.title       ?? '',
    author:      form.author      ?? '',
    isbn:        form.isbn        ?? '',
    description: form.description ?? '',
    publisher:   form.publisher   ?? '',
    category:    form.category    ?? '',
    status:      form.status      || 'AVAILABLE',
  };
}
