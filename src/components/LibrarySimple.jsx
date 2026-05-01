import { useState, useEffect, useMemo } from 'react';

const API = 'http://localhost:8080/api/books';
const STATUSES = ['AVAILABLE', 'CHECKED_OUT', 'RESERVED', 'LOST'];
const CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Other'];

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

const statusColor = {
  AVAILABLE:   { bg: '#e8f5ee', color: '#2d7a4f' },
  CHECKED_OUT: { bg: '#fff4e0', color: '#a06000' },
  RESERVED:    { bg: '#e8f0ff', color: '#2d50a0' },
  LOST:        { bg: '#ffe8e8', color: '#a02d2d' },
};

export default function LibraryApp() {
  const [books,   setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [modal,   setModal]   = useState(null); // null | 'new' | book object
  const [confirmId, setConfirmId] = useState(null);
  const [toast,   setToast]   = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setBooks(await apiFetch(API));
    } catch {
      notify('Could not connect to API', 'error');
    } finally {
      setLoading(false);
    }
  }

  function notify(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return books.filter(b =>
      !q || (b.title ?? '').toLowerCase().includes(q) || (b.author ?? '').toLowerCase().includes(q)
    );
  }, [books, query]);

  async function handleSave(form, id) {
    try {
      if (id) {
        const updated = await apiFetch(`${API}/${id}`, { method: 'PUT', body: JSON.stringify({ ...form, id }) });
        setBooks(prev => prev.map(b => b.id === id ? updated : b));
        notify('Book updated');
      } else {
        const created = await apiFetch(API, { method: 'POST', body: JSON.stringify(form) });
        setBooks(prev => [...prev, created]);
        notify('Book added');
      }
      setModal(null);
    } catch (e) {
      notify('Failed to save: ' + e.message, 'error');
    }
  }

  async function handleDelete() {
    const id = confirmId;
    setConfirmId(null);
    try {
      await apiFetch(`${API}/${id}`, { method: 'DELETE' });
      setBooks(prev => prev.filter(b => b.id !== id));
      notify('Book deleted');
    } catch {
      notify('Failed to delete', 'error');
    }
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.headerTitle}>Library</div>
          <div style={s.headerSub}>{books.length} books in collection</div>
        </div>
        <button style={s.btnPrimary} onClick={() => setModal('new')}>+ Add Book</button>
      </div>

      {/* Search */}
      <div style={s.toolbar}>
        <input
          style={s.search}
          placeholder="Search by title or author…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button style={s.btnGhost} onClick={load}>Refresh</button>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.center}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={s.center}>No books found.</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Title', 'Author', 'Category', 'Status', ''].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(book => (
                <tr key={book.id} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.bookTitle}>{book.title ?? 'Untitled'}</div>
                    {book.isbn && <div style={s.bookSub}>{book.isbn}</div>}
                  </td>
                  <td style={s.td}>{book.author ?? '—'}</td>
                  <td style={s.td}>{book.category ?? '—'}</td>
                  <td style={s.td}>
                    {book.status ? (
                      <span style={{ ...s.badge, ...(statusColor[book.status] ?? {}) }}>
                        {book.status.replace('_', ' ')}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <button style={s.btnSm} onClick={() => setModal(book)}>Edit</button>
                    <button style={{ ...s.btnSm, ...s.btnSmDanger }} onClick={() => setConfirmId(book.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Book Modal */}
      {modal !== null && (
        <BookModal
          book={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Confirm Delete */}
      {confirmId !== null && (
        <div style={s.backdrop}>
          <div style={s.modalBox}>
            <div style={s.modalTitle}>Delete this book?</div>
            <div style={s.modalSub}>This can't be undone.</div>
            <div style={s.modalActions}>
              <button style={s.btnGhost} onClick={() => setConfirmId(null)}>Cancel</button>
              <button style={{ ...s.btnPrimary, background: '#c0392b' }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === 'error' ? '#c0392b' : '#2d7a4f' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function BookModal({ book, onClose, onSave }) {
  const [form, setForm] = useState({
    title: book?.title ?? '',
    author: book?.author ?? '',
    isbn: book?.isbn ?? '',
    publisher: book?.publisher ?? '',
    category: book?.category ?? '',
    status: book?.status ?? 'AVAILABLE',
    description: book?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  async function submit() {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form, book?.id);
    setSaving(false);
  }

  return (
    <div style={s.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modalBox}>
        <div style={s.modalTitle}>{book ? 'Edit Book' : 'Add Book'}</div>

        <div style={s.formGrid}>
          <Field label="Title *" value={form.title} onChange={set('title')} placeholder="Book title" />
          <Field label="Author" value={form.author} onChange={set('author')} placeholder="Author name" />
          <Field label="ISBN" value={form.isbn} onChange={set('isbn')} placeholder="978-…" />
          <Field label="Publisher" value={form.publisher} onChange={set('publisher')} placeholder="Publisher" />
          <Field label="Category" value={form.category} onChange={set('category')} as="select" options={CATEGORY_OPTIONS} />
          <Field label="Status" value={form.status} onChange={set('status')} as="select" options={STATUS_OPTIONS} />
        </div>

        <Field label="Description" value={form.description} onChange={set('description')} as="textarea" placeholder="Optional description…" />

        <div style={s.modalActions}>
          <button style={s.btnGhost} onClick={onClose}>Cancel</button>
          <button style={s.btnPrimary} onClick={submit} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : book ? 'Save Changes' : 'Add Book'}
          </button>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_OPTIONS = CATEGORIES.map(c => ({ value: c, label: c }));
const STATUS_OPTIONS    = STATUSES.map(s => ({ value: s, label: s.replace('_', ' ') }));

function Field({ label, value, onChange, placeholder, as: As = 'input', options }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={s.label}>{label}</label>
      {As === 'select' ? (
        <select style={s.input} value={value} onChange={onChange}>
          <option value="">Select…</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : As === 'textarea' ? (
        <textarea style={{ ...s.input, height: 72, resize: 'vertical' }} value={value} onChange={onChange} placeholder={placeholder} />
      ) : (
        <input style={s.input} value={value} onChange={onChange} placeholder={placeholder} />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '40px 24px',
    fontFamily: "'Geist, 'system-ui', 'sans-serif'",
    color: '#1a1a1a',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerTitle: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' },
  headerSub:   { fontSize: 13, color: '#888', marginTop: 2 },
  toolbar: {
    display: 'flex',
    gap: 10,
    marginBottom: 18,
  },
  search: {
    flex: 1,
    padding: '9px 14px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
  },
  tableWrap: {
    border: '1px solid #e8e8e8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    padding: '11px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: '#fafafa',
    borderBottom: '1px solid #e8e8e8',
  },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '13px 16px', verticalAlign: 'middle' },
  bookTitle: { fontWeight: 500 },
  bookSub:   { fontSize: 12, color: '#999', marginTop: 2 },
  badge: {
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 500,
  },
  center: { padding: '48px 0', textAlign: 'center', color: '#999', fontSize: 14 },
  btnPrimary: {
    padding: '9px 18px',
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnGhost: {
    padding: '9px 16px',
    background: '#fff',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSm: {
    padding: '5px 12px',
    background: '#fff',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    marginLeft: 6,
    fontFamily: 'inherit',
  },
  btnSmDanger: { color: '#c0392b', borderColor: '#f5c0bc' },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modalBox: {
    background: '#fff',
    borderRadius: 12,
    padding: 28,
    width: 500,
    maxWidth: '92vw',
    boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
  },
  modalTitle:   { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  modalSub:     { fontSize: 14, color: '#888', marginBottom: 20 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 },
  input: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #ddd',
    borderRadius: 7,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  toast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    color: '#fff',
    padding: '12px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    zIndex: 100,
  },
};
