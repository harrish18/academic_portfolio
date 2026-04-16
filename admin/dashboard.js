/* ============================================
   Admin Dashboard - Supabase Backend Engine
   Full CRUD with Real-time Persistence & File Uploads
   ============================================ */

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentPubTab = 'journal';
let currentStudentTab = 'mtech';
let currentModalType = '';
let editId = null;
let currentUser = null;

async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = session.user;
  document.getElementById('admin-username').textContent = currentUser.email?.split('@')[0] || 'Admin';
  await loadStats();
  renderSection('dashboard');
}

async function logout() {
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

function switchSection(section, el) {
  if(event) event.preventDefault();
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));

  const target = document.getElementById('section-' + section);
  if (target) target.classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('section-title').textContent = el ? el.textContent.trim() : section;

  renderSection(section);
  document.getElementById('admin-sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
}

async function loadStats() {
  try {
    const [pubs, projects, scholars, courses, patents, achievements] = await Promise.all([
      sb.from('publications').select('id', { count: 'exact', head: true }),
      sb.from('research_projects').select('id', { count: 'exact', head: true }),
      sb.from('scholars').select('id', { count: 'exact', head: true }),
      sb.from('courses').select('id', { count: 'exact', head: true }),
      sb.from('patents').select('id', { count: 'exact', head: true }),
      sb.from('achievements').select('id', { count: 'exact', head: true })
    ]);
    document.getElementById('stat-publications').textContent = pubs.count || 0;
    document.getElementById('stat-projects').textContent = projects.count || 0;
    document.getElementById('stat-scholars').textContent = scholars.count || 0;
    document.getElementById('stat-courses').textContent = courses.count || 0;
    document.getElementById('stat-patents').textContent = patents.count || 0;
    document.getElementById('stat-achievements').textContent = achievements.count || 0;
  } catch (e) {
    console.error('Stats error', e);
  }
}

function renderSection(section) {
  switch (section) {
    case 'publications': renderPublications(); break;
    case 'research': renderResearch(); break;
    case 'scholars': renderScholars(); break;
    case 'students': renderStudents(); break;
    case 'courses': renderCourses(); break;
    case 'gallery': renderGallery(); break;
    case 'patents': renderPatents(); break;
    case 'achievements': renderAchievements(); break;
  }
}

function buildTable(containerId, headers, rows, emptyMsg = 'No entries yet.') {
  const el = document.getElementById(containerId);
  if (!rows || rows.length === 0) {
    el.innerHTML = `<p style="padding:24px;text-align:center;color:#94a3b8;">${emptyMsg}</p>`;
    return;
  }
  el.innerHTML = `
    <table class="admin-table">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>`;
}

