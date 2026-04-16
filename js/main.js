/* ============================================
   Main JavaScript - Academic Portfolio
   Fetches live data from Supabase backend
   ============================================ */

// ── Supabase client ──
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── DOM Ready ──
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initScrollReveal();
  initTabs();
  initLightbox();

  // Load all sections based on what elements exist on the page
  await Promise.all([
    loadPublications(),
    loadStudents(),
    loadProjects(),
    loadCourses(),
    loadPatents(),
    loadAchievements(),
    loadGallery(),
    loadStats()
  ]);
});

// ── Navigation ──
function initNav() {
  const toggle = document.querySelector('.navbar__toggle');
  const menu = document.querySelector('.navbar__menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      toggle.classList.toggle('active');
    });
    menu.querySelectorAll('.navbar__link').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.classList.remove('active');
      });
    });
  }

  const navbar = document.querySelector('.navbar');
  if (navbar) window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20));

  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) link.classList.add('active');
  });
}

// ── Scroll Reveal ──
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

function observeNew() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

// ── Tabs ──
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      
      // Handle gallery filtering special case
      if (document.getElementById('gallery-grid')) {
        document.querySelectorAll('#gallery-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterGallery(target);
        return;
      }

      // Standard tabs handling (publications)
      const container = btn.closest('.tabs');
      if (container) {
          container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      }
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const el = document.getElementById(target);
      if (el) el.classList.add('active');
    });
  });
}

// ── Publications ──
async function loadPublications() {
  const journalEl = document.getElementById('journal-list');
  const confEl = document.getElementById('conference-list');
  const bookEl = document.getElementById('book-list');
  if (!journalEl && !confEl && !bookEl) return;

  const { data, error } = await sb.from('publications').select('*').order('year', { ascending: false });
  if (error || !data) return;

  const journals = data.filter(p => p.type === 'journal');
  const conferences = data.filter(p => p.type === 'conference');
  const bookChapters = data.filter(p => p.type === 'bookChapter');

  if (journalEl) journalEl.innerHTML = journals.map(p => pubCard(p, 'journal')).join('');
  if (confEl) confEl.innerHTML = conferences.map(p => pubCard(p, 'conference')).join('');
  if (bookEl) bookEl.innerHTML = bookChapters.map(p => pubCard(p, 'book')).join('');
  observeNew();
}

function pubCard(p, type) {
  const venue = type === 'book' ? `${p.venue}${p.publisher ? ', ' + p.publisher : ''}` : p.venue;
  return `<div class="pub-entry reveal visible">
    <div class="pub-entry__title">${p.title}</div>
    <div class="pub-entry__authors">${p.authors}</div>
    <div class="pub-entry__venue">${venue}</div>
    <div style="display:flex;align-items:center;gap:16px;margin-top:6px;">
      <span class="pub-entry__year">${p.year}</span>
      ${p.doi ? `<a href="${p.doi}" target="_blank" class="pub-entry__link">View Paper →</a>` : ''}
    </div>
  </div>`;
}

// ── Students & Scholars ──
async function loadStudents() {
  const scholarsGrid = document.getElementById('scholars-grid');
  const scholarsTable = document.getElementById('scholars-table-body');
  const mtechTable = document.getElementById('mtech-table');
  const btechTable = document.getElementById('btech-table');
  
  if (!scholarsGrid && !scholarsTable && !mtechTable && !btechTable) return;

  const [scholarsRes, studentsRes] = await Promise.all([
    sb.from('scholars').select('*').order('year', { ascending: false }),
    sb.from('students').select('*').order('year', { ascending: false })
  ]);

  if (scholarsRes.data) {
    if (scholarsGrid) {
      scholarsGrid.innerHTML = scholarsRes.data.map(s => `
        <div class="scholar-card reveal visible">
          <div class="scholar-card__name">${s.name}</div>
          <div class="scholar-card__topic">${s.topic}</div>
          <div class="scholar-card__desc">${s.description || ''}</div>
          <div class="scholar-card__meta">
            <span class="status-badge status-badge--${s.status === 'Ongoing' ? 'ongoing' : 'completed'}">${s.status}</span>
            <span class="pub-entry__year">Since ${s.year}</span>
          </div>
        </div>`).join('');
    }
    
    if (scholarsTable) {
      scholarsTable.innerHTML = scholarsRes.data.map(s => `
        <tr>
          <td>${s.name}</td>
          <td>${s.topic}</td>
          <td><span class="status-badge status-badge--${s.status === 'Ongoing' ? 'ongoing' : 'completed'}">${s.status}</span></td>
          <td>${s.year}</td>
        </tr>`).join('');
    }
  }

  if (studentsRes.data) {
    const mtechStudents = studentsRes.data.filter(s => s.type === 'mtech');
    const btechStudents = studentsRes.data.filter(s => s.type === 'btech');
    
    if (mtechTable) mtechTable.innerHTML = mtechStudents.map(s => `<tr><td>${s.name}</td><td>${s.project}</td><td>${s.year || '-'}</td></tr>`).join('');
    if (btechTable) btechTable.innerHTML = btechStudents.map(s => `<tr><td>${s.name}</td><td>${s.project}</td><td>${s.year || '-'}</td></tr>`).join('');
  }
  observeNew();
}

