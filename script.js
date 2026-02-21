// ========== script.js ==========
// ALL VANILLA JS, NO INLINE, DEFER LOADS AFTER DOM

// ---------- PRELOADER + GSAP ANIMATIONS ----------
let preloader, ctx;

function initPreloaderAndGSAP() {
  preloader = document.getElementById('preloader');
  if (!preloader) return;

  // disable scroll
  document.body.style.overflow = 'hidden';

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.to(preloader, {
        opacity: 0,
        duration: 0.6,
        onComplete: () => {
          preloader.remove();
          document.body.style.overflow = '';
          document.body.classList.add('loaded');
          // refresh scrolltrigger after preloader
          ScrollTrigger?.refresh();
        }
      });
    }
  });

  tl.from('.preloader-content', {
    opacity: 0,
    scale: 0.9,
    duration: 0.8,
    ease: 'power2.out'
  }).to('.preloader-content', {
    scale: 1.02,
    repeat: 2,
    yoyo: true,
    duration: 0.4,
    ease: 'sine.inOut'
  });
}

// ---------- STORAGE KEYS ----------
const STORAGE_KEY = 'goat_reviews';

// Default dummy reviews (approved & hidden)
const defaultReviews = [
  { id: '1', name: 'Alex Rivera', company: 'Nexus Labs', rating: 5, message: 'Absolutely brilliant execution. They raised our trust factor dramatically.', date: '2025-02-10', status: 'approved' },
  { id: '2', name: 'Jamie Chen', company: 'Ventura Capital', rating: 4, message: 'Premium quality and futuristic design. Our clients love the new platform.', date: '2025-02-12', status: 'approved' },
  { id: '3', name: 'Taylor Smith', company: '', rating: 5, message: 'Best reputation tool we’ve used. Seamless and powerful.', date: '2025-02-14', status: 'approved' },
  { id: '4', name: 'Morgan Lee', company: 'Design Studio', rating: 3, message: 'Very promising but waiting for final approval from partners.', date: '2025-02-01', status: 'hidden' },
];

function loadReviews() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReviews));
    return defaultReviews;
  }
  return JSON.parse(stored);
}

function saveReviews(reviews) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

// ---------- RATING SUMMARY ----------
function updateRatingSummary() {
  const reviews = loadReviews();
  const approved = reviews.filter(r => r.status === 'approved');
  const avg = approved.length ? (approved.reduce((acc, r) => acc + r.rating, 0) / approved.length).toFixed(1) : '0.0';
  const total = approved.length;

  document.querySelectorAll('.avg-rating').forEach(el => el.textContent = avg);
  document.querySelectorAll('.total-reviews-count').forEach(el => el.textContent = total);
}