// ── Publications ──
function switchAdminTab(el, tab) {
  currentPubTab = tab;
  document.querySelectorAll('#section-publications .admin-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderPublications();
}

async function renderPublications() {
  let dbType = currentPubTab;
  if (dbType === 'journals') dbType = 'journal';
  if (dbType === 'conferences') dbType = 'conference';
  if (dbType === 'bookChapters' || dbType === 'books') dbType = 'bookChapter';

  const { data, error } = await sb.from('publications').select('*').eq('type', dbType).order('year', { ascending: false });
  if (error) return showToast('Error loading publications: ' + error.message, 'error');

  const isBook = dbType === 'bookChapter';
  const venueLabel = isBook ? 'Book / Publisher' : (dbType === 'journal' ? 'Journal' : 'Conference');

  buildTable('publications-table',
    ['Title', 'Authors', venueLabel, 'Year', 'Actions'],
    (data || []).map(p => `<tr>
      <td title="${p.title}" class="truncate">${p.title}</td>
      <td>${p.authors}</td>
      <td>${isBook ? `${p.venue} ${p.publisher ? '/ ' + p.publisher : ''}` : p.venue}</td>
      <td>${p.year}</td>
      <td class="actions">
        <button class="admin-btn admin-btn--sm" onclick="editPublication('${p.id}')">✏️</button>
        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteRow('publications', '${p.id}', renderPublications)">🗑️</button>
      </td></tr>`),
    'No publications yet. Click "+ Add Publication" to get started.'
  );
}

async function editPublication(id) {
  const { data } = await sb.from('publications').select('*').eq('id', id).single();
  if (!data) return;
  editId = id;
  openModalWithData('publication', { ...data, venue: data.venue });
}

// ── Research Projects ──
async function renderResearch() {
  const { data } = await sb.from('research_projects').select('*').order('created_at', { ascending: false });
  buildTable('research-table',
    ['Title', 'Description', 'Area', 'Status', 'Actions'],
    (data || []).map(p => `<tr>
      <td title="${p.title}" class="truncate">${p.title}</td>
      <td title="${p.description}" class="truncate">${p.description}</td>
      <td>${p.area}</td>
      <td><span class="status-badge status-badge--${p.status === 'Active' ? 'ongoing' : 'completed'}">${p.status}</span></td>
      <td class="actions">
        <button class="admin-btn admin-btn--sm" onclick="editRow('research_projects', '${p.id}', 'project')">✏️</button>
        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteRow('research_projects', '${p.id}', renderResearch)">🗑️</button>
      </td></tr>`)
  );
}

// ── Scholars ──
async function renderScholars() {
  const { data } = await sb.from('scholars').select('*').order('year', { ascending: false });
  buildTable('scholars-table',
    ['Name', 'Research Topic', 'Status', 'Year', 'Actions'],
    (data || []).map(s => `<tr>
      <td>${s.name}</td>
      <td title="${s.topic}" class="truncate">${s.topic}</td>
      <td><span class="status-badge status-badge--${s.status === 'Ongoing' ? 'ongoing' : 'completed'}">${s.status}</span></td>
      <td>${s.year}</td>
      <td class="actions">
        <button class="admin-btn admin-btn--sm" onclick="editRow('scholars', '${s.id}', 'scholar')">✏️</button>
        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteRow('scholars', '${s.id}', renderScholars)">🗑️</button>
      </td></tr>`)
  );
}

// ── Students ──
function switchStudentTab(el, tab) {
  currentStudentTab = tab;
  document.querySelectorAll('#section-students .admin-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderStudents();
}

async function renderStudents() {
  const { data } = await sb.from('students').select('*').eq('type', currentStudentTab).order('year', { ascending: false });
  buildTable('students-table',
    ['Name', 'Project', 'Year', 'Actions'],
    (data || []).map(s => `<tr>
      <td>${s.name}</td>
      <td title="${s.project}" class="truncate">${s.project}</td>
      <td>${s.year || '-'}</td>
      <td class="actions">
        <button class="admin-btn admin-btn--sm" onclick="editRow('students', '${s.id}', 'student')">✏️</button>
        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteRow('students', '${s.id}', renderStudents)">🗑️</button>
      </td></tr>`)
  );
}

// ── Courses ──
async function renderCourses() {
  const { data } = await sb.from('courses').select('*').order('name');
  buildTable('courses-table',
    ['S.No', 'Name', 'Code', 'Units', 'Actions'],
    (data || []).map((c, index) => {
      let units = [];
      try { units = JSON.parse(c.material_url || '[]'); } catch(e) {}
      const unitCount = Array.isArray(units) ? units.length : 0;
      return `<tr>
      <td style="font-weight:600;text-align:center;">${index + 1}</td>
      <td>${c.name}</td>
      <td style="font-family:monospace;">${c.code}</td>
      <td>${unitCount > 0 ? `<span style="color:var(--primary);">${unitCount} unit(s)</span>` : '-'}</td>
      <td class="actions">
        <button class="admin-btn admin-btn--sm" onclick="editRow('courses', '${c.id}', 'course')">✏️</button>
        <button class="admin-btn admin-btn--sm" onclick="manageMaterials('${c.id}')" title="Manage Unit Materials">📚</button>
        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteRow('courses', '${c.id}', renderCourses)">🗑️</button>
      </td></tr>`;
    })
  );
}

// Unit-wise Materials Manager
async function manageMaterials(courseId) {
  const { data: course } = await sb.from('courses').select('*').eq('id', courseId).single();
  if (!course) return showToast('Course not found', 'error');

  let units = [];
  try { units = JSON.parse(course.material_url || '[]'); } catch(e) {}
  if (!Array.isArray(units)) units = [];

  const modal = document.getElementById('admin-modal');
  const title = document.getElementById('modal-title');
  const fields = document.getElementById('modal-fields');

  title.textContent = `📚 Materials: ${course.name}`;
  editId = courseId;
  currentModalType = 'courseMaterials';

  let html = `<div id="units-list">`;
  units.forEach((u, i) => {
    html += `<div class="form__group" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg-alt);border-radius:8px;margin-bottom:8px;">
      <span style="font-weight:600;min-width:60px;">Unit ${i+1}</span>
      <span style="flex:1;font-size:0.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${u.name}</span>
      <a href="${u.url}" target="_blank" class="admin-btn admin-btn--sm" style="text-decoration:none;">📄</a>
      <button type="button" class="admin-btn admin-btn--sm admin-btn--danger" onclick="removeUnit(${i})">✖</button>
    </div>`;
  });
  html += `</div>`;
  html += `<div style="border-top:1px solid var(--border);padding-top:16px;margin-top:8px;">
    <label class="form__label">Add New Unit</label>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <input class="form__input" type="text" id="new-unit-name" placeholder="e.g. Unit 1 - Introduction" style="flex:1;min-width:150px;">
      <input class="form__input" type="file" id="new-unit-file" accept="*/*" style="flex:1;min-width:150px;">
      <button type="button" class="admin-btn admin-btn--primary" onclick="addUnit()">➕ Add Unit</button>
    </div>
  </div>`;
  html += `<input type="hidden" id="units-data" value='${JSON.stringify(units)}'>`;

  fields.innerHTML = html;
  modal.classList.add('active');
}

window._currentUnits = [];

async function addUnit() {
  const nameInput = document.getElementById('new-unit-name');
  const fileInput = document.getElementById('new-unit-file');
  const unitName = nameInput.value.trim();
  const file = fileInput.files[0];

  if (!unitName || !file) return showToast('Please enter a unit name and select a file.', 'error');

  showToast('Uploading...', 'success');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `materials/${fileName}`;

  const { error: uploadError } = await sb.storage.from('uploads').upload(filePath, file);
  if (uploadError) return showToast('Upload failed: ' + uploadError.message, 'error');

  const { data: publicData } = sb.storage.from('uploads').getPublicUrl(filePath);
  
  // Get existing units
  let units = [];
  try { units = JSON.parse(document.getElementById('units-data').value || '[]'); } catch(e) {}
  units.push({ name: unitName, url: publicData.publicUrl, fileName: file.name });

  // Save to DB
  const { error } = await sb.from('courses').update({ material_url: JSON.stringify(units) }).eq('id', editId);
  if (error) return showToast('Save failed: ' + error.message, 'error');

  showToast('Unit added successfully!');
  manageMaterials(editId); // Refresh the modal
}

async function removeUnit(index) {
  let units = [];
  try { units = JSON.parse(document.getElementById('units-data').value || '[]'); } catch(e) {}
  units.splice(index, 1);

  const { error } = await sb.from('courses').update({ material_url: JSON.stringify(units) }).eq('id', editId);
  if (error) return showToast('Failed to remove unit: ' + error.message, 'error');

  showToast('Unit removed.');
  manageMaterials(editId);
}

// ── Gallery ──
async function renderGallery() {
  const { data } = await sb.from('gallery').select('*').order('created_at', { ascending: false });
  buildTable('gallery-table',
    ['Image', 'Category', 'Caption', 'Date', 'Actions'],
    (data || []).map(img => `<tr>
      <td><img src="${img.src}" style="height:32px;width:32px;object-fit:cover;border-radius:4px;"></td>
      <td>${img.category}</td>
      <td>${img.caption}</td>
      <td>${img.date}</td>
      <td class="actions">
        <button class="admin-btn admin-btn--sm" onclick="editRow('gallery', '${img.id}', 'galleryImage')">✏️</button>
        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteRow('gallery', '${img.id}', renderGallery)">🗑️</button>
      </td></tr>`)
  );
}

// ── Patents ──
async function renderPatents() {
  const { data } = await sb.from('patents').select('*').order('year', { ascending: false });
  buildTable('patents-table',
    ['Title', 'Inventors', 'Patent No.', 'Status', 'Year', 'Actions'],
    (data || []).map(p => `<tr>
      <td title="${p.title}" class="truncate">${p.title}</td>
      <td>${p.inventors}</td>
      <td style="font-family:monospace;font-size:0.82rem;">${p.patent_number}</td>
      <td>${p.status}</td>
      <td>${p.year}</td>
      <td class="actions">
        <button class="admin-btn admin-btn--sm" onclick="editRow('patents', '${p.id}', 'patent')">✏️</button>
        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteRow('patents', '${p.id}', renderPatents)">🗑️</button>
      </td></tr>`)
  );
}

// ── Achievements ──
async function renderAchievements() {
  const { data } = await sb.from('achievements').select('*').order('created_at', { ascending: false });
  buildTable('achievements-table',
    ['Icon', 'Title', 'Description', 'Actions'],
    (data || []).map(a => `<tr>
      <td>${a.icon}</td>
      <td>${a.title}</td>
      <td title="${a.description}" class="truncate">${a.description}</td>
      <td class="actions">
        <button class="admin-btn admin-btn--sm" onclick="editRow('achievements', '${a.id}', 'achievement')">✏️</button>
        <button class="admin-btn admin-btn--sm admin-btn--danger" onclick="deleteRow('achievements', '${a.id}', renderAchievements)">🗑️</button>
      </td></tr>`)
  );
}

// ── Generic edit row ──
async function editRow(table, id, type) {
  const { data } = await sb.from(table).select('*').eq('id', id).single();
  if (!data) return;
  editId = id;
  openModalWithData(type, data);
}

async function deleteRow(table, id, refreshFn) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) {
    showToast('Delete failed: ' + error.message, 'error');
  } else {
    showToast('Deleted successfully.');
    refreshFn();
    loadStats();
  }
}