// ── Research Projects ──
async function loadProjects() {
  const projectsGrid = document.getElementById('projects-grid');
  if (!projectsGrid) return;

  const { data } = await sb.from('research_projects').select('*').order('created_at', { ascending: false });
  if (data) {
    projectsGrid.innerHTML = data.map(p => `
      <div class="card reveal visible">
        <div class="card__title">${p.title}</div>
        <div class="card__text">${p.description}</div>
        <span class="card__tag">${p.area}</span>
      </div>`).join('');
    observeNew();
  }
}

// ── Courses ──
async function loadCourses() {
  const coursesContainer = document.getElementById('courses-container');
  if (!coursesContainer) return;

  const { data } = await sb.from('courses').select('*').order('name');
  if (data) {
    coursesContainer.innerHTML = data.map((c, index) => {
      let units = [];
      try { units = JSON.parse(c.material_url || '[]'); } catch(e) {}
      if (!Array.isArray(units)) units = [];

      const unitsHtml = units.length > 0
        ? `<div style="margin-top:16px;">
            <div style="font-weight:600;margin-bottom:8px;font-size:0.95rem;">📚 Study Materials</div>
            ${units.map((u, i) => `
              <a href="${u.url}" target="_blank" download class="form__btn" style="text-decoration:none;display:inline-flex;padding:6px 14px;font-size:0.85rem;margin:4px 4px 4px 0;">
                📥 Unit ${i + 1}
              </a>`).join('')}
          </div>`
        : '';

      return `
      <div class="course-detail-card reveal visible">
        <div class="course-detail-card__header">
          <div class="course-detail-card__icon">${index + 1}</div>
          <div>
            <div class="course-detail-card__title">${c.name}</div>
            <div class="course-detail-card__code">${c.code}</div>
          </div>
        </div>
        <div class="course-detail-card__desc">${c.description || 'No description available for this course.'}</div>
        ${unitsHtml}
      </div>`;
    }).join('');
    observeNew();
  }
}

// ── Patents ──
async function loadPatents() {
  const patentsList = document.getElementById('patents-list');
  if (!patentsList) return;

  const { data } = await sb.from('patents').select('*').order('year', { ascending: false });
  if (data) {
    patentsList.innerHTML = data.map(p => {
      let badgeClass = 'granted';
      if (p.status === 'Filed') badgeClass = 'filed';
      if (p.status === 'Published') badgeClass = 'published';
      
      return `
      <div class="patent-card reveal visible">
        <div class="patent-card__header">
          <div class="patent-card__icon">📜</div>
          <div>
            <div class="patent-card__title">${p.title}</div>
            <div class="patent-card__inventors">${p.inventors}</div>
          </div>
        </div>
        ${p.description ? `<div class="patent-card__desc">${p.description}</div>` : ''}
        <div class="patent-card__meta">
          <span class="patent-card__number">${p.patent_number}</span>
          <span class="status-badge status-badge--${badgeClass}">${p.status}</span>
          <span class="pub-entry__year">${p.year}</span>
        </div>
      </div>`;
    }).join('');
    observeNew();
  }
}