// ---------- RENDER REVIEWS (public) ----------
function renderPublicReviews() {
  const container = document.getElementById('public-review-grid');
  if (!container) return;
  const reviews = loadReviews().filter(r => r.status === 'approved');

  container.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-bold">${r.name}</h3>
          ${r.company ? `<p class="text-gray-400 text-sm">${r.company}</p>` : ''}
        </div>
        <span class="text-xs text-gray-500">${r.date}</span>
      </div>
      <div class="flex gap-1 mb-4">
        ${Array.from({ length: 5 }, (_, i) => `
          <span class="text-2xl ${i < r.rating ? 'star-filled' : 'star-empty'}">★</span>
        `).join('')}
      </div>
      <p class="text-gray-300">${r.message}</p>
    </div>
  `).join('');
}

// ---------- ADMIN RENDER (with filters) ----------
let currentFilter = 'all';
function renderAdminReviews() {
  const tbody = document.getElementById('admin-reviews-body');
  if (!tbody) return;
  const all = loadReviews();
  const filtered = currentFilter === 'all' ? all : all.filter(r => r.status === currentFilter);

  tbody.innerHTML = filtered.map(r => `
    <tr class="border-b border-gray-800" data-id="${r.id}">
      <td class="py-4 px-2">${r.name}</td>
      <td class="py-4 px-2">${r.company || '-'}</td>
      <td class="py-4 px-2">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
      <td class="py-4 px-2 max-w-xs truncate">${r.message.substring(0,30)}…</td>
      <td class="py-4 px-2">${r.date}</td>
      <td class="py-4 px-2">
        <span class="px-3 py-1 rounded-full text-xs ${r.status === 'approved' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'}">${r.status}</span>
      </td>
      <td class="py-4 px-2">
        <div class="flex items-center gap-2">
          <div class="toggle-switch ${r.status === 'approved' ? 'active' : ''}" data-id="${r.id}"></div>
          <button class="edit-btn text-blue-400 hover:underline" data-id="${r.id}">Edit</button>
          <button class="delete-btn text-red-400 hover:underline" data-id="${r.id}">Del</button>
        </div>
      </td>
    </tr>
  `).join('');

  // attach toggle events
  document.querySelectorAll('.toggle-switch').forEach(sw => {
    sw.addEventListener('click', (e) => {
      const id = sw.dataset.id;
      let reviews = loadReviews();
      const idx = reviews.findIndex(x => x.id === id);
      if (idx !== -1) {
        reviews[idx].status = reviews[idx].status === 'approved' ? 'hidden' : 'approved';
        saveReviews(reviews);
        renderAdminReviews();
        updateRatingSummary();
      }
    });
  });

  // delete buttons (show modal)
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      openDeleteModal(id);
    });
  });

  // edit buttons (simplified prompt in demo, but you can expand)
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      const reviews = loadReviews();
      const rev = reviews.find(r => r.id === id);
      if (!rev) return;
      const newMsg = prompt('Edit review message:', rev.message);
      if (newMsg !== null) {
        rev.message = newMsg;
        saveReviews(reviews);
        renderAdminReviews();
      }
    });
  });
}

// delete modal
function openDeleteModal(id) {
  const modal = document.getElementById('deleteModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.getElementById('confirmDelete').onclick = () => {
    let reviews = loadReviews().filter(r => r.id !== id);
    saveReviews(reviews);
    modal.classList.add('hidden');
    renderAdminReviews();
    updateRatingSummary();
    if (window.location.pathname.includes('index')) renderPublicReviews();
  };
  document.getElementById('cancelDelete').onclick = () => modal.classList.add('hidden');
}

// ---------- FILTER BUTTONS ----------
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderAdminReviews();
    });
  });
}

// ---------- SUBMIT REVIEW ----------
function initSubmitReview() {
  const form = document.getElementById('submitReviewForm');
  if (!form) return;

  // star rating
  let currentRating = 0;
  const stars = document.querySelectorAll('.star-rating span');
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      currentRating = index + 1;
      stars.forEach((s, i) => {
        s.classList.toggle('star-filled', i < currentRating);
        s.classList.toggle('star-empty', i >= currentRating);
      });
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name')?.value.trim();
    const company = document.getElementById('company')?.value.trim() || '';
    const message = document.getElementById('message')?.value.trim();
    if (!name || !message || currentRating === 0) {
      alert('Please fill all required fields and rating');
      return;
    }

    const newReview = {
      id: Date.now().toString(),
      name,
      company,
      rating: currentRating,
      message,
      date: new Date().toISOString().slice(0,10),
      status: 'hidden',
    };
    const reviews = loadReviews();
    reviews.push(newReview);
    saveReviews(reviews);
    // success animation + reset
    gsap.to(form, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 });
    form.reset();
    stars.forEach(s => s.classList.add('star-empty'));
    currentRating = 0;
    alert('Review submitted! Awaiting admin approval.');
  });
}

// ---------- ADMIN LOGIN ----------
function initAdminLogin() {
  const form = document.getElementById('adminLoginForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username')?.value;
    const pass = document.getElementById('password')?.value;
    // demo credentials: admin / admin
    if (user === 'admin' && pass === 'hannanabdul') {
      gsap.to(form, { boxShadow: '0 0 40px #0326fc', duration: 0.3 });
      setTimeout(() => { window.location.href = 'admin-dashboard.html'; }, 400);
    } else {
      alert('Invalid credentials (admin/admin)');
    }
  });
}

// ---------- MOBILE MENU + CURSOR ----------
function initMobileMenu() {
  const burger = document.getElementById('hamburger');
  const nav = document.getElementById('mobileNav');
  if (!burger || !nav) return;
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

function initCursor() {
  const cursor = document.createElement('div');
  cursor.classList.add('custom-cursor');
  document.body.appendChild(cursor);
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
}

// ---------- PAGE TRANSITIONS FADE ----------
function fadeInPage() {
  document.body.style.opacity = 0;
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.3s';
    document.body.style.opacity = 1;
  }, 20);
}

// ---------- INIT ON LOAD ----------
window.addEventListener('DOMContentLoaded', () => {
  initPreloaderAndGSAP();
  initCursor();
  fadeInPage();

  // common render
  updateRatingSummary();
  renderPublicReviews();

  // admin-only
  if (document.getElementById('admin-reviews-body')) {
    renderAdminReviews();
    initFilters();
  }

  // submit page
  initSubmitReview();

  // admin login
  initAdminLogin();

  // mobile menu
  initMobileMenu();

  // global smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ScrollTrigger refresh after fonts etc
  setTimeout(() => ScrollTrigger?.refresh(), 500);
});

// expose for modals
window.closeModal = function() {
  document.getElementById('deleteModal')?.classList.add('hidden');
};