// ── Modal Field Definitions ──
const MODAL_FIELDS = {
  publication: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'authors', label: 'Authors', type: 'text', required: true },
    { name: 'venue', label: 'Journal / Conference / Book Title', type: 'text', required: true },
    { name: 'publisher', label: 'Publisher (for book chapters)', type: 'text' },
    { name: 'year', label: 'Year', type: 'number', required: true },
    { name: 'doi', label: 'DOI / URL Link', type: 'url' }
  ],
  project: [
    { name: 'title', label: 'Project Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'area', label: 'Research Area', type: 'text', required: true },
    { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed', 'Planned'] }
  ],
  scholar: [
    { name: 'name', label: 'Scholar Name', type: 'text', required: true },
    { name: 'topic', label: 'Research Topic', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['Ongoing', 'Completed'] },
    { name: 'year', label: 'Year Joined', type: 'number', required: true }
  ],
  student: [
    { name: 'name', label: 'Student Name(s)', type: 'text', required: true },
    { name: 'project', label: 'Project Title', type: 'text', required: true },
    { name: 'year', label: 'Year', type: 'number' }
  ],
  course: [
    { name: 'name', label: 'Course Name', type: 'text', required: true },
    { name: 'code', label: 'Course Code', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' }
  ],
  galleryImage: [
    { name: 'category', label: 'Category', type: 'select', options: ['Conferences', 'Workshops', 'Research Lab', 'Guest Lectures', 'Student Events'] },
    { name: 'imageFile', label: 'Upload Image (Leaves existing if blank)', type: 'file', accept: 'image/*' },
    { name: 'caption', label: 'Caption', type: 'text', required: true },
    { name: 'date', label: 'Date / Year', type: 'text', required: true },
    { name: 'existingSrc', type: 'hidden' }
  ],
  patent: [
    { name: 'title', label: 'Patent Title', type: 'text', required: true },
    { name: 'inventors', label: 'Inventors', type: 'text', required: true },
    { name: 'patent_number', label: 'Patent Number', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['Filed', 'Published', 'Granted'] },
    { name: 'year', label: 'Year', type: 'number', required: true }
  ],
  achievement: [
    { name: 'icon', label: 'Emoji Icon', type: 'text', required: true },
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true }
  ]
};

function openModal(type) {
  editId = null;
  openModalWithData(type, null);
}

function openModalWithData(type, data) {
  currentModalType = type;
  const modal = document.getElementById('admin-modal');
  const title = document.getElementById('modal-title');
  const fields = document.getElementById('modal-fields');

  title.textContent = (data && editId ? 'Edit ' : 'Add ') + type.charAt(0).toUpperCase() + type.slice(1);

  const fieldDefs = MODAL_FIELDS[type] || [];
  fields.innerHTML = fieldDefs.map(f => {
    let value = data ? (data[f.name] ?? '') : '';
    // map src to existingSrc
    if (f.name === 'existingSrc' && data) value = data['src'] || '';
    if (f.name === 'existingMaterial' && data) value = data['material_url'] || '';
    
    if (f.type === 'hidden') return `<input type="hidden" name="${f.name}" value="${value}">`;
    if (f.type === 'file') {
      const isRequired = (!data && f.required) ? 'required' : '';
      let previewHtml = '';
      if (data && data.src && f.name === 'imageFile') previewHtml = `<img src="${data.src}" style="height:48px;border-radius:6px;margin-bottom:8px;display:block;">`;
      if (data && data.material_url && f.name === 'materialFile') previewHtml = `<div style="margin-bottom:8px;font-size:0.85rem;"><a href="${data.material_url}" target="_blank">Current Material Attached</a></div>`;
      return `<div class="form__group"><label class="form__label">${f.label}</label>${previewHtml}<input class="form__input" type="file" name="${f.name}" accept="${f.accept || '*/*'}" ${isRequired}></div>`;
    }

    if (f.type === 'textarea') {
      return `<div class="form__group"><label class="form__label">${f.label}</label><textarea class="form__textarea" name="${f.name}" ${f.required ? 'required' : ''}>${value}</textarea></div>`;
    }
    if (f.type === 'select') {
      return `<div class="form__group"><label class="form__label">${f.label}</label><select class="form__input" name="${f.name}">${f.options.map(o => `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
    }
    return `<div class="form__group"><label class="form__label">${f.label}</label><input class="form__input" type="${f.type}" name="${f.name}" value="${value}" ${f.required ? 'required' : ''}></div>`;
  }).join('');

  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('admin-modal').classList.remove('active');
  document.getElementById('modal-form').reset();
  editId = null;
}

// ── Modal Submit → Supabase ──
async function handleModalSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('modal-submit-btn');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  const form = e.target;
  const formData = new FormData(form);
  const data = {};
  formData.forEach((v, k) => {
    if (v instanceof File) {
      if (v.size > 0) data[k] = v; // Only capture if actually selected
    } else {
      data[k] = v;
    }
  });
  if (data.year) data.year = parseInt(data.year, 10);

  let table, payload, refreshFn;

  switch (currentModalType) {
    case 'publication':
      table = 'publications';
      let mappedType = currentPubTab;
      if (mappedType === 'journals') mappedType = 'journal';
      if (mappedType === 'conferences') mappedType = 'conference';
      if (mappedType === 'bookChapters' || mappedType === 'books') mappedType = 'bookChapter';
      
      payload = { type: mappedType, title: data.title, authors: data.authors, venue: data.venue, publisher: data.publisher || null, year: data.year, doi: data.doi || null };
      refreshFn = renderPublications;
      break;
    case 'project':
      table = 'research_projects';
      payload = { title: data.title, description: data.description, area: data.area, status: data.status };
      refreshFn = renderResearch;
      break;
    case 'scholar':
      table = 'scholars';
      payload = { name: data.name, topic: data.topic, description: data.description || null, status: data.status, year: data.year };
      refreshFn = renderScholars;
      break;
    case 'student':
      table = 'students';
      payload = { type: currentStudentTab, name: data.name, project: data.project, year: data.year || null };
      refreshFn = renderStudents;
      break;
    case 'course':
      table = 'courses';
      payload = { name: data.name, code: data.code, description: data.description || null };
      refreshFn = renderCourses;
      break;
    case 'courseMaterials':
      // Materials are handled separately via manageMaterials()
      closeModal();
      renderCourses();
      btn.textContent = 'Save';
      btn.disabled = false;
      return;
    case 'galleryImage':
      // Handle file upload
      let srcPath = data.existingSrc || '';
      if (data.imageFile) {
        const file = data.imageFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `gallery/${fileName}`;
        
        const { error: uploadError } = await sb.storage.from('uploads').upload(filePath, file);
        if (uploadError) {
          showToast('Image upload failed: ' + uploadError.message, 'error');
          btn.textContent = 'Save';
          btn.disabled = false;
          return;
        }
        
        const { data: publicData } = sb.storage.from('uploads').getPublicUrl(filePath);
        srcPath = publicData.publicUrl;
      } else if (!editId && !srcPath) {
        showToast('Please select an image file.', 'error');
        btn.textContent = 'Save';
        btn.disabled = false;
        return;
      }

      table = 'gallery';
      payload = { category: data.category, src: srcPath, caption: data.caption, date: data.date };
      refreshFn = renderGallery;
      break;
    case 'patent':
      table = 'patents';
      payload = { title: data.title, inventors: data.inventors, patent_number: data.patent_number, description: data.description || null, status: data.status, year: data.year };
      refreshFn = renderPatents;
      break;
    case 'achievement':
      table = 'achievements';
      payload = { icon: data.icon, title: data.title, description: data.description };
      refreshFn = renderAchievements;
      break;
    default:
      btn.textContent = 'Save';
      btn.disabled = false;
      return;
  }

  let error;
  if (editId) {
    ({ error } = await sb.from(table).update(payload).eq('id', editId));
  } else {
    ({ error } = await sb.from(table).insert(payload));
  }

  btn.textContent = 'Save';
  btn.disabled = false;

  if (error) {
    showToast('Save failed: ' + error.message, 'error');
  } else {
    closeModal();
    showToast(editId ? 'Updated successfully!' : 'Added successfully!');
    refreshFn();
    loadStats();
  }
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('admin-toast');
  toast.textContent = (type === 'error' ? '❌ ' : '✅ ') + msg;
  toast.className = 'admin-toast show' + (type === 'error' ? ' error' : '');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Export Data (Download JSON) ──
const EXPORT_TABLE_MAP = {
  publications: 'publications',
  projects: 'research_projects',
  scholars: 'scholars',
  students: 'students',
  courses: 'courses',
  gallery: 'gallery',
  patents: 'patents',
  achievements: 'achievements'
};

function jsonToCsv(dataArray) {
  if (!dataArray.length) return '';
  const headers = Object.keys(dataArray[0]);
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const rows = dataArray.map(row => headers.map(h => escapeCell(row[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

async function exportData(key) {
  const table = EXPORT_TABLE_MAP[key];
  if (!table) return showToast('Unknown data type: ' + key, 'error');

  showToast('Fetching ' + key + '...', 'success');

  const { data, error } = await sb.from(table).select('*');
  if (error) return showToast('Export failed: ' + error.message, 'error');
  if (!data || data.length === 0) return showToast('No data to export for ' + key + '.', 'error');

  const csvStr = jsonToCsv(data);
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = key + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(key + '.csv downloaded successfully!');
}

// ── Start ──
initAuth();