// ── Achievements ──
async function loadAchievements() {
  const achievementsList = document.getElementById('achievements-list');
  if (!achievementsList) return;

  const { data } = await sb.from('achievements').select('*').order('created_at', { ascending: false });
  if (data) {
    achievementsList.innerHTML = data.map(a => `
      <div class="achievement-card reveal visible">
        <div class="achievement-card__icon">${a.icon}</div>
        <div class="achievement-card__content">
          <div class="achievement-card__title">${a.title}</div>
          <div class="achievement-card__desc">${a.description}</div>
        </div>
      </div>`).join('');
    observeNew();
  }
}

// ── Status Stats Update ──
async function loadStats() {
  const statElements = document.querySelectorAll('.counter-value');
  if (!statElements.length) return;

  try {
    const [pubs, projects, scholars, students, journals, conferences, bookChapters] = await Promise.all([
      sb.from('publications').select('id', { count: 'exact', head: true }),
      sb.from('research_projects').select('id', { count: 'exact', head: true }),
      sb.from('scholars').select('id', { count: 'exact', head: true }),
      sb.from('students').select('id', { count: 'exact', head: true }),
      sb.from('publications').select('id', { count: 'exact', head: true }).eq('type', 'journal'),
      sb.from('publications').select('id', { count: 'exact', head: true }).eq('type', 'conference'),
      sb.from('publications').select('id', { count: 'exact', head: true }).eq('type', 'bookChapter')
    ]);

    const statsMap = {
      'Publications': pubs.count || 0,
      'Research Projects': projects.count || 0,
      'PhD Scholars': scholars.count || 0,
      'Students Mentored': students.count || 0,
      'Journal Publications': journals.count || 0,
      'Conference Papers': conferences.count || 0,
      'Book Chapters': bookChapters.count || 0
    };

    statElements.forEach(el => {
      const label = el.nextElementSibling?.textContent;
      if (label && statsMap[label] !== undefined) {
        el.textContent = statsMap[label] + (el.dataset.suffix || '');
      }
    });
  } catch(e) { console.error('Stats error', e); }
}

// ── Gallery ──
let galleryItems = [];

async function loadGallery() {
  const grid = document.getElementById('gallery-grid');
  const tabs = document.getElementById('gallery-tabs');
  if (!grid || !tabs) return;

  const { data } = await sb.from('gallery').select('*').order('created_at', { ascending: false });
  if (!data) return;
  
  galleryItems = data;
  
  // Extract unique categories for tabs
  const categories = ['All', ...new Set(galleryItems.map(item => item.category))];
  
  tabs.innerHTML = categories.map(cat => 
    `<button class="tab-btn ${cat === 'All' ? 'active' : ''}" data-tab="${cat}">${cat}</button>`
  ).join('');
  
  initTabs(); // Re-init tabs for new gallery buttons
  filterGallery('All');
}

function filterGallery(category) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  
  const filtered = category === 'All' ? galleryItems : galleryItems.filter(item => item.category === category);
  
  grid.innerHTML = filtered.map(item => `
    <div class="gallery-item reveal visible" onclick="openLightbox('${item.src}', '${item.caption}')">
      <div class="gallery-item__img-wrapper">
        <img src="${item.src.startsWith('http') ? item.src : '../' + item.src.replace(/^[\/\\]/, '')}" alt="${item.caption}" class="gallery-item__img" onerror="this.src='https://placehold.co/600x400?text=Image+Not+Found'">
      </div>
      <div class="gallery-item__overlay">
        <div class="gallery-item__caption">${item.caption}</div>
        <div class="gallery-item__date">${item.date}</div>
      </div>
    </div>
  `).join('');
  observeNew();
}

// ── Lightbox ──
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightbox-close');
  if (!lightbox || !closeBtn) return;
  
  closeBtn.addEventListener('click', () => {
    lightbox.classList.remove('active');
  });
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('active');
  });
}

window.openLightbox = function(src, caption) {
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');
  
  if (!lightbox || !img || !cap) return;
  
  // Handle relative vs absolute paths
  img.src = src.startsWith('http') ? src : '../' + src.replace(/^[\/\\]/, '');
  cap.textContent = caption;
  lightbox.classList.add('active');
};
