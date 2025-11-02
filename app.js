     // --- SDK IMPORTS ---
            import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
            import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
            import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
            import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

            // =========================================================================
            // !! ‫مفتاح API - يجب تعيينه من متغيرات البيئة !!
            // =========================================================================
            // احصل على المفتاح من: https://aistudio.google.com/apikey
            const GEMINI_API_KEY = "AIzaSyCaev1GHwaZ7EqoxIyvRmgLehWs6Hq1gDw";
            // =========================================================================

            // --- FIREBASE CONFIG ---
            const firebaseConfig = typeof __firebase_config !== 'undefined'
                ? JSON.parse(__firebase_config)
                : {
                    apiKey: "AIzaSyBi2y64T-X1FNwbhv8ATQnF5xTZ3Pq4neg",
                    authDomain: "tibrasoul.firebaseapp.com",
                    projectId: "tibrasoul",
                    storageBucket: "tibrasoul.appspot.com",
                    messagingSenderId: "920755760709",
                    appId: "1:920755760709:web:778cd12e6edbd199827d2c"
                };

            // ⚠️ Dead code removed - duplicate renderCatalog (moved to initQuizzes)

            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

            // --- FIREBASE INITIALIZATION ---
            const app = initializeApp(firebaseConfig);
            const storage = getStorage(app);
            const auth = getAuth(app);
            const db = getFirestore(app);
            const provider = new GoogleAuthProvider();

            // --- GLOBAL STATE ---
            let currentUser = null;
            let wheelChart;
            let journalChart;

            // --- GLOBAL HELPERS (used by multiple modules incl. Blog) ---
            const catLabel = (c) => c === 'nutrition' ? 'تغذية' : c === 'mind' ? 'تنفس وذهن' : 'مكملات';
            const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const readingTime = (html) => {
                const words = stripHtml(html).split(' ').filter(Boolean).length;
                const mins = Math.max(1, Math.round(words / 180));
                return `${mins} دقيقة قراءة`;
            };
            const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
            function hexToRgba(hex, alpha = 1) {
                try {
                    if (!hex) return `rgba(0,0,0,${alpha})`;
                    let c = hex.trim();
                    if (c.startsWith('rgb')) return c; // already rgb/rgba
                    if (c[0] === '#') c = c.substring(1);
                    if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
                    const num = parseInt(c, 16);
                    const r = (num >> 16) & 255;
                    const g = (num >> 8) & 255;
                    const b = num & 255;
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                } catch { return `rgba(0,0,0,${alpha})`; }
            }

            // Re-apply palette on existing charts (for theme toggle)
            function refreshChartsTheme() {
                try {
                    // Wheel of Life
                    if (window.Chart && window.wheelChart) {
                        const ACCENT = cssVar('--accent-color') || '#2DD4BF';
                        const PRIMARY = cssVar('--primary-color') || '#1F6FEB';
                        const PRIMARY_DARK = cssVar('--primary-dark') || '#0F4CA8';
                        const TEXT = cssVar('--text-dark') || '#222';
                        const ds = window.wheelChart.data.datasets?.[0];
                        if (ds) {
                            ds.backgroundColor = hexToRgba(ACCENT, 0.35);
                            ds.borderColor = PRIMARY;
                            ds.pointBackgroundColor = PRIMARY;
                            ds.pointHoverBorderColor = PRIMARY;
                        }
                        if (window.wheelChart.options?.scales?.r) {
                            window.wheelChart.options.scales.r.angleLines.color = hexToRgba(PRIMARY_DARK, 0.25);
                            window.wheelChart.options.scales.r.grid.color = hexToRgba(PRIMARY_DARK, 0.25);
                            window.wheelChart.options.scales.r.pointLabels.color = TEXT;
                        }
                        window.wheelChart.update('none');
                    }
                    // Journal chart
                    if (window.Chart && window.journalChart) {
                        const PRIMARY = cssVar('--primary-color') || '#1F6FEB';
                        const ACCENT = cssVar('--accent-color') || '#2DD4BF';
                        const ds0 = window.journalChart.data.datasets?.[0];
                        const ds1 = window.journalChart.data.datasets?.[1];
                        if (ds0) {
                            ds0.borderColor = PRIMARY;
                            ds0.backgroundColor = hexToRgba(PRIMARY, 0.2);
                        }
                        if (ds1) {
                            ds1.borderColor = ACCENT;
                            ds1.backgroundColor = hexToRgba(ACCENT, 0.2);
                        }
                        window.journalChart.update('none');
                    }
                } catch { }
            }

            // --- APP INITIALIZATION ---
            document.addEventListener('DOMContentLoaded', () => {
                const safe = (fn, name) => { try { typeof fn === 'function' && fn(); } catch (e) { console.error('Init error:', name, e); } };
                safe(initTheme, 'initTheme');
                safe(initAuth, 'initAuth');
                safe(initSmartTools, 'initSmartTools');
                safe(initFrequencyGenerator, 'initFrequencyGenerator');
                safe(initGeneralUI, 'initGeneralUI');
                safe(initNavigation, 'initNavigation');
                safe(initCreativeEffects, 'initCreativeEffects');
                safe(initBlog, 'initBlog');
                safe(initWheelOfLife, 'initWheelOfLife');
                safe(initAudioPlayer, 'initAudioPlayer');
                safe(initBodyMap, 'initBodyMap');
                safe(initQuizzes, 'initQuizzes');
                safe(initJournal, 'initJournal');
                safe(initChronicCare, 'initChronicCare');
                safe(initChronicTracking, 'initChronicTracking');
                safe(initMedicalTravel, 'initMedicalTravel');
                safe(initSecondOpinion, 'initSecondOpinion');
                // Skip these for now - will be initialized after all scripts load
                // safe(initProductEnhancements, 'initProductEnhancements');
                // safe(initWellnessReport, 'initWellnessReport');
                
                // ⚠️ تم حذف showView('hero') لتجنب الـ flash - Hero مرئي افتراضياً
                // Set initial view state without triggering animations
                currentViewId = 'hero';
                document.title = 'الصفحة الرئيسية | د. عمر العماد';
                updateBottomTabActive('hero');
                updateTopNavActive('hero');
                updateMobileNavActive('hero');
                
                // تطبيق is-visible على أي عناصر fade-in-up في hero و featured-services
                const heroView = document.getElementById('view-hero');
                const featView = document.getElementById('featured-services');
                if (heroView) {
                    heroView.querySelectorAll('.fade-in-up').forEach(el => el.classList.add('is-visible'));
                }
                if (featView) {
                    featView.querySelectorAll('.fade-in-up').forEach(el => el.classList.add('is-visible'));
                }

                // Marketing landing: always show hero on first load (ignore deep links initially)
                const honorDeepLinkOnLoad = false; // set true only if you want to jump to hash view on first load
                const hashParams = parseHashParams();
                if (honorDeepLinkOnLoad && hashParams.view && hashParams.view !== 'hero') {
                    // Small delay to ensure hero loads first, then jump (disabled by default)
                    setTimeout(() => {
                        showView(hashParams.view);
                        if (hashParams.view === 'chronic-care') {
                            const targetView = document.getElementById('view-chronic-care');
                            if (targetView) {
                                const tab = hashParams.tab || 'articles';
                                targetView.querySelector(`.tab-btn[data-tab="${tab}"]`)?.click();
                                if (hashParams.disease) {
                                    targetView.querySelector(`#chronic-articles-nav [data-disease="${hashParams.disease}"]`)?.click();
                                }
                            }
                        }
                        if (hashParams.view === 'quizzes') {
                            // Apply category and open a quiz if provided
                            if (hashParams.cat) {
                                document.querySelector(`#quiz-cat-control .quiz-cat-btn[data-cat="${hashParams.cat}"]`)?.click();
                            }
                            if (hashParams.quiz) {
                                setTimeout(() => { try { window.__startQuiz?.(hashParams.quiz); } catch { } }, 80);
                            }
                        }
                    }, 100);
                }
                // React to manual hash changes
                window.addEventListener('hashchange', () => {
                    const p = parseHashParams();
                    if (p.view) {
                        showView(p.view);
                        if (p.view === 'chronic-care') {
                            const targetView = document.getElementById('view-chronic-care');
                            if (targetView) {
                                const tab = p.tab || 'articles';
                                targetView.querySelector(`.tab-btn[data-tab="${tab}"]`)?.click();
                                if (p.disease) {
                                    targetView.querySelector(`#chronic-articles-nav [data-disease="${p.disease}"]`)?.click();
                                }
                            }
                        }
                        if (p.view === 'quizzes') {
                            if (p.cat) {
                                document.querySelector(`#quiz-cat-control .quiz-cat-btn[data-cat="${p.cat}"]`)?.click();
                            }
                            if (p.quiz) {
                                // Avoid double-start when hash was set inside startQuiz
                                if (window.__quizNavigating) { window.__quizNavigating = false; }
                                else setTimeout(() => { try { window.__startQuiz?.(p.quiz); } catch { } }, 80);
                            }
                        }
                    }
                });
            });

            // --- URL HASH PARSER ---
            function parseHashParams() {
                const hash = (location.hash || '').replace(/^#/, '');
                const params = {};
                if (!hash) return params;
                hash.split('&').forEach(pair => {
                    if (!pair) return;
                    const [k, v] = pair.split('=');
                    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
                });
                return params;
            }

            // --- THEME TOGGLE (LIGHT/DARK) - ENHANCED ---
            function initTheme() {
                const root = document.documentElement;
                const btn = document.getElementById('theme-toggle');
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                let mode = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
                
                const apply = (m, showNotif = false) => {
                    root.setAttribute('data-theme', m === 'dark' ? 'dark' : 'light');
                    localStorage.setItem('theme', m);
                    
                    const icon = btn?.querySelector('i');
                    if (icon) {
                        // Add smooth rotation animation
                        icon.style.transition = 'transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                        icon.style.transform = 'rotate(360deg) scale(1.2)';
                        
                        setTimeout(() => {
                            icon.classList.toggle('fa-moon', m !== 'dark');
                            icon.classList.toggle('fa-sun', m === 'dark');
                            icon.style.transform = 'rotate(360deg) scale(1)';
                        }, 250);
                        
                        setTimeout(() => {
                            icon.style.transform = '';
                        }, 500);
                    }
                    
                    // Add page transition effect
                    root.style.transition = 'background-color 0.4s ease, color 0.4s ease';
                    
                    // Update browser UI theme color for better integration
                    try {
                        const meta = document.querySelector('meta[name="theme-color"]');
                        if (meta) meta.setAttribute('content', m === 'dark' ? '#0B1220' : '#F7FAFC');
                    } catch { }
                    
                    // Refresh charts if they exist
                    try { refreshChartsTheme(); } catch { }
                    
                    // Show notification
                    if (showNotif && typeof showNotification === 'function') {
                        const msg = m === 'dark' ? '🌙 تم التبديل إلى الوضع الليلي' : '☀️ تم التبديل إلى الوضع النهاري';
                        showNotification(msg, 'success');
                    }
                };
                
                // Apply initial theme
                apply(mode);
                
                // Add click handler with enhanced effects
                btn?.addEventListener('click', () => {
                    mode = (localStorage.getItem('theme') || 'light') === 'dark' ? 'light' : 'dark';
                    apply(mode, true);
                    
                    // Track event if analytics available
                    if (typeof trackEvent === 'function') {
                        trackEvent('theme_toggle', { theme: mode });
                    }
                });
            }

            // --- DYNAMIC SCRIPT LOADER & LIB ENSURERS ---
            const loadedScripts = new Set();
            function loadScript(src, type = 'text/javascript') {
                return new Promise((resolve, reject) => {
                    if (loadedScripts.has(src)) return resolve();
                    const s = document.createElement('script');
                    s.src = src;
                    s.async = true;
                    if (type) s.type = type;
                    s.onload = () => { loadedScripts.add(src); resolve(); };
                    s.onerror = () => reject(new Error('Failed to load ' + src));
                    document.head.appendChild(s);
                });
            }
            async function ensureChart() {
                if (window.Chart) return;
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js');
            }
            async function ensureTone() {
                if (window.Tone) return;
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js');
            }

            // --- iOS-like NAV/UI HELPERS ---
            let currentViewId = 'hero';
            let activeLargeTitleEl = null;
            function updateBottomTabActive(viewId) {
                const items = document.querySelectorAll('#bottom-tabbar .tab-item');
                items.forEach(it => {
                    const isActive = it.dataset.view === viewId;
                    it.classList.toggle('active', isActive);
                    it.setAttribute('aria-current', isActive ? 'page' : 'false');
                });
            }
            function updateTopNavActive(viewId) {
                document.querySelectorAll('header .nav-link[data-view]').forEach(link => {
                    const active = link.dataset.view === viewId;
                    link.classList.toggle('is-active', active);
                    link.setAttribute('aria-current', active ? 'page' : 'false');
                });
            }
            // Highlight first missing field in inset-grouped forms
            function highlightFirstMissing(ids) {
                for (const id of ids) {
                    const el = document.getElementById(id);
                    if (!el) continue;
                    const val = (el.value || '').toString().trim();
                    if (!val) {
                        const cell = el.closest('.inset-cell');
                        if (cell) {
                            cell.classList.add('error');
                            setTimeout(() => cell.classList.remove('error'), 2500);
                        }
                        el.focus();
                        try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { }
                        break;
                    }
                }
            }

            // ⚠️ Dead code removed - duplicate renderCatalog #2
            function updateLargeTitleCompact() {
                if (!activeLargeTitleEl) return;
                const targetView = document.getElementById('view-' + currentViewId);
                if (!targetView) return;
                const sectionTop = targetView.offsetTop || 0;
                const scrolled = window.scrollY - sectionTop;
                const compact = scrolled > 60;
                activeLargeTitleEl.classList.toggle('compact', compact);
                const sub = document.getElementById('view-subheader');
                if (sub) {
                    if (compact) {
                        const t = sub.querySelector('.title');
                        if (t) t.textContent = (activeLargeTitleEl.textContent || '').trim();
                        sub.style.display = 'block';
                    } else {
                        sub.style.display = 'none';
                    }
                }
            }
            // Reading progress for single post
            function updatePostProgress() {
                const bar = document.getElementById('post-progress');
                const inner = document.getElementById('post-progress-inner');
                const view = document.getElementById('view-single-post');
                if (!bar || !inner || !view) return;
                const isVisible = !view.classList.contains('hidden');
                bar.classList.toggle('hidden', !isVisible);
                if (!isVisible) return;
                const article = view.querySelector('article') || view;
                const start = (article.offsetTop || 0) - 100;
                const end = start + article.scrollHeight - window.innerHeight;
                const denom = Math.max(1, end - start);
                const p = Math.min(1, Math.max(0, (window.scrollY - start) / denom));
                inner.style.width = `${p * 100}%`;
            }
            window.addEventListener('scroll', updateLargeTitleCompact, { passive: true });
            window.addEventListener('scroll', updatePostProgress, { passive: true });

            // --- NAVIGATION MODULE ---
            function initNavigation() {
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const viewName = link.dataset.view;
                        if (viewName) {
                            document.getElementById('mobile-menu').classList.add('hidden');
                            // Update hash for deep-linking
                            location.hash = `view=${encodeURIComponent(viewName)}`;
                            showView(viewName);
                        }
                    });
                });
                
                // Initialize Mobile Bottom Navigation
                initMobileBottomNav();
            }
            
            // --- MOBILE BOTTOM NAVIGATION ---
            function initMobileBottomNav() {
                const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
                
                mobileNavItems.forEach(item => {
                    item.addEventListener('click', (e) => {
                        const viewName = item.dataset.view;
                        if (viewName) {
                            e.preventDefault();
                            
                            // Update active state
                            mobileNavItems.forEach(i => i.classList.remove('active'));
                            item.classList.add('active');
                            
                            // Navigate
                            location.hash = `view=${encodeURIComponent(viewName)}`;
                            showView(viewName);
                        }
                    });
                });
            }
            
            // Update mobile nav active state
            function updateMobileNavActive(viewId) {
                const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
                mobileNavItems.forEach(item => {
                    if (item.dataset.view === viewId) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }

            function showView(viewId) {
                document.querySelectorAll('.page-view').forEach(view => {
                    view.classList.add('hidden');
                });
                const targetView = document.getElementById('view-' + viewId);
                if (targetView) {
                    // Update document title by view
                    const titles = {
                        'hero': 'الصفحة الرئيسية',
                        'dashboard': 'لوحة التحكم',
                        'chronic-care': 'مركز الأمراض المزمنة',
                        'medical-travel': 'السفر الطبي',
                        'second-opinion': 'الرأي الطبي الثاني',
                        'wheel-of-life': 'عجلة العافية',
                        'body-map': 'خريطة الجسد',
                        'quizzes': 'التقييمات الصحية',
                        'journal': 'مفكرة الأعراض',
                        'services': 'الجلسات',
                        'store': 'المتجر',
                        'about': 'عن الدكتور ',
                        'blog': 'المدونة',
                        'premium-content': 'ملف العميل',
                        'frequencies': 'الموجات',
                        'faq': 'الأسئلة الشائعة',
                        'wellness-report': 'تقرير العافية المجاني',
                        'courses-hub': 'الدورات التعليمية',
                        'course-awareness': 'دورة تنظيف المعتقدات والمشاعر',
                        'course-exercise': 'دورة رياضة الشفاء المخصصة',
                        'course-nutrition': 'دورة التغذية العلاجية',
                        'course-therapies': 'دورة الأدوية والمكملات',
                        'ebook': 'كتاب كن أنت الطبيب',
                        'subscribe': 'خطط الاشتراك',
                        'nutrition-tool': 'مولد الخطة الغذائية'
                    };
                    document.title = `${titles[viewId] || 'Ṭibrah'} | د. عمر العماد`;
                    // Special case: when showing hero, also show featured services section below it
                    const feat = document.getElementById('featured-services');
                    if (viewId === 'hero') {
                        if (feat) feat.classList.remove('hidden');
                    } else {
                        if (feat) feat.classList.add('hidden');
                    }
                    // Chronic Care: apply tab/disease from hash if present, else default to articles
                    if (viewId === 'chronic-care') {
                        const p = parseHashParams();
                        const tab = p.tab || 'articles';
                        targetView.querySelector(`.tab-btn[data-tab="${tab}"]`)?.click();
                        if (p.disease) {
                            targetView.querySelector(`#chronic-articles-nav [data-disease="${p.disease}"]`)?.click();
                        }
                    }
                    // Body Map: honor sex/mode/organ from URL hash on navigation
                    if (viewId === 'body-map') {
                        const p = parseHashParams();
                        if (window.BodyMap) {
                            if (p.sex) try { window.BodyMap.applySex(p.sex); } catch { }
                            if (p.mode) try { window.BodyMap.switchMode(p.mode); } catch { }
                            if (p.organ) try { window.BodyMap.selectOrgan(p.organ); } catch { }
                        }
                    }
                    // Quizzes: ensure dynamic catalog is rendered on navigation
                    if (viewId === 'quizzes') {
                        try { window.__renderQuizzes?.(); } catch { }
                    }
                    // Frequencies: initialize player and controls
                    if (viewId === 'frequencies') {
                        try { 
                            if (typeof initFrequencyGenerator === 'function') {
                                initFrequencyGenerator(); 
                            }
                        } catch (e) {
                            console.error('Failed to init frequency generator:', e);
                        }
                    }
                    // Update bottom tab active state
                    updateBottomTabActive(viewId);
                    // Update top nav active state
                    updateTopNavActive(viewId);
                    // Update mobile bottom nav active state
                    updateMobileNavActive(viewId);
                    // Large Title setup
                    currentViewId = viewId;
                    activeLargeTitleEl = targetView.querySelector('.large-title');
                    if (activeLargeTitleEl) {
                        activeLargeTitleEl.classList.remove('compact');
                        activeLargeTitleEl.setAttribute('tabindex', '-1');
                        setTimeout(() => {
                            updateLargeTitleCompact();
                            try { activeLargeTitleEl.focus({ preventScroll: true }); } catch { activeLargeTitleEl.focus(); }
                        }, 50);
                    }
                    targetView.classList.remove('hidden');
                    // Smoothly scroll to the revealed view so the user sees the change
                    targetView.scrollIntoView({ behavior: 'smooth' });

                    const elementsToAnimate = targetView.querySelectorAll('.fade-in-up');
                    elementsToAnimate.forEach(el => el.classList.remove('is-visible'));
                    setTimeout(() => {
                        elementsToAnimate.forEach(el => {
                            el.classList.add('is-visible');
                        });
                    }, 100);
                }
            }

            // --- NOTIFICATION MODULE ---
            const notificationToast = document.getElementById('notification-toast');
            const notificationMessage = document.getElementById('notification-message');
            let notificationTimeout;
            function showNotification(message, type = 'error', duration = 4000) {
                if (notificationTimeout) clearTimeout(notificationTimeout);
                notificationMessage.textContent = message;
                notificationToast.className = 'fixed top-20 right-5 py-3 px-6 rounded-lg shadow-xl z-[150] transition-all duration-500 transform text-white';
                if (type === 'success') {
                    notificationToast.classList.add('bg-green-500');
                } else if (type === 'warning') {
                    notificationToast.classList.add('bg-yellow-500');
                } else {
                    notificationToast.classList.add('bg-red-600');
                }
                notificationToast.classList.remove('hidden');
                notificationToast.classList.add('translate-x-full');
                setTimeout(() => {
                    notificationToast.classList.remove('translate-x-full');
                }, 10);
                notificationTimeout = setTimeout(() => {
                    notificationToast.classList.add('translate-x-full');
                    setTimeout(() => notificationToast.classList.add('hidden'), 500);
                }, duration);
            }
            
            // --- MOBILE BOTTOM SHEET MODULE ---
            function initBottomSheet() {
                const sheet = document.getElementById('body-map-sheet');
                const overlay = document.getElementById('body-map-sheet-overlay');
                const closeBtn = document.getElementById('sheet-close');
                const handle = document.getElementById('sheet-handle');
                const content = document.getElementById('sheet-content');
                const title = document.getElementById('sheet-title');
                
                let startY = 0;
                let currentY = 0;
                let isDragging = false;
                
                // Open sheet
                window.openBodyMapSheet = function(organName, organDetails) {
                    if (window.innerWidth > 768) return; // Desktop: use sidebar instead
                    
                    title.textContent = organName;
                    content.innerHTML = organDetails;
                    
                    overlay.classList.add('active');
                    sheet.classList.add('active');
                    document.body.style.overflow = 'hidden';
                };
                
                // Close sheet
                function closeSheet() {
                    overlay.classList.remove('active');
                    sheet.classList.remove('active');
                    document.body.style.overflow = '';
                }
                
                // Event listeners
                closeBtn?.addEventListener('click', closeSheet);
                overlay?.addEventListener('click', closeSheet);
                
                // Drag to close
                handle?.addEventListener('touchstart', (e) => {
                    isDragging = true;
                    startY = e.touches[0].clientY;
                });
                
                handle?.addEventListener('touchmove', (e) => {
                    if (!isDragging) return;
                    currentY = e.touches[0].clientY - startY;
                    if (currentY > 0) {
                        sheet.style.transform = `translateY(${currentY}px)`;
                    }
                });
                
                handle?.addEventListener('touchend', () => {
                    isDragging = false;
                    if (currentY > 100) {
                        closeSheet();
                    }
                    sheet.style.transform = '';
                    currentY = 0;
                });
            }
            
            // --- PINCH-TO-ZOOM FOR BODY MAP ---
            function initBodyMapZoom() {
                const container = document.getElementById('body-map-svg-container');
                const svg = document.getElementById('body-map-svg');
                const indicator = document.createElement('div');
                indicator.className = 'zoom-indicator';
                indicator.textContent = '100%';
                
                if (!container || !svg || window.innerWidth > 768) return;
                
                container.appendChild(indicator);
                container.style.touchAction = 'none';
                container.style.overflow = 'hidden';
                
                let scale = 1;
                let posX = 0;
                let posY = 0;
                let startDistance = 0;
                let isPinching = false;
                let startPosX = 0;
                let startPosY = 0;
                let isDragging = false;
                
                function updateTransform() {
                    svg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
                    svg.style.transformOrigin = 'center center';
                    indicator.textContent = Math.round(scale * 100) + '%';
                    indicator.classList.add('active');
                    setTimeout(() => indicator.classList.remove('active'), 1500);
                }
                
                function getDistance(touches) {
                    const dx = touches[0].clientX - touches[1].clientX;
                    const dy = touches[0].clientY - touches[1].clientY;
                    return Math.sqrt(dx * dx + dy * dy);
                }
                
                container.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 2) {
                        isPinching = true;
                        startDistance = getDistance(e.touches);
                    } else if (e.touches.length === 1 && scale > 1) {
                        isDragging = true;
                        startPosX = e.touches[0].clientX - posX;
                        startPosY = e.touches[0].clientY - posY;
                    }
                });
                
                container.addEventListener('touchmove', (e) => {
                    if (isPinching && e.touches.length === 2) {
                        e.preventDefault();
                        const distance = getDistance(e.touches);
                        const delta = distance / startDistance;
                        scale = Math.min(Math.max(1, scale * delta), 3);
                        startDistance = distance;
                        updateTransform();
                    } else if (isDragging && e.touches.length === 1) {
                        e.preventDefault();
                        posX = e.touches[0].clientX - startPosX;
                        posY = e.touches[0].clientY - startPosY;
                        updateTransform();
                    }
                });
                
                container.addEventListener('touchend', (e) => {
                    if (e.touches.length < 2) {
                        isPinching = false;
                    }
                    if (e.touches.length === 0) {
                        isDragging = false;
                        if (scale === 1) {
                            posX = 0;
                            posY = 0;
                            updateTransform();
                        }
                    }
                });
                
                // Double tap to reset
                let lastTap = 0;
                container.addEventListener('touchend', (e) => {
                    const currentTime = new Date().getTime();
                    const tapLength = currentTime - lastTap;
                    if (tapLength < 300 && tapLength > 0) {
                        scale = 1;
                        posX = 0;
                        posY = 0;
                        updateTransform();
                    }
                    lastTap = currentTime;
                });
            }
            
            // Initialize mobile features
            if (window.innerWidth <= 768) {
                initBottomSheet();
                setTimeout(() => initBodyMapZoom(), 1000);
            }

            // --- AUTHENTICATION MODULE ---
            function initAuth() {
                const loginBtns = [
                    document.getElementById('login-btn'),
                    document.getElementById('login-btn-mobile'),
                    document.getElementById('login-for-journal-btn')
                ];

                onAuthStateChanged(auth, user => {
                    currentUser = user;
                    const isLoggedIn = !!user;

                    document.getElementById('login-btn').classList.toggle('hidden', isLoggedIn);
                    document.getElementById('login-btn-mobile').classList.toggle('hidden', isLoggedIn);
                    document.getElementById('profile-section-nav').classList.toggle('hidden', !isLoggedIn);
                    document.getElementById('profile-section-nav').classList.toggle('flex', isLoggedIn);
                    document.getElementById('profile-link-mobile').classList.toggle('hidden', !isLoggedIn);

                    if (isLoggedIn) {
                        document.getElementById('user-avatar').src = user.photoURL || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM1YTZlNWEiLz4KPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSI+VTwvdGV4dD4KPC9zdmc+Cg==';
                        document.getElementById('welcome-message').textContent = `مرحباً بك في أسرتنا، ${user.displayName || 'صديقي'}`;
                        loadPatientFileData();
                        toggleJournalView(true);
                        loadJournalEntries();
                    } else {
                        document.getElementById('saved-results-container').innerHTML = '<p>الرجاء تسجيل الدخول لعرض سجلاتك المحفوظة.</p>';
                        toggleJournalView(false);
                    }
                });

                const handleLogin = () => {
                    signInWithPopup(auth, provider).catch(error => {
                        console.error("Google Login Error:", error);
                        showNotification("فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.", "error");
                    });
                }
                loginBtns.forEach(btn => {
                    if (btn) btn.addEventListener('click', handleLogin)
                });
            }

            // --- FIRESTORE MODULE ---
            async function saveResultToFirestore(toolName, resultData, meta) {
                if (!currentUser) {
                    showNotification('الرجاء تسجيل الدخول لحفظ نتائجك.', 'warning');
                    return;
                }
                const resultId = `${toolName.replace(/\s+/g, '-')}-${new Date().getTime()}`;
                const resultRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'toolResults', resultId);

                try {
                    await setDoc(resultRef, {
                        tool: toolName,
                        data: resultData,
                        meta: meta || null,
                        createdAt: new Date()
                    });
                    const saveBtn = document.getElementById('save-result-btn') || document.getElementById('save-wheel-result-btn');
                    if (saveBtn) {
                        saveBtn.textContent = 'تم الحفظ بنجاح!';
                        saveBtn.disabled = true;
                    }
                    showNotification('تم حفظ النتيجة بنجاح في ملفك!', 'success');
                    loadPatientFileData();
                } catch (error) {
                    console.error("Error saving document: ", error);
                    showNotification('حدث خطأ أثناء حفظ النتيجة.', 'error');
                }
            }

            async function loadPatientFileData() {
                if (!currentUser) return;
                const container = document.getElementById('saved-results-container');
                container.innerHTML = '<p>جاري تحميل سجلاتك...</p>';
                try {
                    const resultsCol = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'toolResults');
                    const q = query(resultsCol, limit(50));
                    const querySnapshot = await getDocs(q);

                    if (querySnapshot.empty) {
                        container.innerHTML = '<p>لا توجد نتائج محفوظة بعد. استخدم إحدى الأدوات الذكية واحفظ النتيجة لتظهر هنا.</p>';
                        return;
                    }

                    const results = [];
                    querySnapshot.forEach(doc => {
                        results.push(doc.data());
                    });

                    results.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());

                    let html = '';
                    results.forEach(result => {
                        const canOpen = result.meta && result.meta.id;
                        html += `
                        <div class="p-4 bg-gray-50 border-r-4 border-gray-300 rounded-md">
                            <h4 class="font-bold text-lg">${result.tool}</h4>
                            <p class="text-sm text-gray-500 mb-2">تاريخ الحفظ: ${result.createdAt.toDate().toLocaleString('ar-EG')}</p>
                            <div class="text-gray-700 whitespace-pre-wrap mb-3">${result.data}</div>
                            <div class="flex gap-2 justify-start">
                               <button class="open-saved-assessment btn btn-outline px-3 py-1 rounded-full" data-quiz-id="${canOpen ? result.meta.id : ''}" ${canOpen ? '' : 'disabled'}>${canOpen ? 'إعادة فتح التقييم' : '—'}</button>
                            </div>
                        </div>`;
                    });
                    container.innerHTML = html;
                    // Bind reopen buttons
                    container.querySelectorAll('.open-saved-assessment').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-quiz-id');
                            if (id) window.__startQuiz?.(id);
                        });
                    });
                } catch (error) {
                    console.error("Error loading patient data:", error);
                    container.innerHTML = '<p class="text-red-500">حدث خطأ أثناء تحميل سجلاتك. يرجى المحاولة مرة أخرى.</p>';
                }
            }

            // --- Central API Request Handler ---
            async function handleApiRequest(prompt, resultsDivId, apiKey) {
                const resultsDiv = document.getElementById(resultsDivId);
                if (!resultsDiv) {
                    console.error(`Element with ID ${resultsDivId} not found.`);
                    return null;
                }

                resultsDiv.classList.remove('hidden');
                resultsDiv.style.opacity = '1';
                resultsDiv.innerHTML = `<div class="ai-loader"><div class="ai-loader-dots"><div class="dot1"></div><div class="dot2"></div><div class="dot3"></div></div><p class="mt-4 text-[--primary-color]">جاري التحليل...</p></div>`;

                if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey.length < 30) {
                    showNotification("مفتاح Google API غير موجود أو غير صحيح. يرجى إضافته في الكود.", "error");
                    resultsDiv.innerHTML = `<p class="text-center text-red-500">خطأ: مفتاح Google API مطلوب لتشغيل هذه الأداة.</p>`;
                    return null;
                }

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const arabicGuard = 'IMPORTANT: أجب باللغة العربية الفصحى حصراً، وبنبرة دافئة وداعمة. لا تستخدم الإنجليزية إطلاقاً. استخدم Markdown لعناوين فرعية وقوائم واضحة. ذكّر أنها معلومات عامة وليست تشخيصاً طبياً عند الحاجة.';
                const finalPrompt = `${prompt}\n\n${arabicGuard}`;
                const payload = { contents: [{ role: "user", parts: [{ text: finalPrompt }] }] };

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error("API Error Response:", errorData);
                        throw new Error(`HTTP error! status: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
                    }
                    const data = await response.json();
                    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                        return data.candidates[0].content.parts[0].text;
                    } else { throw new Error("Invalid API response structure"); }
                } catch (error) {
                    console.error("API Request Error:", error);
                    resultsDiv.innerHTML = `<p class="text-center text-red-500">حدث خطأ: ${error.message}. يرجى التحقق من مفتاح API وصلاحياته.</p>`;
                    return null;
                }
            }


            // --- SMART TOOLS MODULE ---
            function initSmartTools() {
                const toolModal = document.getElementById('tool-modal');
                const modalContent = document.getElementById('modal-content');
                let lastFocused = null;

                const showModal = (content) => {
                    modalContent.innerHTML = content;
                    // label dialog by first header
                    const firstH3 = modalContent.querySelector('h3');
                    if (firstH3) firstH3.id = 'tool-modal-title';
                    toolModal.setAttribute('aria-labelledby', firstH3 ? 'tool-modal-title' : '');
                    // open and focus
                    lastFocused = document.activeElement;
                    toolModal.classList.remove('hidden');
                    setTimeout(() => {
                        toolModal.classList.add('is-open');
                        modalContent.parentElement.classList.add('scale-100');
                        const focusables = modalContent.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
                        (focusables[0] || modalContent).focus();
                    }, 10);
                    const closeButton = modalContent.querySelector('.close-modal-btn');
                    if (closeButton) closeButton.addEventListener('click', hideModal);
                };

                const hideModal = () => {
                    toolModal.classList.remove('is-open');
                    modalContent.parentElement.classList.remove('scale-100');
                    setTimeout(() => {
                        toolModal.classList.add('hidden');
                        modalContent.innerHTML = '';
                        if (lastFocused) try { lastFocused.focus(); } catch { }
                    }, 300);
                };

                toolModal.addEventListener('click', e => {
                    if (e.target === toolModal) hideModal();
                });
                toolModal.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') { e.preventDefault(); hideModal(); return; }
                    if (e.key !== 'Tab') return;
                    const focusables = Array.from(modalContent.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'));
                    if (!focusables.length) return;
                    const idx = focusables.indexOf(document.activeElement);
                    let next = idx;
                    if (e.shiftKey) next = (idx - 1 + focusables.length) % focusables.length;
                    else next = (idx + 1) % focusables.length;
                    e.preventDefault();
                    focusables[next].focus();
                });

                document.querySelectorAll('.smart-tool-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const tool = button.dataset.tool;
                        let modalHTML = '';
                        switch (tool) {
                            case 'med-interactions':
                                modalHTML = `
                                <button class="close-modal-btn absolute top-4 left-4 text-2xl text-gray-500 hover:text-gray-800" aria-label="إغلاق">&times;</button>
                                <h3 class="text-2xl font-bold mb-4 text-[--primary-color]">تداخلات الأدوية</h3>
                                <p class="text-gray-600 mb-6">أدخل قائمة الأدوية/المكملات الجارية (مع الجرعات إن أمكن) للتحقق من أشهر التداخلات والملاحظات.</p>
                                <form id="tool-form">
                                    <div class="mb-4">
                                        <label for="meds-list" class="block text-right font-semibold mb-2">الأدوية والمكملات</label>
                                        <textarea id="meds-list" rows="6" class="w-full p-2 border rounded-md" placeholder="مثال:\nAspirin 81mg daily\nMetformin 1000mg BID\nVitamin D3 2000 IU daily\nOmega-3 1000mg"></textarea>
                                    </div>
                                    <div class="text-left">
                                        <button type="button" class="close-modal-btn btn btn-secondary py-2 px-6 rounded-full">إغلاق</button>
                                        <button type="submit" class="btn btn-primary text-white py-2 px-6 rounded-full mr-2">تحقق من التداخلات</button>
                                    </div>
                                </form>
                                <div id="tool-results" class="mt-6 hidden"></div>`;
                                break;
                            case 'nutrition-plan':
                                modalHTML = `
                                <button class="close-modal-btn absolute top-4 left-4 text-2xl text-gray-500 hover:text-gray-800" aria-label="إغلاق">&times;</button>
                                <h3 class="text-2xl font-bold mb-4 text-[--primary-color]">خطة تغذية أسبوعية</h3>
                                <p class="text-gray-600 mb-6">أدخل الهدف الغذائي والقيود لتوليد خطة أسبوعية متوازنة (اقتراح عام غير تشخيصي).</p>
                                <form id="tool-form">
                                    <div class="mb-4 grid md:grid-cols-2 gap-3 text-right">
                                        <div>
                                            <label for="nutri-goal" class="block font-semibold mb-2">الهدف</label>
                                            <input id="nutri-goal" type="text" class="w-full p-2 border rounded-md" placeholder="إنقاص وزن، ضبط سكر، مضاد التهاب..." />
                                        </div>
                                        <div>
                                            <label for="nutri-restrict" class="block font-semibold mb-2">قيود/حساسيات</label>
                                            <input id="nutri-restrict" type="text" class="w-full p-2 border rounded-md" placeholder="خالي من الغلوتين، بدون ألبان..." />
                                        </div>
                                    </div>
                                    <div class="text-left">
                                        <button type="button" class="close-modal-btn btn btn-secondary py-2 px-6 rounded-full">إغلاق</button>
                                        <button type="submit" class="btn btn-primary text-white py-2 px-6 rounded-full mr-2">أنشئ الخطة</button>
                                    </div>
                                </form>
                                <div id="tool-results" class="mt-6 hidden"></div>`;
                                break;
                            case 'sleep-coach':
                                modalHTML = `
                                <button class="close-modal-btn absolute top-4 left-4 text-2xl text-gray-500 hover:text-gray-800" aria-label="إغلاق">&times;</button>
                                <h3 class="text-2xl font-bold mb-4 text-[--primary-color]">مدرب النوم</h3>
                                <p class="text-gray-600 mb-6">صف مشاكل النوم الحالية، وروتينك، لتحصل على خطة عادات نوم عملية.</p>
                                <form id="tool-form">
                                    <div class="mb-4">
                                        <label for="sleep-issues" class="block text-right font-semibold mb-2">مشاكل النوم</label>
                                        <textarea id="sleep-issues" rows="5" class="w-full p-2 border rounded-md" placeholder="مثال: صعوبة في البدء بالنوم، استيقاظ متكرر..."></textarea>
                                    </div>
                                    <div class="text-left">
                                        <button type="button" class="close-modal-btn btn btn-secondary py-2 px-6 rounded-full">إغلاق</button>
                                        <button type="submit" class="btn btn-primary text-white py-2 px-6 rounded-full mr-2">احصل على الخطة</button>
                                    </div>
                                </form>
                                <div id="tool-results" class="mt-6 hidden"></div>`;
                                break;
                            case 'protocols':
                                modalHTML = `
                                <button class="close-modal-btn absolute top-4 left-4 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
                                <h3 class="text-2xl font-bold mb-4 text-center text-[--primary-color]">🧪 بروتوكولات طِبرا العلاجية</h3>
                                <p class="text-center text-gray-600 mb-6">بروتوكولات علاجية متكاملة صمّمها د. عمر لمرافقة رحلة الشفاء الطبيعية</p>
                                <div class="grid gap-4 sm:grid-cols-2">
                                    <div class="p-6 bg-white rounded-lg shadow border text-right flex flex-col justify-between">
                                        <div>
                                            <h4 class="font-bold text-lg mb-2">💆‍♂️ بروتوكول تقوية وتغذية الشعر وإزالة الشيب والصلع</h4>
                                            <p class="text-sm mb-4">بروتوكول شامل لتقوية الجذور، تأخير الشيب، وتحفيز نمو الشعر الطبيعي</p>
                                        </div>
                                        <button class="btn btn-secondary w-full mt-auto" onclick="openModal('hair-protocol-modal')">عرض التفاصيل</button>
                                    </div>
                                    <div class="p-6 bg-white rounded-lg shadow border text-right flex flex-col justify-between">
                                        <div>
                                            <h4 class="font-bold text-lg mb-2">🩺 بروتوكول البواسير المتكامل</h4>
                                            <p class="text-sm mb-4">علاج شامل للبواسير عبر الدمج بين الطب الحديث، الأعشاب، المكملات، والعلاج الطاقي–الشعوري. بإشراف د. عمر.</p>
                                        </div>
                                        <button class="btn btn-secondary w-full mt-auto" onclick="openModal('hemorrhoid-protocol-modal')">عرض التفاصيل</button>
                                    </div>
                                    <div class="p-6 bg-gray-50 rounded-lg shadow border flex items-center justify-center text-center">
                                        <h4 class="font-bold">🧠 بروتوكول صفاء الدماغ<br><span class="text-sm text-gray-500">قريبًا</span></h4>
                                    </div>
                                    <div class="p-6 bg-gray-50 rounded-lg shadow border flex items-center justify-center text-center">
                                        <h4 class="font-bold">🔥 بروتوكول تقليل الالتهاب<br><span class="text-sm text-gray-500">قريبًا</span></h4>
                                    </div>
                                    <div class="p-6 bg-gray-50 rounded-lg shadow border flex items-center justify-center text-center">
                                        <h4 class="font-bold">🌿 بروتوكول تنظيف القولون<br><span class="text-sm text-gray-500">قريبًا</span></h4>
                                    </div>
                                </div>`;
                                showModal(modalHTML);
                                break;
                            case 'hair-protocol':
                                modalHTML = `
                                <button class="close-modal-btn absolute top-4 left-4 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
                                <h3 class="text-2xl font-bold mb-4 text-center text-[--primary-color]">البروتوكول الشمولي لعلاج الشعر</h3>
                                <div class="text-right space-y-4">
                                    <p class="text-center text-gray-600 mb-4">بروتوكول علاجي شامل لتأخير الشيب وتحفيز تصبغ الشعر وتقليل التساقط.</p>

                                    <div class="p-4 bg-gray-50 rounded-lg">
                                        <h4 class="font-bold text-lg mb-2 text-[--primary-dark]">الجزء 1: الزيوت العلاجية الموضعية (2-3 مرات أسبوعياً)</h4>
                                        <p><strong>التركيبة:</strong></p>
                                        <ul class="list-disc list-inside pr-4">
                                            <li>زيت إكليل الجبل: 10 مل</li>
                                            <li>زيت النعناع: 5 مل</li>
                                            <li>زيت الليمون: 5 مل</li>
                                            <li>زيت السمسم (كزيت حامل): 30 مل</li>
                                            <li>زيت الخروع (اختياري للتكثيف): 10 مل</li>
                                            <li>كيروسين طبي أو بارافين طبي: 5 مل</li>
                                        </ul>
                                        <p class="mt-2"><strong>طريقة الاستخدام:</strong> امزج المكونات، دفئها قليلاً، دلك فروة الرأس لـ 5-10 دقائق، واتركها لساعتين على الأقل قبل غسلها بشامبو طبيعي.</p>
                                    </div>

                                    <div class="p-4 bg-gray-50 rounded-lg">
                                        <h4 class="font-bold text-lg mb-2 text-[--primary-dark]">الجزء 2: مكملات غذائية يومية</h4>
                                         <ul class="list-disc list-inside pr-4">
                                            <li><strong>صباحًا بعد الفطور:</strong> Zinc (30-50 ملغ) مع Vitamin C (Liposomal) (500-1000 ملغ)</li>
                                            <li><strong>بعد ساعتين من الزنك:</strong> Copper (2-3 ملغ)</li>
                                            <li><strong>صباحًا أو مساءً:</strong> Fo-Ti (كبسولة 500-1000 ملغ) - <span class="text-red-500 font-bold">ينصح بعمل تحليل وظائف كبد.</span></li>
                                        </ul>
                                    </div>

                                    <div class="p-4 bg-gray-50 rounded-lg">
                                        <h4 class="font-bold text-lg mb-2 text-[--primary-dark]">الجزء 3: قناع الشعر الطبيعي (مرة أسبوعياً)</h4>
                                        <p><strong>التركيبة:</strong> ملعقة كبيرة سدر بودرة، ملعقة صغيرة عكبر نحل، نصف ملعقة صغيرة بذور الخلة المطحونة، 2 ملعقة كبيرة خل تفاح طبيعي، وماء دافئ للعجن.</p>
                                        <p class="mt-2"><strong>طريقة الاستخدام:</strong> يوضع على الفروة والشعر لمدة 30-60 دقيقة ثم يغسل جيداً.</p>
                                    </div>

                                    <div class="p-4 bg-gray-50 rounded-lg">
                                        <h4 class="font-bold text-lg mb-2 text-[--primary-dark]">الجزء 4: مادة ORMUS</h4>
                                        <p><strong>الجرعة:</strong> ملعقة صغيرة يومياً صباحاً على معدة فارغة من مصدر موثوق.</p>
                                        <p><strong>الفوائد:</strong> يزيد التركيز، يوازن الطاقات، ويحفز تجدد الخلايا الصبغية.</p>
                                        <p class="text-red-500 font-bold mt-2">تحذير: لا تستخدم ORMUS مع أدوية نفسية أو مناعية دون استشارة طبيب.</p>
                                    </div>

                                    <div class="p-4 bg-green-50 rounded-lg border-r-4 border-green-500">
                                        <h4 class="font-bold text-lg mb-2 text-green-800">نصائح عامة داعمة</h4>
                                        <ul class="list-disc list-inside pr-4">
                                            <li>اتبع نظامًا غذائيًا غنيًا بفيتامينات B12، حمض الفوليك، والسيليكا.</li>
                                            <li>خفف التوتر، لأن الإجهاد يزيد من الشيب.</li>
                                            <li>تجنب الصبغات الكيميائية القوية أثناء البروتوكول.</li>
                                            <li>أكثر من شرب العصائر الخضراء.</li>
                                        </ul>
                                    </div>
                                </div>`;
                                break;
                            case 'blood-test-decoder':
                                modalHTML = `
                                 <h3 class="text-2xl font-bold mb-4 text-[--primary-color]">فك شفرة تحاليل الدم</h3>
                                 <p class="text-gray-600 mb-6">الصق نتائج تحاليل دمك هنا. ستقوم الأداة بتحليلها من منظور الطب الوظيفي، مع التركيز على المعدلات المثالية وليس فقط الطبيعية.</p>
                                 <form id="tool-form">
                                     <div class="mb-4">
                                         <label for="blood-test-data" class="block text-right font-semibold mb-2">نتائج التحليل</label>
                                         <textarea id="blood-test-data" rows="10" class="w-full p-2 border rounded-md" placeholder="مثال:&#10;Vitamin D (25-OH) ..... 21 ng/mL&#10;Ferritin ................ 35 ng/mL&#10;TSH ..................... 3.8 mIU/L"></textarea>
                                     </div>
                                     <div class="text-left">
                                         <button type="button" class="close-modal-btn btn btn-secondary py-2 px-6 rounded-full">إغلاق</button>
                                         <button type="submit" class="btn btn-primary text-white py-2 px-6 rounded-full mr-2">حلل نتائجي</button>
                                     </div>
                                 </form>
                                 <div id="tool-results" class="mt-6 hidden"></div>`;
                                break;
                            case 'diagnosis':
                                modalHTML = `
                                 <h3 class="text-2xl font-bold mb-4 text-[--primary-color]">تشخيص متعدد الأبعاد</h3>
                                 <p class="text-gray-600 mb-6">يرجى إدخال المعلومات التالية بأكبر قدر ممكن من التفصيل.</p>
                                 <form id="tool-form">
                                     <div class="mb-4">
                                         <label for="symptoms" class="block text-right font-semibold mb-2">1. الأعراض الجسدية</label>
                                         <textarea id="symptoms" rows="3" class="w-full p-2 border rounded-md" placeholder="مثال: صداع نصفي، ألم في المفاصل..."></textarea>
                                     </div>
                                     <div class="mb-4">
                                         <label for="feelings" class="block text-right font-semibold mb-2">2. المشاعر والأفكار</label>
                                         <textarea id="feelings" rows="3" class="w-full p-2 border rounded-md" placeholder="مثال: أشعر بقلق دائم، أفكار سلبية..."></textarea>
                                     </div>
                                     <div class="mb-4">
                                         <label for="lifestyle" class="block text-right font-semibold mb-2">3. نمط الحياة</label>
                                         <textarea id="lifestyle" rows="3" class="w-full p-2 border rounded-md" placeholder="مثال: نومي متقطع، أعتمد على الوجبات السريعة..."></textarea>
                                     </div>
                                     <div class="text-left">
                                         <button type="button" class="close-modal-btn btn btn-secondary py-2 px-6 rounded-full">إغلاق</button>
                                         <button type="submit" class="btn btn-primary text-white py-2 px-6 rounded-full mr-2">ابدأ التحليل</button>
                                     </div>
                                 </form>
                                 <div id="tool-results" class="mt-6 hidden"></div>`;
                                break;
                            case 'treatment-plan':
                                modalHTML = `
                                 <h3 class="text-2xl font-bold mb-4 text-[--primary-color]">وصفة علاجية شمولية ذكية</h3>
                                 <p class="text-gray-600 mb-6">أدخل التشخيص أو الأعراض الرئيسية، مع معلومات إضافية، للحصول على خطة علاجية مقترحة.</p>
                                 <form id="tool-form">
                                     <div class="mb-4">
                                         <label for="diagnosis-input" class="block text-right font-semibold mb-2">1. التشخيص أو الأعراض الرئيسية</label>
                                         <textarea id="diagnosis-input" rows="4" class="w-full p-2 border rounded-md" placeholder="مثال: تشخيص بالقولون العصبي، مع قلق وتعب مستمر"></textarea>
                                     </div>
                                     <div class="text-left">
                                         <button type="button" class="close-modal-btn btn btn-secondary py-2 px-6 rounded-full">إغلاق</button>
                                         <button type="submit" class="btn btn-primary text-white py-2 px-6 rounded-full mr-2">صمم خطتي</button>
                                     </div>
                                 </form>
                                 <div id="tool-results" class="mt-6 hidden"></div>`;
                                break;
                            case 'awareness-exercise':
                                modalHTML = `
                                 <h3 class="text-2xl font-bold mb-4 text-[--primary-color]">تمرين وعي موجّه</h3>
                                 <p class="text-gray-600 mb-6">صف المشاعر التي تمر بها أو الصدمة التي تود العمل عليها، وسيقوم المساعد الذكي بإنشاء تمرين كتابة موجه لك.</p>
                                 <form id="tool-form">
                                     <div class="mb-4">
                                         <label for="repressed-feelings" class="block text-right font-semibold mb-2">المشاعر المكبوتة أو الصدمة</label>
                                         <textarea id="repressed-feelings" rows="4" class="w-full p-2 border rounded-md" placeholder="مثال: أشعر بغضب مكبوت تجاه موقف معين..."></textarea>
                                     </div>
                                     <div class="text-left">
                                         <button type="button" class="close-modal-btn btn btn-secondary py-2 px-6 rounded-full">إغلاق</button>
                                         <button type="submit" class="btn btn-primary text-white py-2 px-6 rounded-full mr-2">أنشئ التمرين</button>
                                     </div>
                                 </form>
                                 <div id="tool-results" class="mt-6 hidden"></div>`;
                                break;
                            case 'consultation':
                                modalHTML = `
                                 <h3 class="text-2xl font-bold mb-4 text-[--primary-color]">استشارة طبية آلية</h3>
                                 <p class="text-gray-600 mb-6">اطرح سؤالك على مساعد د. عمر الذكي للحصول على إجابات تستند إلى مبادئ الطب الشمولي.</p>
                                 <form id="tool-form">
                                     <div class="mb-4">
                                         <label for="question" class="block text-right font-semibold mb-2">سؤالك</label>
                                         <textarea id="question" rows="4" class="w-full p-2 border rounded-md" placeholder="مثال: ما هي أفضل الطرق لتقوية المناعة بشكل طبيعي؟"></textarea>
                                     </div>
                                     <div class="text-left">
                                         <button type="button" class="close-modal-btn btn btn-secondary py-2 px-6 rounded-full">إغلاق</button>
                                         <button type="submit" class="btn btn-primary text-white py-2 px-6 rounded-full mr-2">احصل على الإجابة</button>
                                     </div>
                                 </form>
                                 <div id="tool-results" class="mt-6 hidden"></div>`;
                                break;
                            case 'supplements':
                                modalHTML = `
                                 <h3 class="text-2xl font-bold mb-4 text-[--primary-color]">توصية مكملات غذائية</h3>
                                 <p class="text-gray-600 mb-6">صف أعراضك أو الصق نتائج تحليل الدم هنا، وسيقوم المساعد الذكي بتحليلها وتقديم توصيات للمكملات الغذائية.</p>
                                 <form id="tool-form">
                                     <div class="mb-4">
                                         <label for="analysis-data" class="block text-right font-semibold mb-2">الأعراض أو نتائج التحليل</label>
                                         <textarea id="analysis-data" rows="5" class="w-full p-2 border rounded-md" placeholder="مثال: أعاني من تساقط الشعر، إرهاق مستمر..."></textarea>
                                     </div>
                                     <div class="text-left">
                                         <button type="button" class="close-modal-btn btn btn-secondary py-2 px-6 rounded-full">إغلاق</button>
                                         <button type="submit" class="btn btn-primary text-white py-2 px-6 rounded-full mr-2">احصل على توصية</button>
                                     </div>
                                 </form>
                                 <div id="tool-results" class="mt-6 hidden"></div>`;
                                break;
                            case 'intention':
                                modalHTML = `
                                 <h3 class="text-2xl font-bold mb-4 text-[--primary-color]">نية اليوم</h3>
                                 <p class="text-gray-600 mb-6">احصل على نية إيجابية ومركزة لدعمك في يومك.</p>
                                 <form id="tool-form">
                                     <div class="text-left">
                                         <button type="button" class="close-modal-btn btn btn-secondary py-2 px-6 rounded-full">إغلاق</button>
                                         <button type="submit" class="btn btn-primary text-white py-2 px-6 rounded-full mr-2">أعطني نيتي</button>
                                     </div>
                                 </form>
                                 <div id="tool-results" class="mt-6 hidden"></div>`;
                                break;
                        }
                        showModal(modalHTML);
                        const form = document.getElementById('tool-form');
                        if (form) form.addEventListener('submit', (e) => handleToolSubmit(e, tool));
                    });
                });

                async function handleToolSubmit(e, tool) {
                    e.preventDefault();
                    let prompt = '', toolTitle = '', rawInputForSaving = '';
                    switch (tool) {
                        case 'blood-test-decoder':
                            toolTitle = "فك شفرة تحاليل الدم";
                            const bloodTestData = document.getElementById('blood-test-data').value;
                            rawInputForSaving = `بيانات التحليل: ${bloodTestData}`;
                            if (!bloodTestData) { showNotification('يرجى لصق نتائج التحليل.', 'warning'); return; }
                            prompt = `Act as a functional medicine expert analyzing blood test results. The user has provided these results: "${bloodTestData}". Your task is to:
1.  Identify key markers (like Vitamin D, Ferritin, TSH, etc.).
2.  For each marker, state its functional/optimal range (which is often stricter than the standard lab range).
3.  Compare the user's result to the optimal range.
4.  Explain in simple Arabic what this result means for their health from a holistic perspective (e.g., how low ferritin affects energy and hair).
5.  Provide actionable recommendations including specific foods, lifestyle changes, and potential supplements to help them reach the optimal range.
Structure the output in Arabic with clear headings for each marker using markdown. Start with a disclaimer that this is not a medical diagnosis.`;
                            break;
                        case 'diagnosis':
                            toolTitle = "تشخيص متعدد الأبعاد";
                            const symptoms = document.getElementById('symptoms').value;
                            const feelings = document.getElementById('feelings').value;
                            const lifestyle = document.getElementById('lifestyle').value;
                            rawInputForSaving = `الأعراض: ${symptoms}\nالمشاعر: ${feelings}\nنمط الحياة: ${lifestyle}`;
                            if (!symptoms && !feelings && !lifestyle) { showNotification('يرجى إدخال بعض المعلومات للتحليل.', 'warning'); return; }
                            prompt = `Act as a holistic medicine expert. Analyze the user's input based on a tripartite model (organic, emotional, energetic) and provide a probable diagnosis or assessment. User Input -> Symptoms: "${symptoms}", Feelings: "${feelings}", Lifestyle: "${lifestyle}". Structure the output as a clean, readable text in Arabic with three main sections: "الاحتمال العضوي", "الجذر الشعوري", and "التوازن الطاقي المختل". Use markdown for formatting.`;
                            break;
                        case 'treatment-plan':
                            toolTitle = "وصفة علاجية شمولية";
                            const diagnosisInput = document.getElementById('diagnosis-input').value;
                            rawInputForSaving = `التشخيص: ${diagnosisInput}`;
                            if (!diagnosisInput) { showNotification('يرجى إدخال التشخيص أو الأعراض الرئيسية.', 'warning'); return; }
                            prompt = `أنت طبيب طب وظيفي وشمولي. قم بتصميم خطة علاجية شاملة لمدة 21 يوم لمريض يعاني من: "${diagnosisInput}". يجب أن تتضمن الخطة أقسام: "الأدوية أو المكملات المقترحة", "توصيات التغذية", "تمارين تأمل أو وعي", و"نصائح طاقة ونمط حياة". قدم الإجابة باللغة العربية فقط بشكل منظم وواضح.`;
                            break;
                        case 'awareness-exercise':
                            toolTitle = "تمرين وعي موجّه";
                            const repressedFeelings = document.getElementById('repressed-feelings').value;
                            rawInputForSaving = `المشاعر: ${repressedFeelings}`;
                            if (!repressedFeelings) { showNotification('يرجى وصف مشاعرك.', 'warning'); return; }
                            prompt = `أنت مدرب كتابة علاجية. بناءً على المشاعر المكبوتة التي ذكرها المستخدم: "${repressedFeelings}"، أنشئ تمرين كتابة تعبيرية موجه. يجب أن تتضمن الإجابة باللغة العربية فقط: 1. مقدمة لطيفة. 2. سلسلة من 3-5 أسئلة تأملية للكتابة. 3. إرشادات ختامية حول كيفية معالجة ما كتبوه. قم بتنسيق الإجابة بعناوين واضحة.`;
                            break;
                        case 'consultation':
                            toolTitle = "استشارة طبية آلية";
                            const question = document.getElementById('question').value;
                            rawInputForSaving = `السؤال: ${question}`;
                            if (!question) { showNotification('يرجى كتابة سؤالك.', 'warning'); return; }
                            prompt = `أنت مساعد طبي شمولي للدكتور عمر. أجب على السؤال التالي باللغة العربية فقط، مع تطبيق مبادئ الطب الشمولي والوظيفي والروحي حيث أمكن. السؤال: "${question}"`;
                            break;
                        case 'supplements':
                            toolTitle = "توصية مكملات غذائية";
                            const analysisData = document.getElementById('analysis-data').value;
                            rawInputForSaving = `البيانات: ${analysisData}`;
                            if (!analysisData) { showNotification('يرجى إدخال الأعراض أو نتائج التحليل.', 'warning'); return; }
                            prompt = `أنت خبير في الطب الوظيفي. حلل الأعراض أو نتائج التحاليل التالية: "${analysisData}" وأوصِ بأفضل المكملات الغذائية. اذكر التوقيت المناسب (مثل مع الطعام، في الصباح) وأي تحذيرات محتملة. قدم الإجابة باللغة العربية فقط في قائمة واضحة ومنظمة.`;
                            break;
                        case 'intention':
                            toolTitle = "نية اليوم";
                            rawInputForSaving = `طلب نية اليوم`;
                            prompt = `أنت مدرب عافية روحية. قدم نية يومية داعمة وشافية للمستخدم. يجب أن تكون الإجابة جملة نية قوية واحدة باللغة العربية، يتبعها "تمرين دعم داخلي" قصير (1-2 جملة) لمساعدتهم على تجسيد هذه النية.`;
                            break;
                    }
                    // Prepare loading UI for tool results
                    const toolResultsDiv = document.getElementById('tool-results');
                    if (toolResultsDiv) {
                        toolResultsDiv.classList.remove('hidden');
                        toolResultsDiv.setAttribute('role', 'status');
                        toolResultsDiv.setAttribute('aria-live', 'polite');
                        toolResultsDiv.setAttribute('aria-busy', 'true');
                        toolResultsDiv.innerHTML = `
                        <div class="ai-loader p-4">
                            <div class="ai-loader-dots"><div class="dot1"></div><div class="dot2"></div><div class="dot3"></div></div>
                            <p class="mt-2 text-gray-500">جاري إعداد النتيجة...</p>
                        </div>`;
                    }
                    const responseText = await handleApiRequest(prompt, 'tool-results', GEMINI_API_KEY);
                    if (responseText) {
                        const resultsDiv = document.getElementById('tool-results');
                        resultsDiv.innerHTML = `
                        <div id="result-content" class="p-4 bg-gray-50 rounded-md text-right whitespace-pre-wrap border">${responseText}</div>
                        <div class="mt-4 text-left">
                            ${currentUser ? '<button id="save-result-btn" class="btn btn-secondary py-2 px-4 rounded-full text-sm">حفظ النتيجة</button>' : ''}
                            <button id="download-pdf-btn" class="btn btn-primary text-white py-2 px-4 rounded-full mr-2 text-sm">تحميل كـ PDF</button>
                        </div>`;
                        resultsDiv.removeAttribute('aria-busy');
                        if (currentUser) {
                            document.getElementById('save-result-btn').addEventListener('click', () => {
                                const fullResultText = `--- المدخلات ---\n${rawInputForSaving}\n\n--- نتيجة التحليل ---\n${responseText}`;
                                saveResultToFirestore(toolTitle, fullResultText)
                            });
                        }
                        document.getElementById('download-pdf-btn').addEventListener('click', () => downloadResultAsPDF('result-content', toolTitle));
                    }
                }

                // Category & Search filtering for Smart Tools
                const catBtns = document.querySelectorAll('.tool-cat-btn');
                const searchInput = document.getElementById('tool-search');
                const toolGrid = document.getElementById('tool-grid');
                const toolButtons = toolGrid ? Array.from(toolGrid.querySelectorAll('.smart-tool-btn')) : [];

                const getActiveCat = () => {
                    const active = Array.from(catBtns).find(b => b.getAttribute('aria-selected') === 'true');
                    return active ? active.dataset.cat : 'all';
                };

                const applyToolFilters = () => {
                    const cat = getActiveCat();
                    const q = (searchInput?.value || '').toLowerCase().trim();
                    toolButtons.forEach(btn => {
                        const btnCat = btn.dataset.cat || 'other';
                        const text = btn.textContent.toLowerCase();
                        const matchCat = (cat === 'all') || (btnCat === cat);
                        const matchText = !q || text.includes(q);
                        btn.classList.toggle('hidden', !(matchCat && matchText));
                    });
                };

                catBtns.forEach(btn => btn.addEventListener('click', () => {
                    catBtns.forEach(b => b.setAttribute('aria-selected', 'false'));
                    btn.setAttribute('aria-selected', 'true');
                    applyToolFilters();
                }));

                searchInput?.addEventListener('input', applyToolFilters);

                // Initial filter state
                applyToolFilters();
            }

            // --- CHRONIC CARE MODULE ---
            function initChronicCare() {
                const section = document.getElementById('view-chronic-care');
                if (!section) return;

                const categoryButtons = section.querySelectorAll('.chronic-category-btn');
                const suggestionsDiv = document.getElementById('chronic-suggestions');
                const askBtn = document.getElementById('chronic-ask-btn');
                const qArea = document.getElementById('chronic-question');
                const resultsDiv = document.getElementById('chronic-results');
                // Tabs and Sections
                const tabButtons = section.querySelectorAll('.tab-btn');
                const segmented = section.querySelector('.segmented-control');
                const articlesSection = document.getElementById('chronic-articles-section');
                const assistantSection = document.getElementById('chronic-assistant-section');
                // Articles Nav
                const articleNav = document.getElementById('chronic-articles-nav');
                const articleContent = document.getElementById('chronic-article-content');
                const diseaseButtons = articleNav ? articleNav.querySelectorAll('button') : [];

                const suggestionMap = {
                    diabetes: [
                        'ما أفضل نمط غذائي عملي لمريض السكري من النوع الثاني؟',
                        'كم هدف HbA1c الصحي بشكل عام؟',
                        'كيف أوزّع الكربوهيدرات خلال اليوم؟',
                        'ما العلامات المبكرة لهبوط السكر وكيف أتعامل معها؟',
                        'هل الصيام المتقطع مناسب مع السكري؟'
                    ],
                    hypertension: [
                        'ما القراءات الطبيعية لضغط الدم في المنزل؟',
                        'كيف أطبق نظام DASH لتقليل الضغط؟',
                        'ما دور الملح والبوتاسيوم والمغنيسيوم في ضغط الدم؟',
                        'ما هي نصائح قياس الضغط المنزلي الصحيحة؟',
                        'متى يجب طلب إسعاف بسبب ارتفاع الضغط؟'
                    ],
                    diet: [
                        'ما مبادئ النظام المتوسطي المضاد للالتهاب؟',
                        'كم جرام ألياف أنصح بها يومياً، ومن أين أحصل عليها؟',
                        'كيف أبني طبق متوازن: بروتين + ألياف + دهون مفيدة؟',
                        'نصائح للترطيب الذكي وعدد أكواب الماء اليومية؟',
                        'بدائل صحية للسكر المكرر والطحين الأبيض'
                    ],
                    medications: [
                        'ما أكثر التداخلات الدوائية شيوعاً مع أدوية الضغط والسكري؟',
                        'هل يوجد نقص فيتامين B12 مع الميتفورمين على المدى الطويل؟',
                        'متى أستشير الطبيب فوراً عند ظهور أعراض جانبية؟',
                        'هل يمكن الجمع بين مكملات عشبية وبعض الأدوية بأمان؟',
                        'ما إرشادات عامة لتناول الأدوية بأمان؟'
                    ]
                };

                let selectedCat = 'diabetes';

                // Doctor-reviewed articles content
                const articlesContent = {
                    diabetes: `
                    <div class="space-y-4 text-right">
                        <h3 class="text-2xl font-bold text-[--primary-dark]">دليل موجز لمرض السكري من النوع الثاني</h3>
                        <p class="text-gray-700">هذه معلومات تعليمية عامة لمساعدتك على فهم الأساسيات قبل زيارتك لطبيبك. ضبط الأهداف النهائية وخطة العلاج فردي ويحدده طبيبك وفق حالتك.</p>

                        <h4 class="text-xl font-bold">الأهداف السريرية العامة (تُفصَّل فردياً):</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>HbA1c: غالباً &lt; 7% (قد يُشدَّد أو يُليَّن حسب السن، المخاطر، والأمراض المصاحبة).</li>
                            <li>السكر الصائم: 80–130 mg/dL تقريباً.</li>
                            <li>بعد الوجبة (ساعتان): أقل من 180 mg/dL غالباً.</li>
                            <li>ضغط الدم: حول 130/80 mmHg أو أقل إن كان ذلك آمناً ومناسباً لك.</li>
                        </ul>

                        <h4 class="text-xl font-bold">أساسيات نمط الحياة:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>نمط غذائي متوازن (متوسطي/‏DASH) يحد من السكريات البسيطة والدقيق الأبيض، ويُكثّر من الألياف (25–35 ج/يوم).</li>
                            <li>حركة أسبوعية: 150 دقيقة على الأقل من النشاط الهوائي المتوسط + تمارين مقاومة 2–3 مرات أسبوعياً.</li>
                            <li>نوم كافٍ (7–9 ساعات) وإدارة للضغط النفسي.</li>
                            <li>خفض الوزن الزائد (5–10%) قد يحسن التحكم بالسكر بشكل ملحوظ.</li>
                        </ul>

                        <h4 class="text-xl font-bold">المراقبة الذاتية:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>تعلم تقنية القياس المنزلي الصحيحة وتسجيل القراءات.</li>
                            <li>التعرّف على علامات هبوط السكر (تعرق، رجفان، دوخة) وارتفاعه ومعرفة متى تطلب مساعدة.</li>
                        </ul>

                        <h4 class="text-xl font-bold">متى أطلب رعاية إسعافية؟</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>أعراض هبوط شديد لا تتحسن بالسكريات السريعة.</li>
                            <li>ارتفاع شديد مستمر مع أعراض (قيء، جفاف، تنفس غير طبيعي، اضطراب وعي).</li>
                            <li>ألم صدر، ضيق نفس شديد، أو ارتباك مفاجئ.</li>
                        </ul>

                        <div class="p-3 rounded-md bg-amber-50 border-r-4 border-amber-500 text-gray-800">
                            تذكير: القرارات العلاجية والجرعات تُحدَّد مع طبيبك فقط. هذه مادة عامة تمهيدية وليست وصفة أو تشخيصاً.
                        </div>
                    </div>
                `,
                    hypertension: `
                    <div class="space-y-4 text-right">
                        <h3 class="text-2xl font-bold text-[--primary-dark]">دليل موجز لارتفاع ضغط الدم</h3>
                        <p class="text-gray-700">المعلومات التالية تعليمية عامة. تحديد أهداف الضغط وخيارات العلاج يتم مع طبيبك بناءً على ملفك الصحي الكامل.</p>

                        <h4 class="text-xl font-bold">الأهداف العامة والقياس المنزلي:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>الهدف الشائع للبالغين: قراءات قريبة من 130/80 mmHg أو أقل إن كان ذلك مناسباً وآمناً.</li>
                            <li>لأخذ خط أساس: قِس في المنزل صباحاً ومساءً لمدة 3 أيام (قراءتان في كل مرة) واحتسب المتوسط.</li>
                            <li>التقنية الصحيحة: راحة 5 دقائق، ظهر مسنود، الذراع على مستوى القلب، كُفة مناسبة، والامتناع عن الكافيين/التدخين 30 دقيقة قبل القياس.</li>
                        </ul>

                        <h4 class="text-xl font-bold">تعديل نمط الحياة:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>تقليل الملح إلى نحو 1500–2000 mg صوديوم/يوم متى أمكن، وزيادة البوتاسيوم الغذائي ما لم توجد موانع (مثل أمراض الكلى).</li>
                            <li>اتباع نظام DASH/متوسطي، الإكثار من الخضار والفواكه والبقول والحبوب الكاملة.</li>
                            <li>نشاط بدني منتظم، خفض الوزن الزائد، تقليل الكحول، والإقلاع عن التدخين.</li>
                        </ul>

                        <h4 class="text-xl font-bold">إنذارات تستوجب مراجعة طبية عاجلة/إسعاف:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>ضغط ≥ 180/120 mmHg مع أعراض (ألم صدر، ضيق نفس، أعراض عصبية، تشوش رؤية، صداع شديد مفاجئ).</li>
                            <li>قراءات مرتفعة جداً متكررة رغم الراحة والتقنية الصحيحة.</li>
                        </ul>

                        <div class="p-3 rounded-md bg-amber-50 border-r-4 border-amber-500 text-gray-800">
                            تذكير: هذه مادة تثقيفية عامة. تشخيص السبب وخطة العلاج والدواء يحددها الطبيب وفق تقييم شامل لك.
                        </div>
                    </div>
                `
                    , ckd: `
                    <div class="space-y-4 text-right">
                        <h3 class="text-2xl font-bold text-[--primary-dark]">دليل موجز لمرض الكلى المزمن</h3>
                        <p class="text-gray-700">هذه مادة تثقيفية عامة لفهم المرض قبل الاستشارة. التشخيص وخطط العلاج فردية ويحددها الطبيب بناءً على التقييم الشامل.</p>

                        <h4 class="text-xl font-bold">الأساسيات:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>يقاس تقدم المرض عادةً عبر معدل الترشيح الكبيبي (eGFR) ووجود ألبومين في البول.</li>
                            <li>التحكم بالضغط والسكري (إن وُجدا) أساس لتباطؤ تدهور الوظيفة الكلوية.</li>
                        </ul>

                        <h4 class="text-xl font-bold">نمط الحياة والدعم:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>تقليل الملح الغذائي، شرب ماء مناسب وفق توجيه طبيبك.</li>
                            <li>توازن البروتين وفق إرشاد الطبيب/أخصائي التغذية، وتجنب مسكنات NSAIDs دون استشارة.</li>
                            <li>الالتزام بالتطعيمات الموصى بها ومراجعة الأدوية للتأكد من أمانها كلوياً.</li>
                        </ul>

                        <h4 class="text-xl font-bold">مراقبة عامة:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>متابعة دورية لـ eGFR، الألبومين في البول، الشوارد، والهيموغلوبين.</li>
                        </ul>

                        <h4 class="text-xl font-bold">متى أطلب رعاية عاجلة؟</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>تورم شديد، قلة شديدة في البول، ضيق نفس ملحوظ، ارتباك، ألم صدر.</li>
                        </ul>

                        <div class="p-3 rounded-md bg-amber-50 border-r-4 border-amber-500 text-gray-800">
                            تذكير: هذه معلومات عامة وليست وصفاً علاجياً. خطتك تُحدَّد مع طبيبك المعالج.
                        </div>
                    </div>
                `,
                    dyslipidemia: `
                    <div class="space-y-4 text-right">
                        <h3 class="text-2xl font-bold text-[--primary-dark]">دليل موجز لاضطراب دهون الدم</h3>
                        <p class="text-gray-700">الأهداف العلاجية تُحدَّد حسب خطورة القلب والأوعية لديك. هذه معلومات عامة تمهيدية.</p>

                        <h4 class="text-xl font-bold">الأساسيات:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>تقييم الخطورة القلبية الوعائية يوجّه مستوى الهدف من LDL وغيرها.</li>
                            <li>التدخلات الدوائية تُقرّر من قبل الطبيب بعد تقييم متكامل.</li>
                        </ul>

                        <h4 class="text-xl font-bold">نمط الحياة:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>نظام متوسطي/DASH غني بالألياف (شوفان، بقوليات)، تقليل الدهون المتحولة والدهون المشبعة.</li>
                            <li>نشاط بدني منتظم، خفض الوزن الزائد، الإقلاع عن التدخين.</li>
                        </ul>

                        <h4 class="text-xl font-bold">مراقبة عامة:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>تحليل دهون صائم دوري حسب خطة طبيبك ومتابعة الالتزام بالنمط الحياتي.</li>
                        </ul>

                        <h4 class="text-xl font-bold">متى أطلب رعاية عاجلة؟</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>ألم صدر شديد مفاجئ، ضيق نفس حاد، أعراض عصبية حادة (ضعف/خدر مفاجئ، اضطراب كلام/رؤية).</li>
                        </ul>

                        <div class="p-3 rounded-md bg-amber-50 border-r-4 border-amber-500 text-gray-800">
                            تذكير: هذه مادة تثقيفية عامة. القرار العلاجي النهائي وتحديد الأهداف الدوائية يتمّان مع الطبيب.
                        </div>
                    </div>
                `,
                    copd: `
                    <div class="space-y-4 text-right">
                        <h3 class="text-2xl font-bold text-[--primary-dark]">دليل موجز للانسداد الرئوي المزمن (COPD)</h3>
                        <p class="text-gray-700">الحالة تنجم غالباً عن التدخين أو التعرض المزمن للمهيجات. هذه نقاط عامة لمساندة زيارتك للطبيب.</p>

                        <h4 class="text-xl font-bold">الأساسيات:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>أعراض شائعة: سعال مزمن، بلغم، ضيق نفس يزداد مع الجهد.</li>
                            <li>الخطة العلاجية الفردية يضعها الطبيب وقد تشمل أجهزة استنشاق وبرامج تأهيل رئوي.</li>
                        </ul>

                        <h4 class="text-xl font-bold">نمط الحياة والوقاية:</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>الإقلاع التام عن التدخين هو الأهم.</li>
                            <li>التطعيمات الموسمية (الإنفلونزا) وتطعيمات المكورات الرئوية وفق الإرشادات.</li>
                            <li>تمارين تنفّس وتأهيل رئوي لتحسين القدرة على الجهد.</li>
                            <li>تجنّب المهيّجات الهوائية بالبيت والعمل.</li>
                        </ul>

                        <h4 class="text-xl font-bold">متى أطلب رعاية عاجلة؟</h4>
                        <ul class="list-disc pr-6 text-gray-800">
                            <li>ضيق نفس شديد مفاجئ، ازرقاق الشفاه/الأظافر، ارتباك، ألم صدر.</li>
                        </ul>

                        <div class="p-3 rounded-md bg-amber-50 border-r-4 border-amber-500 text-gray-800">
                            تذكير: هذه المعلومات عامة وليست خطة علاج. راجع طبيبك لتشخيص دقيق وتعديل الخطة حسب حالتك.
                        </div>
                    </div>
                `
                };

                const renderArticle = (key) => {
                    if (!articleContent) return;
                    const html = articlesContent[key] || '<p class="text-gray-600">المحتوى غير متوفر بعد.</p>';
                    articleContent.innerHTML = html;
                };

                const setActiveDisease = (btn) => {
                    diseaseButtons.forEach(b => {
                        b.classList.remove('active', 'btn-primary');
                        b.classList.add('btn-secondary');
                        b.setAttribute('aria-pressed', 'false');
                    });
                    if (btn) {
                        btn.classList.add('active', 'btn-primary');
                        btn.classList.remove('btn-secondary');
                        btn.setAttribute('aria-pressed', 'true');
                    }
                };

                // Tabs behavior
                const showTab = (tab) => {
                    tabButtons.forEach(b => {
                        const isActive = b.dataset.tab === tab;
                        b.classList.toggle('active', isActive);
                        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
                        b.setAttribute('tabindex', isActive ? '0' : '-1');
                    });
                    if (articlesSection && assistantSection) {
                        if (tab === 'articles') {
                            articlesSection.classList.remove('hidden');
                            articlesSection.setAttribute('aria-hidden', 'false');
                            assistantSection.classList.add('hidden');
                            assistantSection.setAttribute('aria-hidden', 'true');
                        } else {
                            assistantSection.classList.remove('hidden');
                            assistantSection.setAttribute('aria-hidden', 'false');
                            articlesSection.classList.add('hidden');
                            articlesSection.setAttribute('aria-hidden', 'true');
                        }
                    }
                };
                tabButtons.forEach(btn => btn.addEventListener('click', () => {
                    const tab = btn.dataset.tab;
                    showTab(tab);
                    // Persist state in hash
                    location.hash = `view=chronic-care&tab=${encodeURIComponent(tab)}`;
                }));
                // Keyboard navigation for segmented tabs (RTL-aware)
                segmented && segmented.addEventListener('keydown', (e) => {
                    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
                    if (!keys.includes(e.key)) return;
                    e.preventDefault();
                    const tabs = Array.from(tabButtons);
                    let idx = tabs.indexOf(document.activeElement);
                    if (e.key === 'Home') idx = 0;
                    else if (e.key === 'End') idx = tabs.length - 1;
                    else if (e.key === 'ArrowLeft') idx = (idx + 1) % tabs.length; // RTL: left moves to next visually
                    else if (e.key === 'ArrowRight') idx = (idx - 1 + tabs.length) % tabs.length; // RTL: right moves to previous
                    const target = tabs[idx];
                    if (target) {
                        target.focus();
                        target.click();
                    }
                });
                // Default tab
                showTab('articles');

                // Disease buttons behavior
                diseaseButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const key = btn.dataset.disease;
                        setActiveDisease(btn);
                        renderArticle(key);
                        // Persist state in hash
                        location.hash = `view=chronic-care&tab=articles&disease=${encodeURIComponent(key)}`;
                    });
                });
                const defaultDiseaseBtn = articleNav ? articleNav.querySelector('[data-disease="diabetes"]') : null;
                if (defaultDiseaseBtn) {
                    setActiveDisease(defaultDiseaseBtn);
                    renderArticle('diabetes');
                }

                const renderSuggestions = (cat) => {
                    const items = suggestionMap[cat] || [];
                    suggestionsDiv.innerHTML = items.map((t) => `
                    <button class="btn btn-outline py-2 px-4 rounded-full text-sm text-right">${t}</button>
                `).join('');
                    suggestionsDiv.querySelectorAll('button').forEach(b => {
                        b.addEventListener('click', () => {
                            qArea.value = b.textContent.trim();
                            qArea.focus();
                        });
                    });
                };

                categoryButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        categoryButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        selectedCat = btn.dataset.cat || 'diabetes';
                        renderSuggestions(selectedCat);
                    });
                });

                // Default category
                const defaultBtn = section.querySelector(`.chronic-category-btn[data-cat="${selectedCat}"]`);
                if (defaultBtn) defaultBtn.classList.add('active');
                renderSuggestions(selectedCat);

                const buildPrompt = (question, cat) => `أنت مساعد صحي مسؤول يتبع مبادئ الطب الباطني وطب نمط الحياة. أجب باللغة العربية الفصحى.
مهم: إجابتك عامة تثقيفية وليست تشخيصاً أو وصفاً علاجياً.
الفئة: ${cat}
السؤال: "${question}"

رجاءً قدم إجابة منظمة بعناوين واضحة:
1) ملخص موجز
2) النقاط الأساسية المرتبطة بالفئة
3) نصائح نمط حياة عامة عملية (غير مخصصة)
4) تحذيرات/تداخلات شائعة ذات صلة (إن وُجدت)
5) متى أطلب رعاية طارئة أو أراجع الطبيب فوراً

تجنب الجرعات والأدوية المحددة والقرارات العلاجية الفردية. اختم بتذكير قصير بأن هذه المعلومات عامة فقط.`;

                askBtn.addEventListener('click', async () => {
                    const q = (qArea.value || '').trim();
                    if (!q) { showNotification('يرجى كتابة سؤالك أولاً.', 'warning'); qArea.focus(); return; }
                    const prompt = buildPrompt(q, selectedCat);
                    // Show loading state
                    resultsDiv.classList.remove('hidden');
                    resultsDiv.setAttribute('aria-busy', 'true');
                    resultsDiv.innerHTML = `
                    <div class="ai-loader p-4">
                        <div class="ai-loader-dots"><div class="dot1"></div><div class="dot2"></div><div class="dot3"></div></div>
                        <p class="mt-2 text-gray-500">جاري إعداد إجابة عامة...</p>
                    </div>`;
                    const responseText = await handleApiRequest(prompt, 'chronic-results', GEMINI_API_KEY);
                    if (responseText) {
                        resultsDiv.innerHTML = `
                        <div id="chronic-result-content" class="p-4 bg-gray-50 rounded-md text-right whitespace-pre-wrap border">${responseText}</div>
                        <div class="mt-4 text-left">
                            ${currentUser ? '<button id="save-result-btn" class="btn btn-secondary py-2 px-4 rounded-full text-sm">حفظ النتيجة</button>' : ''}
                            <button id="download-chronic-pdf-btn" class="btn btn-primary text-white py-2 px-4 rounded-full mr-2 text-sm">تحميل كـ PDF</button>
                        </div>`;
                        resultsDiv.classList.remove('hidden');
                        resultsDiv.removeAttribute('aria-busy');
                        if (currentUser) {
                            const fullResultText = `--- الفئة ---\n${selectedCat}\n\n--- السؤال ---\n${q}\n\n--- الإجابة العامة ---\n${responseText}`;
                            document.getElementById('save-result-btn')?.addEventListener('click', () => {
                                saveResultToFirestore('مركز دعم الأمراض المزمنة', fullResultText);
                            });
                        }
                        document.getElementById('download-chronic-pdf-btn')?.addEventListener('click', () => {
                            downloadResultAsPDF('chronic-result-content', 'مركز دعم الأمراض المزمنة');
                        });
                    }
                });
            }

            // --- CHRONIC CARE TRACKING TOOLS & NOTIFICATIONS ---
            function initChronicTracking() {
                // Request notification permission
                async function requestNotificationPermission() {
                    if ('Notification' in window && Notification.permission === 'default') {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') showNotification('تم تفعيل الإشعارات! 🎉', 'success');
                    }
                }
                
                function sendNotif(title, body) {
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(title, { body, icon: '/favicon.ico', tag: 'chronic' });
                    }
                }
                
                // Activate all tracking buttons
                document.querySelectorAll('button').forEach(btn => {
                    const txt = btn.textContent;
                    
                    // Symptom Tracker
                    if (txt.includes('ابدأ التتبع')) {
                        btn.addEventListener('click', async () => {
                            await requestNotificationPermission();
                            const entry = { date: new Date().toLocaleString('ar'), symptoms: prompt('سجل الأعراض (مفصولة بفاصلة):'), severity: prompt('الشدة من 1-10:') };
                            if (entry.symptoms) {
                                const tracker = JSON.parse(localStorage.getItem('symptomTracker') || '[]');
                                tracker.push(entry);
                                localStorage.setItem('symptomTracker', JSON.stringify(tracker));
                                showNotification('تم حفظ الأعراض! ✅', 'success');
                                sendNotif('✅ تسجيل جديد', `الأعراض: ${entry.symptoms}`);
                            }
                        });
                    }
                    
                    // Medication Manager
                    if (txt.includes('أضف أدويتك')) {
                        btn.addEventListener('click', async () => {
                            await requestNotificationPermission();
                            const med = { 
                                name: prompt('اسم الدواء:'), 
                                dose: prompt('الجرعة:'),
                                time: prompt('وقت التناول (HH:MM):')
                            };
                            if (med.name && med.time) {
                                const meds = JSON.parse(localStorage.getItem('medications') || '[]');
                                meds.push({ ...med, id: Date.now() });
                                localStorage.setItem('medications', JSON.stringify(meds));
                                showNotification('تم إضافة الدواء! 💊', 'success');
                                sendNotif('💊 دواء جديد', `${med.name} - ${med.time}`);
                                
                                // Schedule notification
                                const [h, m] = med.time.split(':');
                                const now = new Date();
                                const schedTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
                                const delay = schedTime - now;
                                if (delay > 0) {
                                    setTimeout(() => sendNotif(`⏰ تذكير: ${med.name}`, `حان وقت تناول ${med.dose}`), delay);
                                }
                            }
                        });
                    }
                    
                    // Vitals Tracker
                    if (txt.includes('سجل قياساتك')) {
                        btn.addEventListener('click', () => {
                            const vitals = {
                                date: new Date().toLocaleString('ar'),
                                bp: prompt('ضغط الدم (مثال: 120/80):'),
                                sugar: prompt('السكر (mg/dL):'),
                                weight: prompt('الوزن (كجم):')
                            };
                            if (vitals.bp || vitals.sugar || vitals.weight) {
                                const tracker = JSON.parse(localStorage.getItem('vitalsTracker') || '[]');
                                tracker.push(vitals);
                                localStorage.setItem('vitalsTracker', JSON.stringify(tracker));
                                showNotification('تم حفظ القياسات! ❤️', 'success');
                                sendNotif('❤️ قياسات جديدة', `ضغط: ${vitals.bp || '-'} | سكر: ${vitals.sugar || '-'}`);
                            }
                        });
                    }
                });
                
                setTimeout(requestNotificationPermission, 2000);
            }

            // --- MEDICAL TRAVEL & SECOND OPINION MODULES ---
            function initMedicalTravel() {
                const form = document.getElementById('medical-travel-form');
                if (!form) return;
                const filesInput = document.getElementById('mt-files');
                const resultDiv = document.getElementById('mt-result');

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const fullname = document.getElementById('mt-fullname').value.trim();
                    const dob = document.getElementById('mt-dob').value;
                    const phone = document.getElementById('mt-phone').value.trim();
                    const email = document.getElementById('mt-email').value.trim();
                    const city = document.getElementById('mt-city').value.trim();
                    const nationality = document.getElementById('mt-nationality').value.trim();
                    const diagnosis = document.getElementById('mt-diagnosis').value.trim();
                    const urgency = document.getElementById('mt-urgency').value;
                    const destination = document.getElementById('mt-destination').value;
                    const comorbid = document.getElementById('mt-comorbid').value.trim();
                    const companions = document.getElementById('mt-companions').value;
                    const dates = document.getElementById('mt-dates').value.trim();

                    if (!fullname || !dob || !phone || !email || !diagnosis) {
                        showNotification('يرجى تعبئة الحقول المطلوبة.', 'warning');
                        highlightFirstMissing(['mt-fullname', 'mt-dob', 'mt-phone', 'mt-email', 'mt-diagnosis']);
                        return;
                    }

                    try {
                        // Disable UI and show loading
                        const submitBtn = document.getElementById('mt-submit');
                        let prevBtnHTML = '';
                        if (submitBtn) {
                            prevBtnHTML = submitBtn.innerHTML;
                            submitBtn.disabled = true;
                            submitBtn.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span> جاري الإرسال...';
                        }
                        form.classList.add('is-submitting');

                        showNotification('جاري إرسال طلبك...', 'warning');
                        const baseData = {
                            type: 'medical-travel',
                            createdAt: new Date(),
                            status: 'submitted',
                            userUid: currentUser ? currentUser.uid : null,
                            patient: { fullname, dob, phone, email, city, nationality },
                            clinical: { diagnosis, comorbid },
                            logistics: { urgency, destination, companions: companions ? Number(companions) : 0, dates }
                        };
                        const colRef = collection(db, 'intakes', appId, 'medicalTravel');
                        const docRef = await addDoc(colRef, baseData);

                        // Upload files (if any)
                        const uploaded = [];
                        const files = (filesInput && filesInput.files) ? Array.from(filesInput.files) : [];
                        for (const file of files) {
                            const path = `reports/medicalTravel/${docRef.id}/${encodeURIComponent(file.name)}`;
                            const sRef = storageRef(storage, path);
                            await uploadBytes(sRef, file, { contentType: file.type || 'application/octet-stream' });
                            const url = await getDownloadURL(sRef);
                            uploaded.push({ name: file.name, url, contentType: file.type || '', size: file.size || 0 });
                        }
                        if (uploaded.length) {
                            await setDoc(docRef, { files: uploaded }, { merge: true });
                        }

                        showNotification('تم استلام طلب تنسيق السفر الطبي بنجاح.', 'success');
                        resultDiv.innerHTML = `<div class="p-3 bg-green-50 border-r-4 border-green-500 rounded">تم تسجيل الطلب برقم: <strong>${docRef.id}</strong>. سيتواصل فريقنا معك.</div>`;
                        form.reset();
                    } catch (error) {
                        console.error('Medical Travel submit error:', error);
                        showNotification('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.', 'error');
                        resultDiv.innerHTML = `<p class="text-red-600">تعذر إرسال الطلب: ${error.message}</p>`;
                    } finally {
                        // Restore UI
                        const submitBtn = document.getElementById('mt-submit');
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = 'إرسال الطلب';
                        }
                        form.classList.remove('is-submitting');
                    }
                });
            }

            function initSecondOpinion() {
                const form = document.getElementById('second-opinion-form');
                if (!form) return;
                const filesInput = document.getElementById('so-files');
                const resultDiv = document.getElementById('so-result');

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const fullname = document.getElementById('so-fullname').value.trim();
                    const phone = document.getElementById('so-phone').value.trim();
                    const email = document.getElementById('so-email').value.trim();
                    const region = document.getElementById('so-region').value;
                    const summary = document.getElementById('so-summary').value.trim();
                    const questions = document.getElementById('so-questions').value.trim();

                    if (!fullname || !phone || !email || !summary) {
                        showNotification('يرجى تعبئة الحقول المطلوبة.', 'warning');
                        highlightFirstMissing(['so-fullname', 'so-phone', 'so-email', 'so-summary']);
                        return;
                    }

                    try {
                        // Disable UI and show loading
                        const submitBtn = document.getElementById('so-submit');
                        let prevBtnHTML = '';
                        if (submitBtn) {
                            prevBtnHTML = submitBtn.innerHTML;
                            submitBtn.disabled = true;
                            submitBtn.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span> جاري الإرسال...';
                        }
                        form.classList.add('is-submitting');

                        showNotification('جاري إرسال طلبك...', 'warning');
                        const baseData = {
                            type: 'second-opinion',
                            createdAt: new Date(),
                            status: 'submitted',
                            userUid: currentUser ? currentUser.uid : null,
                            patient: { fullname, phone, email },
                            preference: { region },
                            clinical: { summary, questions }
                        };
                        const colRef = collection(db, 'intakes', appId, 'secondOpinion');
                        const docRef = await addDoc(colRef, baseData);

                        // Upload files (if any)
                        const uploaded = [];
                        const files = (filesInput && filesInput.files) ? Array.from(filesInput.files) : [];
                        for (const file of files) {
                            const path = `reports/secondOpinion/${docRef.id}/${encodeURIComponent(file.name)}`;
                            const sRef = storageRef(storage, path);
                            await uploadBytes(sRef, file, { contentType: file.type || 'application/octet-stream' });
                            const url = await getDownloadURL(sRef);
                            uploaded.push({ name: file.name, url, contentType: file.type || '', size: file.size || 0 });
                        }
                        if (uploaded.length) {
                            await setDoc(docRef, { files: uploaded }, { merge: true });
                        }

                        showNotification('تم استلام طلب الرأي الطبي الثاني بنجاح.', 'success');
                        resultDiv.innerHTML = `<div class="p-3 bg-green-50 border-r-4 border-green-500 rounded">تم تسجيل الطلب برقم: <strong>${docRef.id}</strong>. سنتواصل معك قريباً.</div>`;
                        form.reset();
                    } catch (error) {
                        console.error('Second Opinion submit error:', error);
                        showNotification('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.', 'error');
                        resultDiv.innerHTML = `<p class="text-red-600">تعذر إرسال الطلب: ${error.message}</p>`;
                    } finally {
                        // Restore UI
                        const submitBtn = document.getElementById('so-submit');
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = 'إرسال الطلب';
                        }
                        form.classList.remove('is-submitting');
                    }
                });
            }

            // --- PDF DOWNLOAD MODULE ---
            async function downloadResultAsPDF(elementId, title) {
                try {
                    // Ensure libs are available (lazy-load)
                    if (typeof ensurePDFLibs === 'function') {
                        await ensurePDFLibs();
                    } else {
                        // Fallback if helper not yet defined
                        if (!window.html2canvas) await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
                        if (!(window.jspdf && window.jspdf.jsPDF)) await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
                    }
                    const { jsPDF } = window.jspdf || {};
                    const element = document.getElementById(elementId);
                    if (!element || !jsPDF || !window.html2canvas) return;
                    showNotification("جاري إعداد ملف الـ PDF...", 'warning', 2000);
                    const canvas = await window.html2canvas(element, { scale: 2, useCORS: true });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                    pdf.setProperties({ title: `تقرير ${title} - د. عمر العماد`, author: 'موقع د. عمر العماد - TibraSoul' });
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, 0);
                    pdf.save(`${title.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`);
                } catch (e) {
                    console.error('PDF export failed:', e);
                    showNotification("تعذر إنشاء ملف PDF. حاول مجدداً.", 'error', 2500);
                }
            }

            // --- FREQUENCY GENERATOR MODULE (ROBUST & UPGRADED) ---
            function checkCombinedStatus() {
                try {
                    const freqOn = !document.getElementById('frequency-status')?.classList.contains('hidden') || !document.getElementById('stop-freq-btn')?.classList.contains('hidden');
                    const musicOn = !document.getElementById('music-status')?.classList.contains('hidden');
                    const bar = document.getElementById('combined-status');
                    if (bar) bar.classList.toggle('hidden', !(freqOn && musicOn));
                } catch (e) {}
            }
            
            let frequencyGeneratorInitialized = false;
            async function initFrequencyGenerator() {
                if (frequencyGeneratorInitialized) {
                    console.log('Frequency generator already initialized');
                    return;
                }
                frequencyGeneratorInitialized = true;
                await ensureTone();
                const audioPrompt = document.getElementById('audio-init-prompt');
                const startAudioBtn = document.getElementById('start-audio-btn');
                const playerContainer = document.getElementById('frequency-player-container');
                const stopFreqBtn = document.getElementById('stop-freq-btn');
                const canvas = document.getElementById('frequency-canvas');
                const musicPlayer = document.getElementById('background-music');
                const musicPlayPauseBtn = document.getElementById('music-play-pause-btn');
                const musicVolumeSlider = document.getElementById('music-volume');

                if (!startAudioBtn || !playerContainer) return;

                let audioContext, oscillator, analyser, gainNode, animationFrameId;
                let isAudioInitialized = false;
                const canvasCtx = canvas ? canvas.getContext('2d') : null;
                
                // Advanced controls
                let currentWaveform = 'sine';
                let binauralBaseFreq = 200;
                let currentFrequency = null;
                let favorites = JSON.parse(localStorage.getItem('tibrah-freq-favorites') || '[]');

                const allFreqButtons = document.querySelectorAll('.freq-btn');

                const setupAudioSystem = async () => {
                    if (isAudioInitialized) return true;
                    try {
                        await Tone.start();
                        audioContext = Tone.context;
                        analyser = new Tone.Analyser('waveform', 1024);
                        gainNode = new Tone.Gain(0.5).toDestination();
                        isAudioInitialized = true;
                        console.log("Audio Context is ready.");
                        audioPrompt.classList.add('hidden');
                        playerContainer.classList.remove('hidden');
                        return true;
                    } catch (e) {
                        console.error("Could not start Audio Context: ", e);
                        showNotification("لا يمكن تشغيل الصوت. يرجى التفاعل مع الصفحة أولاً.", "error");
                        return false;
                    }
                };

                startAudioBtn.addEventListener('click', setupAudioSystem);

                let playFrequency = (freq) => {
                    if (!isAudioInitialized) return;

                    // allow simultaneous: do not pause music here

                    if (oscillator) {
                        oscillator.disconnect();
                        oscillator.stop();
                    }

                    oscillator = new Tone.Oscillator(freq, currentWaveform).connect(analyser).connect(gainNode);
                    oscillator.volume.value = -9;
                    oscillator.start();

                    currentFrequency = freq;
                    stopFreqBtn.classList.remove('hidden');
                    document.getElementById('frequency-status')?.classList.remove('hidden');
                    try { checkCombinedStatus(); } catch {}
                    if (!animationFrameId) visualize();
                };

                const stopFrequency = () => {
                    if (oscillator) {
                        oscillator.stop();
                        oscillator.disconnect();
                        oscillator = null;
                    }
                    currentFrequency = null;
                    stopFreqBtn.classList.add('hidden');
                    allFreqButtons.forEach(b => b.classList.remove('active'));
                    document.getElementById('frequency-status')?.classList.add('hidden');
                    try { checkCombinedStatus(); } catch {}
                };

                function visualize() {
                    if (!canvas || !canvasCtx) return;
                    let visualMode = 'waveform'; // 'waveform', 'spectrum', 'circular'
                    
                    // Add spectrum analyzer
                    const spectrumAnalyser = new Tone.Analyser('fft', 512);
                    if (oscillator) oscillator.connect(spectrumAnalyser);
                    
                    const draw = () => {
                        animationFrameId = requestAnimationFrame(draw);
                        if (!analyser || !oscillator || !canvasCtx || !canvas) {
                            if (canvasCtx && canvas) {
                                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                            }
                            return;
                        }
                        
                        // Clear canvas with gradient background
                        const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
                        gradient.addColorStop(0, '#1a1a2e');
                        gradient.addColorStop(1, '#16213e');
                        canvasCtx.fillStyle = gradient;
                        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        if (visualMode === 'waveform') {
                            drawWaveform();
                        } else if (visualMode === 'spectrum') {
                            drawSpectrum();
                        } else if (visualMode === 'circular') {
                            drawCircular();
                        }
                        
                        // Add frequency info overlay
                        drawFrequencyInfo();
                    };
                    
                    const drawWaveform = () => {
                        const waveform = analyser.getValue();
                        canvasCtx.lineWidth = 3;
                        
                        // Create gradient stroke
                        const strokeGradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
                        strokeGradient.addColorStop(0, '#ff6b6b');
                        strokeGradient.addColorStop(0.5, '#4ecdc4');
                        strokeGradient.addColorStop(1, '#45b7d1');
                        canvasCtx.strokeStyle = strokeGradient;
                        
                        canvasCtx.beginPath();
                        for (let i = 0; i < waveform.length; i++) {
                            const x = (i / (waveform.length - 1)) * canvas.width;
                            const y = (waveform[i] + 1) / 2 * canvas.height;
                            if (i === 0) canvasCtx.moveTo(x, y);
                            else canvasCtx.lineTo(x, y);
                        }
                        canvasCtx.stroke();
                        
                        // Add glow effect
                        canvasCtx.shadowColor = '#4ecdc4';
                        canvasCtx.shadowBlur = 10;
                        canvasCtx.stroke();
                        canvasCtx.shadowBlur = 0;
                    };
                    
                    const drawSpectrum = () => {
                        const spectrum = spectrumAnalyser.getValue();
                        const barWidth = canvas.width / spectrum.length;
                        
                        for (let i = 0; i < spectrum.length; i++) {
                            const barHeight = (spectrum[i] + 140) * 2; // Convert dB to pixel height
                            const hue = (i / spectrum.length) * 360;
                            
                            canvasCtx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
                            canvasCtx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
                            
                            // Add glow effect for bars
                            canvasCtx.shadowColor = `hsl(${hue}, 70%, 60%)`;
                            canvasCtx.shadowBlur = 5;
                            canvasCtx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
                            canvasCtx.shadowBlur = 0;
                        }
                    };
                    
                    const drawCircular = () => {
                        const waveform = analyser.getValue();
                        const centerX = canvas.width / 2;
                        const centerY = canvas.height / 2;
                        const radius = Math.min(centerX, centerY) * 0.7;
                        
                        canvasCtx.lineWidth = 2;
                        canvasCtx.strokeStyle = '#4ecdc4';
                        canvasCtx.beginPath();
                        
                        for (let i = 0; i < waveform.length; i++) {
                            const angle = (i / waveform.length) * Math.PI * 2;
                            const amplitude = waveform[i] * 50;
                            const x = centerX + Math.cos(angle) * (radius + amplitude);
                            const y = centerY + Math.sin(angle) * (radius + amplitude);
                            
                            if (i === 0) canvasCtx.moveTo(x, y);
                            else canvasCtx.lineTo(x, y);
                        }
                        canvasCtx.closePath();
                        canvasCtx.stroke();
                        
                        // Add center circle
                        canvasCtx.beginPath();
                        canvasCtx.arc(centerX, centerY, 5, 0, Math.PI * 2);
                        canvasCtx.fillStyle = '#ff6b6b';
                        canvasCtx.fill();
                    };
                    
                    const drawFrequencyInfo = () => {
                        if (!currentFrequency) return;
                        
                        canvasCtx.font = 'bold 16px Arial';
                        canvasCtx.fillStyle = '#ffffff';
                        canvasCtx.textAlign = 'right';
                        canvasCtx.fillText(`${currentFrequency} Hz`, canvas.width - 10, 25);
                        
                        canvasCtx.font = '12px Arial';
                        canvasCtx.fillText(currentWaveform.toUpperCase(), canvas.width - 10, 45);
                        
                        // Mode indicator
                        canvasCtx.textAlign = 'left';
                        canvasCtx.fillText(`Mode: ${visualMode}`, 10, 25);
                    };
                    
                    // Add click handler to cycle through visualization modes
                    if (canvas) {
                        canvas.addEventListener('click', () => {
                            const modes = ['waveform', 'spectrum', 'circular'];
                            const currentIndex = modes.indexOf(visualMode);
                            visualMode = modes[(currentIndex + 1) % modes.length];
                            showNotification(`تم تغيير وضع العرض إلى: ${visualMode}`, 'info');
                        });
                    }
                    
                    draw();
                }

                allFreqButtons.forEach(button => {
                    button.addEventListener('click', async (e) => {
                        if (!isAudioInitialized) {
                            const audioReady = await setupAudioSystem();
                            if (!audioReady) return;
                        }
                        allFreqButtons.forEach(b => b.classList.remove('active'));
                        button.classList.add('active');
                        const freq = parseFloat(button.dataset.freq);
                        playFrequency(freq);
                    });
                });

                if (stopFreqBtn) {
                    stopFreqBtn.addEventListener('click', stopFrequency);
                }

                // Music Player Logic handled centrally by initMusicPlayer() below to avoid duplicate handlers
                if (musicVolumeSlider && musicPlayer) {
                    musicVolumeSlider.addEventListener('input', (e) => {
                        musicPlayer.volume = e.target.value;
                    });
                }
                
                // Category Tab Switching
                const categoryTabs = document.querySelectorAll('.freq-category-tab');
                const categoryContents = document.querySelectorAll('.freq-category-content');
                
                categoryTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const targetCategory = tab.dataset.category;
                        
                        // Update tab styles
                        categoryTabs.forEach(t => {
                            t.classList.remove('active', 'bg-purple-500', 'text-white');
                            t.classList.add('bg-gray-200', 'text-gray-700');
                        });
                        tab.classList.remove('bg-gray-200', 'text-gray-700');
                        tab.classList.add('active', 'bg-purple-500', 'text-white');
                        
                        // Show/hide content sections
                        categoryContents.forEach(content => {
                            if (content.dataset.category === targetCategory) {
                                content.classList.remove('hidden');
                                content.classList.add('active');
                            } else {
                                content.classList.add('hidden');
                                content.classList.remove('active');
                            }
                        });
                        
                        showNotification(`تم التبديل إلى ${tab.textContent.trim()}`, 'info');
                    });
                });
                
                // Advanced Controls Event Listeners
                const customFreqInput = document.getElementById('custom-freq-input');
                const playCustomBtn = document.getElementById('play-custom-freq');
                const waveformSelector = document.getElementById('waveform-selector');
                const binauralBaseInput = document.getElementById('binaural-base');
                const presetBtns = document.querySelectorAll('.preset-btn');
                
                // Custom frequency input
                playCustomBtn?.addEventListener('click', async () => {
                    if (!isAudioInitialized) {
                        const audioReady = await setupAudioSystem();
                        if (!audioReady) return;
                    }
                    
                    const freq = parseFloat(customFreqInput.value);
                    if (freq && freq >= 1 && freq <= 20000) {
                        allFreqButtons.forEach(b => b.classList.remove('active'));
                        playFrequency(freq);
                        showNotification(`تم تشغيل التردد المخصص ${freq} Hz`, 'success');
                    } else {
                        showNotification('يرجى إدخال تردد صحيح بين 1-20000 Hz', 'error');
                    }
                });
                
                // Enter key support for custom frequency
                customFreqInput?.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        playCustomBtn.click();
                    }
                });
                
                // Waveform selector
                waveformSelector?.addEventListener('change', (e) => {
                    currentWaveform = e.target.value;
                    showNotification(`تم تغيير نوع الموجة إلى ${e.target.options[e.target.selectedIndex].text}`, 'info');
                });
                
                // Binaural base frequency
                binauralBaseInput?.addEventListener('input', (e) => {
                    binauralBaseFreq = parseInt(e.target.value);
                });
                
                // Preset buttons
                presetBtns.forEach(btn => {
                    btn.addEventListener('click', async () => {
                        if (!isAudioInitialized) {
                            const audioReady = await setupAudioSystem();
                            if (!audioReady) return;
                        }
                        
                        const freq = parseFloat(btn.dataset.freq);
                        const wave = btn.dataset.wave;
                        
                        if (wave && wave !== currentWaveform) {
                            currentWaveform = wave;
                            waveformSelector.value = wave;
                        }
                        
                        allFreqButtons.forEach(b => b.classList.remove('active'));
                        playFrequency(freq);
                        
                        // Visual feedback for preset button
                        presetBtns.forEach(b => b.classList.remove('ring-2', 'ring-blue-400'));
                        btn.classList.add('ring-2', 'ring-blue-400');
                        setTimeout(() => btn.classList.remove('ring-2', 'ring-blue-400'), 2000);
                    });
                });
                
                // Favorites System
                const saveFavoriteBtn = document.getElementById('save-favorite');
                const clearFavoritesBtn = document.getElementById('clear-favorites');
                const exportFavoritesBtn = document.getElementById('export-favorites');
                const importFavoritesBtn = document.getElementById('import-favorites-btn');
                const importFavoritesInput = document.getElementById('import-favorites');
                const favoritesContainer = document.getElementById('favorites-container');
                
                const renderFavorites = () => {
                    if (favorites.length === 0) {
                        favoritesContainer.innerHTML = '<span class="text-gray-400 text-sm">لا توجد ترددات محفوظة</span>';
                        return;
                    }
                    
                    favoritesContainer.innerHTML = favorites.map((fav, index) => `
                        <button class="favorite-btn px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm hover:bg-yellow-200 transition flex items-center gap-1"
                                data-freq="${fav.freq}" data-wave="${fav.wave}" data-index="${index}">
                            ${fav.name} (${fav.freq}Hz)
                            <span class="remove-fav text-red-500 hover:text-red-700 ml-1 cursor-pointer" data-index="${index}">×</span>
                        </button>
                    `).join('');
                    
                    // Add event listeners for favorite buttons
                    document.querySelectorAll('.favorite-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            if (e.target.classList.contains('remove-fav')) return;
                            
                            if (!isAudioInitialized) {
                                const audioReady = await setupAudioSystem();
                                if (!audioReady) return;
                            }
                            
                            const freq = parseFloat(btn.dataset.freq);
                            const wave = btn.dataset.wave;
                            
                            if (wave !== currentWaveform) {
                                currentWaveform = wave;
                                waveformSelector.value = wave;
                            }
                            
                            allFreqButtons.forEach(b => b.classList.remove('active'));
                            playFrequency(freq);
                            showNotification(`تم تشغيل التردد المفضل: ${freq}Hz`, 'success');
                        });
                    });
                    
                    // Remove favorite buttons
                    document.querySelectorAll('.remove-fav').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const index = parseInt(btn.dataset.index);
                            favorites.splice(index, 1);
                            localStorage.setItem('tibrah-freq-favorites', JSON.stringify(favorites));
                            renderFavorites();
                            showNotification('تم حذف التردد من المفضلة', 'info');
                        });
                    });
                };
                
                saveFavoriteBtn?.addEventListener('click', () => {
                    if (!currentFrequency) {
                        showNotification('يرجى تشغيل تردد أولاً لحفظه', 'error');
                        return;
                    }
                    
                    const name = prompt('اسم التردد المفضل:', `تردد ${currentFrequency}Hz`);
                    if (!name) return;
                    
                    const favorite = {
                        name: name.trim(),
                        freq: currentFrequency,
                        wave: currentWaveform,
                        date: new Date().toISOString()
                    };
                    
                    // Check if already exists
                    const exists = favorites.find(f => f.freq === currentFrequency && f.wave === currentWaveform);
                    if (exists) {
                        showNotification('هذا التردد محفوظ مسبقاً', 'warning');
                        return;
                    }
                    
                    favorites.push(favorite);
                    localStorage.setItem('tibrah-freq-favorites', JSON.stringify(favorites));
                    renderFavorites();
                    showNotification(`تم حفظ ${name} في المفضلة`, 'success');
                });
                
                clearFavoritesBtn?.addEventListener('click', () => {
                    if (confirm('هل تريد مسح جميع الترددات المفضلة؟')) {
                        favorites = [];
                        localStorage.removeItem('tibrah-freq-favorites');
                        renderFavorites();
                        showNotification('تم مسح جميع المفضلات', 'info');
                    }
                });
                
                exportFavoritesBtn?.addEventListener('click', () => {
                    if (favorites.length === 0) {
                        showNotification('لا توجد مفضلات للتصدير', 'warning');
                        return;
                    }
                    
                    const dataStr = JSON.stringify(favorites, null, 2);
                    const dataBlob = new Blob([dataStr], {type: 'application/json'});
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `tibrah-favorites-${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                    showNotification('تم تصدير المفضلات', 'success');
                });
                
                importFavoritesBtn?.addEventListener('click', () => {
                    importFavoritesInput.click();
                });
                
                importFavoritesInput?.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importedFavorites = JSON.parse(e.target.result);
                            if (Array.isArray(importedFavorites)) {
                                favorites = [...favorites, ...importedFavorites];
                                localStorage.setItem('tibrah-freq-favorites', JSON.stringify(favorites));
                                renderFavorites();
                                showNotification(`تم استيراد ${importedFavorites.length} تردد`, 'success');
                            } else {
                                showNotification('ملف غير صحيح', 'error');
                            }
                        } catch (err) {
                            showNotification('خطأ في قراءة الملف', 'error');
                        }
                    };
                    reader.readAsText(file);
                });
                
                // Enhanced Timer System
                let timerInterval = null;
                let timerDuration = 0;
                let timerRemaining = 0;
                
                const timerDisplay = document.getElementById('timer-display');
                const timerProgress = document.getElementById('timer-progress');
                const timerProgressBar = document.getElementById('timer-progress-bar');
                const timerStartStopBtn = document.getElementById('timer-start-stop');
                const timerAutoStop = document.getElementById('timer-auto-stop');
                const timerNotification = document.getElementById('timer-notification');
                
                const formatTime = (seconds) => {
                    const mins = Math.floor(seconds / 60);
                    const secs = seconds % 60;
                    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                };
                
                const updateTimerDisplay = () => {
                    if (timerDisplay) timerDisplay.textContent = formatTime(timerRemaining);
                    if (timerProgressBar && timerDuration > 0) {
                        const progress = ((timerDuration - timerRemaining) / timerDuration) * 100;
                        timerProgressBar.style.width = `${progress}%`;
                    }
                };
                
                const startTimer = (minutes) => {
                    if (timerInterval) clearInterval(timerInterval);
                    
                    timerDuration = minutes * 60;
                    timerRemaining = timerDuration;
                    
                    timerDisplay?.classList.remove('hidden');
                    timerProgress?.classList.remove('hidden');
                    timerStartStopBtn?.classList.remove('hidden');
                    timerStartStopBtn.textContent = 'إيقاف المؤقت';
                    
                    updateTimerDisplay();
                    
                    timerInterval = setInterval(() => {
                        timerRemaining--;
                        updateTimerDisplay();
                        
                        if (timerRemaining <= 0) {
                            clearInterval(timerInterval);
                            timerInterval = null;
                            
                            // Timer finished
                            if (timerNotification?.checked) {
                                showNotification('انتهت جلسة العلاج بالترددات! 🎵', 'success', 5000);
                                // Play notification sound
                                try {
                                    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
                                    audio.play().catch(() => {});
                                } catch (e) {}
                            }
                            
                            if (timerAutoStop?.checked) {
                                stopFrequency();
                                showNotification('تم إيقاف التردد تلقائياً', 'info');
                            }
                            
                            timerStartStopBtn.textContent = 'بدء المؤقت';
                            timerProgressBar.style.width = '100%';
                        }
                    }, 1000);
                };
                
                const stopTimer = () => {
                    if (timerInterval) {
                        clearInterval(timerInterval);
                        timerInterval = null;
                    }
                    timerDisplay?.classList.add('hidden');
                    timerProgress?.classList.add('hidden');
                    timerStartStopBtn?.classList.add('hidden');
                    timerStartStopBtn.textContent = 'بدء المؤقت';
                };
                
                // Timer button event listeners
                [5, 10, 20, 30, 45].forEach(minutes => {
                    const btn = document.getElementById(`timer-${minutes}`);
                    btn?.addEventListener('click', () => {
                        startTimer(minutes);
                        showNotification(`تم بدء مؤقت ${minutes} دقيقة`, 'info');
                    });
                });
                
                document.getElementById('set-custom-timer')?.addEventListener('click', () => {
                    const minutes = parseInt(document.getElementById('custom-timer-input')?.value);
                    if (minutes && minutes >= 1 && minutes <= 120) {
                        startTimer(minutes);
                        showNotification(`تم بدء مؤقت مخصص ${minutes} دقيقة`, 'info');
                    } else {
                        showNotification('يرجى إدخال عدد دقائق صحيح (1-120)', 'error');
                    }
                });
                
                timerStartStopBtn?.addEventListener('click', () => {
                    if (timerInterval) {
                        stopTimer();
                        showNotification('تم إيقاف المؤقت', 'info');
                    }
                });
                
                // Fullscreen canvas functionality
                const fullscreenCanvasBtn = document.getElementById('fullscreen-canvas');
                fullscreenCanvasBtn?.addEventListener('click', () => {
                    if (!canvas) return;
                    
                    // Create fullscreen modal
                    const modal = document.createElement('div');
                    modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center';
                    modal.innerHTML = `
                        <div class="relative w-full h-full max-w-6xl max-h-4xl p-4">
                            <canvas id="fullscreen-frequency-canvas" class="w-full h-full border-2 border-white rounded-lg cursor-pointer"></canvas>
                            <button class="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                                إغلاق ✕
                            </button>
                            <div class="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg">
                                <div class="text-sm">انقر على الكانفاس للتبديل بين أوضاع العرض</div>
                                <div class="text-xs mt-1">الأوضاع: موجة صوتية • طيف ترددي • دائري</div>
                            </div>
                        </div>
                    `;
                    
                    document.body.appendChild(modal);
                    
                    // Setup fullscreen canvas
                    const fullscreenCanvas = modal.querySelector('#fullscreen-frequency-canvas');
                    const fullscreenCtx = fullscreenCanvas.getContext('2d');
                    fullscreenCanvas.width = fullscreenCanvas.offsetWidth;
                    fullscreenCanvas.height = fullscreenCanvas.offsetHeight;
                    
                    // Copy visualization to fullscreen
                    let fsVisualMode = 'waveform';
                    const fsSpectrumAnalyser = new Tone.Analyser('fft', 1024);
                    if (oscillator) oscillator.connect(fsSpectrumAnalyser);
                    
                    const drawFullscreen = () => {
                        if (!modal.parentNode) return; // Stop if modal is closed
                        
                        requestAnimationFrame(drawFullscreen);
                        
                        if (!analyser || !oscillator) {
                            fullscreenCtx.clearRect(0, 0, fullscreenCanvas.width, fullscreenCanvas.height);
                            return;
                        }
                        
                        // Enhanced gradient background
                        const gradient = fullscreenCtx.createRadialGradient(
                            fullscreenCanvas.width/2, fullscreenCanvas.height/2, 0,
                            fullscreenCanvas.width/2, fullscreenCanvas.height/2, Math.max(fullscreenCanvas.width, fullscreenCanvas.height)/2
                        );
                        gradient.addColorStop(0, '#0f0f23');
                        gradient.addColorStop(1, '#1a1a2e');
                        fullscreenCtx.fillStyle = gradient;
                        fullscreenCtx.fillRect(0, 0, fullscreenCanvas.width, fullscreenCanvas.height);
                        
                        // Draw visualization based on mode
                        if (fsVisualMode === 'waveform') {
                            drawFullscreenWaveform();
                        } else if (fsVisualMode === 'spectrum') {
                            drawFullscreenSpectrum();
                        } else if (fsVisualMode === 'circular') {
                            drawFullscreenCircular();
                        }
                        
                        // Enhanced info overlay
                        drawFullscreenInfo();
                    };
                    
                    const drawFullscreenWaveform = () => {
                        const waveform = analyser.getValue();
                        fullscreenCtx.lineWidth = 4;
                        
                        const strokeGradient = fullscreenCtx.createLinearGradient(0, 0, fullscreenCanvas.width, 0);
                        strokeGradient.addColorStop(0, '#ff6b6b');
                        strokeGradient.addColorStop(0.3, '#4ecdc4');
                        strokeGradient.addColorStop(0.7, '#45b7d1');
                        strokeGradient.addColorStop(1, '#96ceb4');
                        fullscreenCtx.strokeStyle = strokeGradient;
                        
                        fullscreenCtx.beginPath();
                        for (let i = 0; i < waveform.length; i++) {
                            const x = (i / (waveform.length - 1)) * fullscreenCanvas.width;
                            const y = (waveform[i] + 1) / 2 * fullscreenCanvas.height;
                            if (i === 0) fullscreenCtx.moveTo(x, y);
                            else fullscreenCtx.lineTo(x, y);
                        }
                        fullscreenCtx.stroke();
                        
                        // Enhanced glow effect
                        fullscreenCtx.shadowColor = '#4ecdc4';
                        fullscreenCtx.shadowBlur = 20;
                        fullscreenCtx.stroke();
                        fullscreenCtx.shadowBlur = 0;
                    };
                    
                    const drawFullscreenSpectrum = () => {
                        const spectrum = fsSpectrumAnalyser.getValue();
                        const barWidth = fullscreenCanvas.width / spectrum.length;
                        
                        for (let i = 0; i < spectrum.length; i++) {
                            const barHeight = Math.max(0, (spectrum[i] + 140) * 3);
                            const hue = (i / spectrum.length) * 360;
                            
                            fullscreenCtx.fillStyle = `hsla(${hue}, 80%, 65%, 0.9)`;
                            fullscreenCtx.fillRect(i * barWidth, fullscreenCanvas.height - barHeight, barWidth - 2, barHeight);
                            
                            // Enhanced glow
                            fullscreenCtx.shadowColor = `hsl(${hue}, 80%, 65%)`;
                            fullscreenCtx.shadowBlur = 10;
                            fullscreenCtx.fillRect(i * barWidth, fullscreenCanvas.height - barHeight, barWidth - 2, barHeight);
                            fullscreenCtx.shadowBlur = 0;
                        }
                    };
                    
                    const drawFullscreenCircular = () => {
                        const waveform = analyser.getValue();
                        const centerX = fullscreenCanvas.width / 2;
                        const centerY = fullscreenCanvas.height / 2;
                        const radius = Math.min(centerX, centerY) * 0.6;
                        
                        fullscreenCtx.lineWidth = 3;
                        fullscreenCtx.strokeStyle = '#4ecdc4';
                        fullscreenCtx.beginPath();
                        
                        for (let i = 0; i < waveform.length; i++) {
                            const angle = (i / waveform.length) * Math.PI * 2;
                            const amplitude = waveform[i] * 100;
                            const x = centerX + Math.cos(angle) * (radius + amplitude);
                            const y = centerY + Math.sin(angle) * (radius + amplitude);
                            
                            if (i === 0) fullscreenCtx.moveTo(x, y);
                            else fullscreenCtx.lineTo(x, y);
                        }
                        fullscreenCtx.closePath();
                        fullscreenCtx.stroke();
                        
                        // Enhanced center
                        fullscreenCtx.beginPath();
                        fullscreenCtx.arc(centerX, centerY, 8, 0, Math.PI * 2);
                        fullscreenCtx.fillStyle = '#ff6b6b';
                        fullscreenCtx.fill();
                        
                        // Add frequency rings
                        for (let ring = 1; ring <= 3; ring++) {
                            fullscreenCtx.beginPath();
                            fullscreenCtx.arc(centerX, centerY, radius * ring / 3, 0, Math.PI * 2);
                            fullscreenCtx.strokeStyle = `rgba(255, 255, 255, ${0.1 * ring})`;
                            fullscreenCtx.lineWidth = 1;
                            fullscreenCtx.stroke();
                        }
                    };
                    
                    const drawFullscreenInfo = () => {
                        if (!currentFrequency) return;
                        
                        fullscreenCtx.font = 'bold 24px Arial';
                        fullscreenCtx.fillStyle = '#ffffff';
                        fullscreenCtx.textAlign = 'right';
                        fullscreenCtx.fillText(`${currentFrequency} Hz`, fullscreenCanvas.width - 20, 40);
                        
                        fullscreenCtx.font = '16px Arial';
                        fullscreenCtx.fillText(currentWaveform.toUpperCase(), fullscreenCanvas.width - 20, 65);
                        
                        fullscreenCtx.textAlign = 'left';
                        fullscreenCtx.fillText(`Mode: ${fsVisualMode}`, 20, 40);
                    };
                    
                    // Mode switching for fullscreen
                    fullscreenCanvas.addEventListener('click', () => {
                        const modes = ['waveform', 'spectrum', 'circular'];
                        const currentIndex = modes.indexOf(fsVisualMode);
                        fsVisualMode = modes[(currentIndex + 1) % modes.length];
                    });
                    
                    // Close modal
                    modal.querySelector('button').addEventListener('click', () => {
                        document.body.removeChild(modal);
                    });
                    
                    // Start fullscreen animation
                    drawFullscreen();
                });
                
                // Initialize favorites display
                renderFavorites();
                
                // === ENHANCED MUSIC PLAYER SYSTEM ===
                const musicTracks = [
                    {
                        src: 'https://www.bensound.com/bensound-music/bensound-slowmotion.mp3',
                        title: 'حركة بطيئة - تأمل عميق',
                        desc: 'موسيقى هادئة للتأمل',
                        icon: '🧘'
                    },
                    {
                        src: 'https://www.bensound.com/bensound-music/bensound-relaxing.mp3',
                        title: 'موسيقى الاسترخاء',
                        desc: 'للراحة والهدوء النفسي',
                        icon: '🌿'
                    },
                    {
                        src: 'https://www.bensound.com/bensound-music/bensound-pianomoment.mp3',
                        title: 'لحظة بيانو',
                        desc: 'بيانو ناعم ومريح',
                        icon: '🎹'
                    },
                    {
                        src: 'https://www.bensound.com/bensound-music/bensound-sunny.mp3',
                        title: 'مشرق ومفعم بالطاقة',
                        desc: 'موسيقى إيجابية منعشة',
                        icon: '☀️'
                    }
                ];
                
                let currentTrackIndex = -1;
                let isShuffleOn = false;
                let isLoopOn = true; // Default loop is on
                
                const musicTrackButtons = document.querySelectorAll('.music-track-btn');
                const musicIcon = document.getElementById('music-icon');
                const musicTitleEl = document.getElementById('music-title');
                const musicDescEl = document.getElementById('music-desc');
                const musicPlayPauseBtnNew = document.getElementById('music-play-pause-btn');
                const musicPrevBtn = document.getElementById('music-prev-btn');
                const musicNextBtn = document.getElementById('music-next-btn');
                const musicVolumeNew = document.getElementById('music-volume');
                const volumePercent = document.getElementById('volume-percent');
                const progressBar = document.getElementById('progress-bar');
                const progressContainer = document.getElementById('progress-container');
                const currentTimeEl = document.getElementById('current-time');
                const totalTimeEl = document.getElementById('total-time');
                const shuffleBtn = document.getElementById('shuffle-btn');
                const loopBtn = document.getElementById('loop-btn');
                const musicStatus = document.getElementById('music-status');
                
                // Format time helper
                const formatMusicTime = (seconds) => {
                    const mins = Math.floor(seconds / 60);
                    const secs = Math.floor(seconds % 60);
                    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                };
                
                // Load track
                function loadTrack(index) {
                    if (index < 0 || index >= musicTracks.length) return;
                    
                    currentTrackIndex = index;
                    const track = musicTracks[index];
                    
                    musicPlayer.src = track.src;
                    musicIcon.textContent = track.icon;
                    musicTitleEl.textContent = track.title;
                    musicDescEl.textContent = track.desc;
                    
                    // Update track buttons visual
                    musicTrackButtons.forEach((btn, idx) => {
                        if (idx === index) {
                            btn.classList.add('ring-4', 'ring-purple-500', 'scale-105');
                        } else {
                            btn.classList.remove('ring-4', 'ring-purple-500', 'scale-105');
                        }
                    });
                }
                
                // Play track
                async function playTrack() {
                    try {
                        await musicPlayer.play();
                        musicPlayPauseBtnNew.innerHTML = '<span class="text-3xl">⏸️</span>';
                        musicStatus.classList.remove('hidden');
                        musicIcon.classList.remove('animate-pulse');
                        musicIcon.classList.add('playing');
                        showNotification(`يتم تشغيل: ${musicTracks[currentTrackIndex].title}`, 'success');
                    } catch (err) {
                        showNotification('فشل تشغيل الموسيقى', 'error');
                        console.error('Music play error:', err);
                    }
                }
                
                // Pause track
                function pauseTrack() {
                    musicPlayer.pause();
                    musicPlayPauseBtnNew.innerHTML = '<span class="text-3xl">▶️</span>';
                    musicStatus.classList.add('hidden');
                    musicIcon.classList.remove('playing');
                    musicIcon.classList.add('animate-pulse');
                }
                
                // Track selection buttons
                musicTrackButtons.forEach((btn, index) => {
                    btn.addEventListener('click', async () => {
                        // Ensure audio system is initialized
                        if (!isAudioInitialized) {
                            const audioReady = await setupAudioSystem();
                            if (!audioReady) {
                                // Try to play music anyway (doesn't need Tone.js)
                                loadTrack(index);
                                playTrack();
                                return;
                            }
                        }
                        loadTrack(index);
                        playTrack();
                    });
                });
                
                // Play/Pause button
                musicPlayPauseBtnNew?.addEventListener('click', () => {
                    if (currentTrackIndex === -1) {
                        // No track loaded, load first
                        loadTrack(0);
                        playTrack();
                    } else if (musicPlayer.paused) {
                        playTrack();
                    } else {
                        pauseTrack();
                    }
                });
                
                // Previous button
                musicPrevBtn?.addEventListener('click', () => {
                    if (currentTrackIndex > 0) {
                        loadTrack(currentTrackIndex - 1);
                        playTrack();
                    } else {
                        loadTrack(musicTracks.length - 1); // Go to last
                        playTrack();
                    }
                });
                
                // Next button
                musicNextBtn?.addEventListener('click', () => {
                    if (isShuffleOn) {
                        // Random track
                        let randomIndex;
                        do {
                            randomIndex = Math.floor(Math.random() * musicTracks.length);
                        } while (randomIndex === currentTrackIndex && musicTracks.length > 1);
                        loadTrack(randomIndex);
                    } else if (currentTrackIndex < musicTracks.length - 1) {
                        loadTrack(currentTrackIndex + 1);
                    } else {
                        loadTrack(0); // Go to first
                    }
                    playTrack();
                });
                
                // Volume control
                musicVolumeNew?.addEventListener('input', (e) => {
                    const vol = parseFloat(e.target.value);
                    musicPlayer.volume = vol;
                    volumePercent.textContent = Math.round(vol * 100) + '%';
                });
                
                // Progress bar update
                musicPlayer.addEventListener('timeupdate', () => {
                    if (musicPlayer.duration) {
                        const progress = (musicPlayer.currentTime / musicPlayer.duration) * 100;
                        progressBar.style.width = progress + '%';
                        currentTimeEl.textContent = formatMusicTime(musicPlayer.currentTime);
                        totalTimeEl.textContent = formatMusicTime(musicPlayer.duration);
                    }
                });
                
                // Click on progress bar to seek
                progressContainer?.addEventListener('click', (e) => {
                    const rect = progressContainer.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percentage = clickX / rect.width;
                    musicPlayer.currentTime = percentage * musicPlayer.duration;
                });
                
                // Shuffle button
                shuffleBtn?.addEventListener('click', () => {
                    isShuffleOn = !isShuffleOn;
                    if (isShuffleOn) {
                        shuffleBtn.classList.add('bg-white/40', 'font-bold');
                        showNotification('تم تفعيل الوضع العشوائي', 'info');
                    } else {
                        shuffleBtn.classList.remove('bg-white/40', 'font-bold');
                        showNotification('تم إلغاء الوضع العشوائي', 'info');
                    }
                });
                
                // Loop button
                loopBtn?.addEventListener('click', () => {
                    isLoopOn = !isLoopOn;
                    musicPlayer.loop = isLoopOn;
                    if (isLoopOn) {
                        loopBtn.classList.add('bg-white/40', 'font-bold');
                        showNotification('تم تفعيل التكرار', 'info');
                    } else {
                        loopBtn.classList.remove('bg-white/40', 'font-bold');
                        showNotification('تم إلغاء التكرار', 'info');
                    }
                });
                
                // Auto next when track ends (if not looping)
                musicPlayer.addEventListener('ended', () => {
                    if (!isLoopOn) {
                        if (isShuffleOn) {
                            let randomIndex;
                            do {
                                randomIndex = Math.floor(Math.random() * musicTracks.length);
                            } while (randomIndex === currentTrackIndex && musicTracks.length > 1);
                            loadTrack(randomIndex);
                        } else if (currentTrackIndex < musicTracks.length - 1) {
                            loadTrack(currentTrackIndex + 1);
                        } else {
                            loadTrack(0);
                        }
                        playTrack();
                    }
                });
                
                // Load metadata
                musicPlayer.addEventListener('loadedmetadata', () => {
                    totalTimeEl.textContent = formatMusicTime(musicPlayer.duration);
                });
                
                // Set default loop on
                musicPlayer.loop = true;
                loopBtn?.classList.add('bg-white/40', 'font-bold');
                
                // === NATURE SOUNDS SYSTEM ===
                const natureSoundsData = {
                    rain: {
                        name: 'المطر',
                        icon: '🌧️',
                        desc: 'قطرات المطر الهادئة',
                        url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_bd0cc0c7ad.mp3'
                    },
                    ocean: {
                        name: 'أمواج البحر',
                        icon: '🌊',
                        desc: 'هدير الأمواج الساحلي',
                        url: 'https://cdn.pixabay.com/audio/2022/06/07/audio_9c6b18ca85.mp3'
                    },
                    forest: {
                        name: 'الغابة',
                        icon: '🌲',
                        desc: 'أصوات الغابة الطبيعية',
                        url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_4a8a280516.mp3'
                    },
                    birds: {
                        name: 'زقزقة العصافير',
                        icon: '🐦',
                        desc: 'تغريد الطيور الصباحي',
                        url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c610232530.mp3'
                    },
                    thunder: {
                        name: 'الرعد والمطر',
                        icon: '⚡',
                        desc: 'عاصفة رعدية قوية',
                        url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3'
                    },
                    wind: {
                        name: 'الرياح',
                        icon: '🍃',
                        desc: 'نسيم الرياح الهادئ',
                        url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_2f2fb46f5e.mp3'
                    },
                    fire: {
                        name: 'نار المدفأة',
                        icon: '🔥',
                        desc: 'طقطقة النار الدافئة',
                        url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_3d53961a95.mp3'
                    },
                    cricket: {
                        name: 'أصوات الليل',
                        icon: '🦗',
                        desc: 'صراصير الليل الهادئة',
                        url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_088586e3e9.mp3'
                    }
                };
                
                const natureSoundButtons = document.querySelectorAll('.nature-sound-btn');
                const naturePlayer = document.getElementById('nature-player');
                const natureAudio = document.getElementById('nature-audio');
                const natureTitle = document.getElementById('nature-title');
                const natureIcon = document.getElementById('nature-icon');
                const natureDesc = document.getElementById('nature-desc');
                const stopNatureBtn = document.getElementById('stop-nature-btn');
                const natureVolume = document.getElementById('nature-volume');
                const natureVolumePercent = document.getElementById('nature-volume-percent');
                
                let currentNatureSound = null;
                
                natureSoundButtons?.forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const soundKey = btn.dataset.sound;
                        const soundData = natureSoundsData[soundKey];
                        
                        if (!soundData) return;
                        
                        // Show player
                        naturePlayer.classList.remove('hidden');
                        
                        // Update UI
                        natureIcon.textContent = soundData.icon;
                        natureTitle.textContent = soundData.name;
                        natureDesc.textContent = soundData.desc;
                        
                        // Play sound
                        natureAudio.src = soundData.url;
                        natureAudio.volume = parseFloat(natureVolume.value);
                        
                        try {
                            await natureAudio.play();
                            currentNatureSound = soundKey;
                            
                            // Visual feedback
                            natureSoundButtons.forEach(b => b.classList.remove('ring-4', 'ring-green-400'));
                            btn.classList.add('ring-4', 'ring-green-400');
                            
                            // Add page-wide visual effect
                            addNatureVisualEffect(soundKey);
                            
                            showNotification(`يتم تشغيل: ${soundData.name}`, 'success');
                        } catch (err) {
                            showNotification('فشل تشغيل الصوت', 'error');
                            console.error('Nature sound error:', err);
                        }
                    });
                });
                
                stopNatureBtn?.addEventListener('click', () => {
                    natureAudio.pause();
                    natureAudio.currentTime = 0;
                    naturePlayer.classList.add('hidden');
                    natureSoundButtons.forEach(b => b.classList.remove('ring-4', 'ring-green-400'));
                    currentNatureSound = null;
                    removeNatureVisualEffect();
                    showNotification('تم إيقاف الصوت', 'info');
                });
                
                natureVolume?.addEventListener('input', (e) => {
                    const vol = parseFloat(e.target.value);
                    natureAudio.volume = vol;
                    natureVolumePercent.textContent = Math.round(vol * 100) + '%';
                });
                
                // === VISUAL EFFECTS FOR FREQUENCY PLAYING ===
                function addNatureVisualEffect(soundType) {
                    const section = document.getElementById('view-frequencies');
                    if (!section) return;
                    
                    // Remove existing effects
                    section.classList.remove('nature-effect-rain', 'nature-effect-ocean', 'nature-effect-forest', 
                                          'nature-effect-birds', 'nature-effect-thunder', 'nature-effect-wind',
                                          'nature-effect-fire', 'nature-effect-cricket');
                    
                    // Add new effect
                    section.classList.add(`nature-effect-${soundType}`);
                    
                    // Animate background
                    section.style.transition = 'all 2s ease-in-out';
                }
                
                function removeNatureVisualEffect() {
                    const section = document.getElementById('view-frequencies');
                    if (!section) return;
                    
                    section.classList.remove('nature-effect-rain', 'nature-effect-ocean', 'nature-effect-forest', 
                                          'nature-effect-birds', 'nature-effect-thunder', 'nature-effect-wind',
                                          'nature-effect-fire', 'nature-effect-cricket');
                }
                
                // === PAGE-WIDE INTERACTIVE EFFECTS WHEN FREQUENCY IS PLAYING ===
                const originalPlayFrequency = playFrequency;
                playFrequency = function(freq) {
                    // Call original function
                    originalPlayFrequency.call(this, freq);
                    
                    // Add page-wide visual feedback
                    const section = document.getElementById('view-frequencies');
                    if (section) {
                        section.classList.add('frequency-active');
                        
                        // Pulse effect
                        const pulseInterval = setInterval(() => {
                            if (!currentFrequency) {
                                clearInterval(pulseInterval);
                                section.classList.remove('frequency-active');
                                return;
                            }
                            
                            // Create ripple effect
                            const ripple = document.createElement('div');
                            ripple.className = 'frequency-ripple';
                            ripple.style.cssText = `
                                position: fixed;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                width: 100px;
                                height: 100px;
                                border: 3px solid rgba(168, 85, 247, 0.6);
                                border-radius: 50%;
                                pointer-events: none;
                                z-index: 9999;
                                animation: rippleEffect 2s ease-out;
                            `;
                            document.body.appendChild(ripple);
                            
                            setTimeout(() => ripple.remove(), 2000);
                        }, 3000);
                    }
                };
                
                // Override stop frequency to remove effects
                const originalStopFreq = document.getElementById('stop-freq-btn')?.onclick;
                document.getElementById('stop-freq-btn')?.addEventListener('click', () => {
                    const section = document.getElementById('view-frequencies');
                    if (section) {
                        section.classList.remove('frequency-active');
                    }
                });
                
                // Add CSS for ripple animation dynamically
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes rippleEffect {
                        0% {
                            width: 100px;
                            height: 100px;
                            opacity: 1;
                        }
                        100% {
                            width: 500px;
                            height: 500px;
                            opacity: 0;
                        }
                    }
                    
                    .frequency-active {
                        animation: pageGlow 3s ease-in-out infinite;
                    }
                    
                    @keyframes pageGlow {
                        0%, 100% {
                            filter: brightness(1);
                        }
                        50% {
                            filter: brightness(1.05);
                        }
                    }
                    
                    /* Nature effect backgrounds */
                    .nature-effect-rain {
                        background: linear-gradient(to bottom, #4b6cb7, #182848) !important;
                    }
                    
                    .nature-effect-ocean {
                        background: linear-gradient(to bottom, #0077be, #00bfff) !important;
                    }
                    
                    .nature-effect-forest {
                        background: linear-gradient(to bottom, #134e5e, #71b280) !important;
                    }
                    
                    .nature-effect-birds {
                        background: linear-gradient(to bottom, #ffd89b, #19547b) !important;
                    }
                    
                    .nature-effect-thunder {
                        background: linear-gradient(to bottom, #2c3e50, #4ca1af) !important;
                    }
                    
                    .nature-effect-wind {
                        background: linear-gradient(to bottom, #bdc3c7, #2c3e50) !important;
                    }
                    
                    .nature-effect-fire {
                        background: linear-gradient(to bottom, #f12711, #f5af19) !important;
                    }
                    
                    .nature-effect-cricket {
                        background: linear-gradient(to bottom, #0f2027, #203a43) !important;
                    }
                    
                    /* Music Player Enhancements */
                    .music-track-btn {
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .music-track-btn::before {
                        content: '';
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        width: 0;
                        height: 0;
                        border-radius: 50%;
                        background: rgba(168, 85, 247, 0.3);
                        transform: translate(-50%, -50%);
                        transition: width 0.6s, height 0.6s;
                    }
                    
                    .music-track-btn:hover::before {
                        width: 300px;
                        height: 300px;
                    }
                    
                    .music-track-btn.active {
                        animation: musicPulse 2s ease-in-out infinite;
                    }
                    
                    @keyframes musicPulse {
                        0%, 100% {
                            transform: scale(1);
                            box-shadow: 0 10px 25px rgba(168, 85, 247, 0.3);
                        }
                        50% {
                            transform: scale(1.05);
                            box-shadow: 0 15px 35px rgba(168, 85, 247, 0.5);
                        }
                    }
                    
                    /* Progress bar click effect */
                    #progress-container:hover {
                        transform: scaleY(1.5);
                        transition: transform 0.2s;
                    }
                    
                    /* Music icon animation */
                    @keyframes musicIconBounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    
                    #music-icon.playing {
                        animation: musicIconBounce 1s ease-in-out infinite;
                    }
                `;
                document.head.appendChild(style);
            }

            // --- BLOG MODULE (ENHANCED WITH BILINGUAL SUPPORT) ---
            function initBlog() {
                const blogGrid = document.getElementById('blog-grid');
                const searchInput = document.getElementById('blog-search');
                const catBtns = document.querySelectorAll('.blog-cat-btn');
                const relatedContainer = document.getElementById('related-posts');
                const featuredWrap = document.getElementById('featured-post');
                const featuredImg = document.getElementById('featured-image');
                const featuredCat = document.getElementById('featured-cat');
                const featuredTitle = document.getElementById('featured-title');
                const featuredExcerpt = document.getElementById('featured-excerpt');
                const featuredRead = document.getElementById('featured-read');
                if (!blogGrid) return;

                // Get current language
                const currentLang = localStorage.getItem('language') || 'ar';

                // ALL BLOG POSTS - COMBINED (Old + Controversial)
                const posts = [
                    {
                        id: 'gut-brain',
                        title: 'هل أمعاؤك هي سبب تقلبات مزاجك؟',
                        image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop',
                        category: 'nutrition',
                        date: '2025-09-20',
                        excerpt: 'اكتشف العلاقة المدهشة بين صحة الجهاز الهضمي وصحتك النفسية.',
                        content: `
                        <h2>العلاقة الخفية بين القناة الهضمية والدماغ</h2>
                        <p>هل تعلم أن أمعاءك يُطلق عليها "الدماغ الثاني"؟ يوجد اتصال ثنائي الاتجاه بين الدماغ والجهاز الهضمي (محور الأمعاء-الدماغ) يؤثر في المزاج والرفاه.</p>
                        <h2>كيف تدعم هذا المحور الهام؟</h2>
                        <ul>
                            <li><strong>ألياف:</strong> خضروات، فواكه، بقول.</li>
                            <li><strong>أطعمة مخمرة:</strong> زبادي، كفير، مخلل ملفوف.</li>
                            <li><strong>تقليل السكر والمصنع:</strong> للحد من الالتهاب.</li>
                            <li><strong>إدارة الإجهاد:</strong> تنفس وتأمل ويوجا.</li>
                        </ul>
                        <p>ابدأ بخطوة صغيرة اليوم؛ صحة أمعائك ترتبط مباشرة بصفاء ذهنك.</p>
                    `
                    },
                    {
                        id: 'breathing',
                        title: 'قوة التنفس: كيف تهدئ جهازك العصبي في 5 دقائق',
                        image: 'https://images.unsplash.com/photo-1599301934984-1d2741913a5f?q=80&w=2070&auto=format&fit=crop',
                        category: 'mind',
                        date: '2025-09-25',
                        excerpt: 'تقنية Box Breathing لخفض التوتر سريعاً.',
                        content: `
                        <h2>أقوى أداة لتنظيم الحالة العصبية</h2>
                        <p>التنفس العميق ينشّط الجهاز اللاودي ويخفّض التوتر بسرعة.</p>
                        <h2>Box Breathing</h2>
                        <ul>
                            <li>شهيق 4 — حبس 4 — زفير 4 — حبس 4 (3-5 دقائق).</li>
                        </ul>
                    `
                    },
                    {
                        id: 'supplements',
                        title: 'أفضل 3 مكملات غذائية لمكافحة الالتهابات',
                        image: 'https://images.unsplash.com/photo-1476837579993-f1d3948f17c2?q=80&w=2070&auto=format&fit=crop',
                        category: 'supplements',
                        date: '2025-09-28',
                        excerpt: 'اختيارات فعالة لخفض الالتهاب المزمن.',
                        content: `
                        <h2>التهاب مزمن: ما العمل؟</h2>
                        <ul>
                            <li>الكركمين + بيبرين.</li>
                            <li>أوميغا-3.</li>
                            <li>مغنيسيوم.</li>
                        </ul>
                        <p><strong>تنبيه:</strong> راجع طبيبك قبل أي مكمل جديد.</p>
                    `
                    },
                    {
                        id: 'golden-turmeric',
                        title: 'الكركم الذهبي: إكسير الشفاء الطبيعي',
                        image: 'https://images.unsplash.com/photo-1609501676725-7186f2c245d5?q=80&w=2070&auto=format&fit=crop',
                        category: 'nutrition',
                        date: '2025-10-01',
                        excerpt: 'اكتشف قوة الكركم الذهبي والمشروبات الطبيعية الشافية للجسم.',
                        content: `
                        <h2>الكركم الذهبي: مشروب الشفاء الأسطوري</h2>
                        <p>يُعتبر الكركم الذهبي من أقوى المشروبات الطبيعية لمحاربة الالتهابات وتعزيز المناعة. يحتوي على الكركمين، المركب النشط الذي يتمتع بخصائص مضادة للالتهاب والأكسدة.</p>

                        <h3>طريقة التحضير المثلى:</h3>
                        <ul>
                            <li><strong>المكونات:</strong> ملعقة صغيرة كركم + رشة فلفل أسود + ملعقة صغيرة زيت جوز الهند + كوب حليب دافئ + عسل للتحلية</li>
                            <li><strong>الطريقة:</strong> امزج المكونات واتركها تنضج على نار هادئة لـ 5 دقائق</li>
                            <li><strong>الوقت المثالي:</strong> قبل النوم أو في المساء</li>
                        </ul>

                        <h3>مشروبات شافية أخرى:</h3>
                        <h4>🌿 شاي البقدونس المنقي:</h4>
                        <ul>
                            <li>ينظف الكلى ويطرد السموم</li>
                            <li>غني بفيتامين C والحديد</li>
                            <li>يساعد في تنظيم ضغط الدم</li>
                        </ul>

                        <h4>🍋 ماء الليمون والزنجبيل:</h4>
                        <ul>
                            <li>ينشط الهضم ويحرق الدهون</li>
                            <li>يقوي المناعة ويحارب الالتهابات</li>
                            <li>يحسن الدورة الدموية</li>
                        </ul>

                        <h4>🌱 شاي الشاي الأخضر بالنعناع:</h4>
                        <ul>
                            <li>مضاد قوي للأكسدة</li>
                            <li>يحسن التركيز والذاكرة</li>
                            <li>يساعد في إنقاص الوزن</li>
                        </ul>

                        <div class="p-4 bg-green-50 border-r-4 border-green-500 rounded">
                            <p><strong>نصيحة مهمة:</strong> اشرب هذه المشروبات بانتظام ولكن بكميات معتدلة. استشر طبيبك إذا كنت تتناول أدوية مميعة للدم أو لديك حصوات في المرارة.</p>
                        </div>
                    `
                    },
                    {
                        id: 'plastic-hormones',
                        title: 'البلاستيك والمواد الكيميائية: تهديد خفي لهرموناتك',
                        image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=2070&auto=format&fit=crop',
                        category: 'nutrition',
                        date: '2025-10-02',
                        excerpt: 'كيف تؤثر المواد الكيميائية في منتجات العناية والبلاستيك على توازنك الهرموني.',
                        content: `
                        <h2>الخطر الخفي: مختلطات الغدد الصماء</h2>
                        <p>نتعرض يومياً لمئات المواد الكيميائية التي تُعرف بـ "مختلطات الغدد الصماء" والتي تحاكي أو تعطل عمل هرموناتنا الطبيعية، مما يؤدي إلى اضطرابات هرمونية خطيرة.</p>

                        <h3>🧴 المواد الكيميائية في منتجات العناية:</h3>
                        <h4>البارابين (Parabens):</h4>
                        <ul>
                            <li>يوجد في: الشامبو، كريمات الوجه، مزيلات العرق</li>
                            <li>التأثير: يحاكي هرمون الإستروجين ويرتبط بسرطان الثدي</li>
                            <li>البديل: منتجات خالية من البارابين أو طبيعية</li>
                        </ul>

                        <h4>الفثالات (Phthalates):</h4>
                        <ul>
                            <li>يوجد في: العطور، طلاء الأظافر، منتجات الشعر</li>
                            <li>التأثير: يقلل هرمون التستوستيرون ويؤثر على الخصوبة</li>
                            <li>البديل: عطور طبيعية، منتجات خالية من الفثالات</li>
                        </ul>

                        <h4>كبريتات الصوديوم (SLS):</h4>
                        <ul>
                            <li>يوجد في: الصابون، الشامبو، معجون الأسنان</li>
                            <li>التأثير: يهيج الجلد ويمكن أن يؤثر على الغدة الدرقية</li>
                            <li>البديل: منتجات خالية من السلفات</li>
                        </ul>

                        <h3>🥤 البلاستيك وتأثيره الهرموني:</h3>
                        <h4>بيسفينول A (BPA):</h4>
                        <ul>
                            <li>يوجد في: زجاجات المياه البلاستيكية، علب الطعام المعدنية</li>
                            <li>التأثير: يحاكي الإستروجين ويرتبط بالعقم والسكري</li>
                            <li>البديل: زجاجات زجاجية أو ستانلس ستيل</li>
                        </ul>

                        <h4>الميكروبلاستيك:</h4>
                        <ul>
                            <li>يوجد في: المياه المعبأة، الأطعمة المعلبة</li>
                            <li>التأثير: يتراكم في الجسم ويؤثر على جهاز الغدد الصماء</li>
                            <li>البديل: فلترة المياه، تجنب الأطعمة المعبأة</li>
                        </ul>

                        <h3>🛡️ كيف تحمي نفسك:</h3>
                        <ol>
                            <li><strong>اقرأ المكونات:</strong> تجنب المنتجات التي تحتوي على البارابين والفثالات</li>
                            <li><strong>استخدم البدائل الطبيعية:</strong> زيت جوز الهند، الصابون الطبيعي، الخل للتنظيف</li>
                            <li><strong>قلل من البلاستيك:</strong> استخدم حاويات زجاجية أو ستانلس ستيل</li>
                            <li><strong>اختر منتجات عضوية:</strong> خاصة لمنتجات العناية الشخصية</li>
                            <li><strong>هوّي منزلك:</strong> لتقليل تراكم المواد الكيميائية</li>
                        </ol>

                        <div class="p-4 bg-red-50 border-r-4 border-red-500 rounded">
                            <p><strong>تحذير مهم:</strong> النساء الحوامل والأطفال أكثر عرضة لتأثيرات هذه المواد. إذا كنت تعاني من اضطرابات هرمونية، راجع طبيبك وفكر في فحص مستويات الهرمونات.</p>
                        </div>
                    `
                    },
                    {
                        id: 'steroids-guide',
                        title: 'الستيرويدات الطبية: دليل شامل للفهم والاستخدام الآمن',
                        image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?q=80&w=2070&auto=format&fit=crop',
                        category: 'supplements',
                        date: '2025-10-03',
                        excerpt: 'فهم شامل للستيرويدات الطبية، أنواعها، استخداماتها، وآثارها الجانبية.',
                        content: `
                        <h2>ما هي الستيرويدات؟</h2>
                        <p>الستيرويدات هي مركبات كيميائية طبيعية أو صناعية تشبه الهرمونات التي ينتجها الجسم. هناك نوعان رئيسيان: الكورتيكوستيرويدات (الطبية) والستيرويدات الابتنائية (المحظورة رياضياً).</p>

                        <h3>🏥 الكورتيكوستيرويدات الطبية:</h3>
                        <p>تحاكي هرمون الكورتيزول الطبيعي الذي تنتجه الغدة الكظرية وتُستخدم لعلاج الالتهابات والأمراض المناعية.</p>

                        <h4>الأنواع الشائعة:</h4>
                        <ul>
                            <li><strong>البريدنيزولون (Prednisolone):</strong> للالتهابات العامة والربو</li>
                            <li><strong>الهيدروكورتيزون:</strong> للأكزيما والالتهابات الجلدية</li>
                            <li><strong>الديكساميثازون:</strong> للالتهابات الشديدة والحساسية</li>
                            <li><strong>البيتاميثازون:</strong> للحقن المفصلي والالتهابات الموضعية</li>
                        </ul>

                        <h4>الاستخدامات الطبية:</h4>
                        <ul>
                            <li>الربو والحساسية الشديدة</li>
                            <li>التهاب المفاصل الروماتويدي</li>
                            <li>الأمراض المناعية (الذئبة، التصلب المتعدد)</li>
                            <li>الالتهابات الجلدية الشديدة</li>
                            <li>زرع الأعضاء (منع الرفض)</li>
                        </ul>

                        <h3>⚠️ الآثار الجانبية المحتملة:</h3>
                        <h4>قصيرة المدى:</h4>
                        <ul>
                            <li>زيادة الشهية والوزن</li>
                            <li>احتباس السوائل والانتفاخ</li>
                            <li>تقلبات مزاجية وأرق</li>
                            <li>ارتفاع السكر وضغط الدم</li>
                        </ul>

                        <h4>طويلة المدى (الاستخدام المزمن):</h4>
                        <ul>
                            <li><strong>هشاشة العظام:</strong> نقص الكالسيوم وضعف العظام</li>
                            <li><strong>قصور الغدة الكظرية:</strong> توقف إنتاج الكورتيزول الطبيعي</li>
                            <li><strong>متلازمة كوشينغ:</strong> وجه مستدير، سمنة في الجذع</li>
                            <li><strong>ضعف المناعة:</strong> زيادة خطر العدوى</li>
                            <li><strong>مشاكل العين:</strong> المياه البيضاء والزرقاء</li>
                        </ul>

                        <h3>🛡️ نصائح للاستخدام الآمن:</h3>
                        <ol>
                            <li><strong>لا تتوقف فجأة:</strong> يجب تقليل الجرعة تدريجياً لتجنب أزمة الغدة الكظرية</li>
                            <li><strong>تناول مع الطعام:</strong> لتقليل تهيج المعدة</li>
                            <li><strong>راقب السكر والضغط:</strong> خاصة إذا كنت مصاباً بالسكري أو الضغط</li>
                            <li><strong>احم عظامك:</strong> تناول الكالسيوم وفيتامين D</li>
                            <li><strong>تجنب الأشخاص المرضى:</strong> لأن مناعتك ضعيفة</li>
                        </ol>

                        <h3>🚫 الستيرويدات الابتنائية (المحظورة):</h3>
                        <p>هذه مختلفة تماماً وتُستخدم بطريقة غير قانونية لبناء العضلات. لها آثار جانبية خطيرة:</p>
                        <ul>
                            <li>تلف الكبد والقلب</li>
                            <li>العقم واضطرابات هرمونية</li>
                            <li>تغيرات نفسية وعدوانية</li>
                            <li>توقف النمو عند المراهقين</li>
                        </ul>

                        <h3>🔍 متى تستشير الطبيب فوراً:</h3>
                        <ul>
                            <li>حمى أو علامات عدوى</li>
                            <li>تغيرات مزاجية شديدة أو اكتئاب</li>
                            <li>ألم في المعدة أو براز أسود</li>
                            <li>تشوش الرؤية أو صداع شديد</li>
                            <li>ضعف عضلي شديد أو كسور متكررة</li>
                        </ul>

                        <div class="p-4 bg-blue-50 border-r-4 border-blue-500 rounded">
                            <p><strong>خلاصة مهمة:</strong> الستيرويدات الطبية أدوية فعالة جداً عند استخدامها بإشراف طبي. لا تخف منها إذا وصفها لك الطبيب، ولكن التزم بالجرعة والمدة المحددة. أبداً لا تستخدم الستيرويدات الابتنائية غير القانونية.</p>
                        </div>
                    `
                    },
                    {
                        id: 'heal-all-diseases',
                        title: 'كيف تتشافى من كل أمراضك بنفسك - الحقيقة التي يخفونها عنك',
                        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop',
                        category: 'mind',
                        date: '2025-01-15',
                        excerpt: 'اكتشف الأسرار التي لا يريدك الأطباء أن تعرفها عن قدرة جسدك الخارقة على الشفاء الذاتي',
                        content: `
                            <h2>الحقيقة المذهلة</h2>
                            <p>جسدك يمتلك نظام شفاء ذاتي خارق للطبيعة، لكن صناعة الأدوية لا تريدك أن تعرف ذلك...</p>
                            <h3>5 خطوات للشفاء الذاتي</h3>
                            <ol>
                                <li><strong>فهم الجذر الحقيقي للمرض:</strong> 90% من الأمراض جذرها نفسي وعاطفي</li>
                                <li><strong>تنظيف الجسم من السموم:</strong> الصيام المتقطع والديتوكس</li>
                                <li><strong>تقوية المناعة طبيعياً:</strong> دون أدوية كيميائية</li>
                                <li><strong>إعادة برمجة العقل الباطن:</strong> التأمل والتخيل العلاجي</li>
                                <li><strong>العودة إلى الفطرة:</strong> الطعام العضوي والحركة الطبيعية</li>
                            </ol>
                            <blockquote class="p-4 bg-gray-100 border-r-4 border-blue-500 my-4">
                                "لا يوجد مرض غير قابل للشفاء، فقط أجساد لم تُعطَ الفرصة الحقيقية للشفاء"
                            </blockquote>
                        `
                    },
                    {
                        id: 'diet-failure-secret',
                        title: 'السر وراء فشل 90% من الأنظمة الغذائية - لماذا لا يخبرونك؟',
                        image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop',
                        category: 'nutrition',
                        date: '2025-01-18',
                        excerpt: 'الحقيقة المرة: الحميات الغذائية مصممة لتفشل! اكتشف السبب الحقيقي',
                        content: `
                            <h2>الخدعة الكبرى</h2>
                            <p>صناعة الحميات الغذائية تبلغ قيمتها 72 مليار دولار سنوياً... هل تعتقد أنهم يريدونك أن تنجح؟</p>
                            <h3>لماذا تفشل الحميات؟</h3>
                            <ul>
                                <li>تتجاهل بيولوجيا الجسم الفريدة</li>
                                <li>تسبب اضطرابات هرمونية</li>
                                <li>تبطئ معدل الحرق</li>
                                <li>تؤدي للإدمان على الطعام</li>
                            </ul>
                            <h3>الحل الحقيقي</h3>
                            <p>الطب الوظيفي يكشف: لكل شخص نظام غذائي خاص بناءً على:</p>
                            <ul>
                                <li>تحاليل الدم الشاملة</li>
                                <li>حساسيات الطعام</li>
                                <li>الميكروبيوم المعوي</li>
                                <li>الحالة الهرمونية</li>
                            </ul>
                        `
                    },
                    {
                        id: 'doctors-hide-truth',
                        title: 'لماذا يخفي الأطباء هذه الحقيقة عنك؟ - فضيحة طبية',
                        image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=2091&auto=format&fit=crop',
                        category: 'mind',
                        date: '2025-01-20',
                        excerpt: 'معظم الأدوية تعالج الأعراض فقط... الحقيقة المرة عن صناعة الدواء',
                        content: `
                            <h2>الحقيقة المخيفة</h2>
                            <p>95% من الأدوية تعالج الأعراض فقط ولا تعالج الجذر الحقيقي للمرض!</p>
                            <h3>لماذا؟</h3>
                            <p>لأن العلاج الكامل يعني خسارة مريض دائم = خسارة أرباح مستمرة</p>
                            <h3>أمثلة صادمة:</h3>
                            <ul>
                                <li><strong>أدوية الضغط:</strong> تخفض الضغط لكن لا تعالج السبب (المقاومة، الالتهاب، التوتر)</li>
                                <li><strong>أدوية السكري:</strong> تخفض السكر لكن لا تعالج مقاومة الإنسولين</li>
                                <li><strong>مضادات الاكتئاب:</strong> تخدر المشاعر لكن لا تعالج الصدمات النفسية</li>
                            </ul>
                            <blockquote class="p-4 bg-gray-100 border-r-4 border-blue-500 my-4">
                                "الطب الحديث ممتاز في الطوارئ والجراحة، لكنه فاشل في علاج الأمراض المزمنة"
                            </blockquote>
                            <h3>الحل البديل</h3>
                            <p>الطب الوظيفي يبحث عن الجذر الحقيقي: التغذية، التوتر، السموم، الهرمونات، الميكروبيوم</p>
                        `
                    },
                    {
                        id: 'functional-medicine-revolution',
                        title: 'الطب الوظيفي: ثورة تهز أركان الطب التقليدي',
                        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop',
                        category: 'supplements',
                        date: '2025-01-22',
                        excerpt: 'لماذا يخاف الأطباء التقليديون من الطب الوظيفي؟',
                        content: `
                            <h2>ما هو الطب الوظيفي؟</h2>
                            <p>نهج علمي حديث يبحث عن السبب الجذري للمرض بدلاً من مجرد علاج الأعراض</p>
                            <h3>الفرق الجوهري</h3>
                            <div class="overflow-x-auto">
                                <table class="w-full my-4">
                                    <thead>
                                        <tr class="bg-gray-100">
                                            <th class="p-3 text-right">الطب التقليدي</th>
                                            <th class="p-3 text-right">الطب الوظيفي</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr class="border-b">
                                            <td class="p-3">يعالج الأعراض</td>
                                            <td class="p-3">يعالج الجذر</td>
                                        </tr>
                                        <tr class="border-b">
                                            <td class="p-3">دواء لكل عرض</td>
                                            <td class="p-3">حل شامل واحد</td>
                                        </tr>
                                        <tr>
                                            <td class="p-3">15 دقيقة للمريض</td>
                                            <td class="p-3">ساعة أو أكثر</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <h3>أدوات الطب الوظيفي</h3>
                            <ul>
                                <li>تحاليل شاملة متقدمة</li>
                                <li>فحص الميكروبيوم</li>
                                <li>تحليل المعادن الثقيلة</li>
                                <li>فحص الهرمونات الشامل</li>
                                <li>تحليل حساسية الطعام</li>
                            </ul>
                        `
                    },
                    {
                        id: 'diabetic-deadly-mistakes',
                        title: 'أخطاء قاتلة يرتكبها مرضى السكري يومياً - توقف فوراً!',
                        titleEn: 'Deadly Mistakes Diabetic Patients Make Daily - Stop Now!',
                        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2099&auto=format&fit=crop',
                        category: 'nutrition',
                        date: '2025-01-25',
                        excerpt: 'هذه الأخطاء تدمر صحتك ببطء... حتى لو كنت تأخذ الدواء!',
                        excerptEn: 'These mistakes slowly destroy your health... even if you take medication!',
                        content: `
                            <h2>الخطأ الأول: الاعتماد على الدواء فقط</h2>
                            <p>الدواء يخفض السكر لكن لا يعالج مقاومة الإنسولين!</p>
                            <h3>الأخطاء الخمسة القاتلة</h3>
                            <ol>
                                <li><strong>تناول "أطعمة صحية" خاطئة:</strong> عصير الفواكه، الخبز الأسمر، الأرز البني</li>
                                <li><strong>تجاهل النوم:</strong> قلة النوم ترفع السكر بنسبة 30%</li>
                                <li><strong>عدم قياس السكر بعد الوجبات:</strong> أنت أعمى بدون بيانات</li>
                                <li><strong>الخوف من الدهون الصحية:</strong> الدهون لا ترفع السكر!</li>
                                <li><strong>التوتر المزمن:</strong> الكورتيزول يحول البروتين لسكر</li>
                            </ol>
                            <h3>البروتوكول الثوري</h3>
                            <ul>
                                <li>صيام متقطع 16:8</li>
                                <li>نظام كيتو معدّل</li>
                                <li>رياضة المقاومة</li>
                                <li>مكملات ذكية (بربرين، كروميوم، ألفا ليبويك)</li>
                            </ul>
                            <blockquote class="p-4 bg-gray-100 border-r-4 border-blue-500 my-4">
                                "عكس مقاومة الإنسولين ممكن 100%، لكن يحتاج التزام ونهج شامل"
                            </blockquote>
                        `
                    },
                    // CONTROVERSIAL ARTICLES - HIGH ENGAGEMENT
                    {
                        id: 'heal-all-diseases',
                        title: 'كيف تتشافى من كل أمراضك بنفسك - الحقيقة التي يخفونها عنك',
                        titleEn: 'How to Heal All Your Diseases by Yourself - The Truth They Hide',
                        category: 'mind',
                        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop',
                        excerpt: 'اكتشف الأسرار التي لا يريدك الأطباء أن تعرفها عن قدرة جسدك الخارقة على الشفاء الذاتي',
                        excerptEn: 'Discover the secrets doctors don\'t want you to know about your body\'s supernatural healing abilities',
                        date: '2025-01-15',
                        featured: true,
                        content: `
                            <h2>الحقيقة المذهلة</h2>
                            <p>جسدك يمتلك نظام شفاء ذاتي خارق للطبيعة، لكن صناعة الأدوية لا تريدك أن تعرف ذلك...</p>
                            <h3>5 خطوات للشفاء الذاتي</h3>
                            <ol>
                                <li><strong>فهم الجذر الحقيقي للمرض:</strong> 90% من الأمراض جذرها نفسي وعاطفي</li>
                                <li><strong>تنظيف الجسم من السموم:</strong> الصيام المتقطع والديتوكس</li>
                                <li><strong>تقوية المناعة طبيعياً:</strong> دون أدوية كيميائية</li>
                                <li><strong>إعادة برمجة العقل الباطن:</strong> التأمل والتخيل العلاجي</li>
                                <li><strong>العودة إلى الفطرة:</strong> الطعام العضوي والحركة الطبيعية</li>
                            </ol>
                            <blockquote class="p-4 bg-blue-50 border-r-4 border-blue-500 my-4">
                                "لا يوجد مرض غير قابل للشفاء، فقط أجساد لم تُعطَ الفرصة الحقيقية للشفاء"
                            </blockquote>
                        `
                    },
                    {
                        id: 'diet-failure-secret',
                        title: 'السر وراء فشل 90% من الأنظمة الغذائية - لماذا لا يخبرونك؟',
                        titleEn: 'The Secret Behind 90% Diet Failures - Why Don\'t They Tell You?',
                        category: 'nutrition',
                        image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop',
                        excerpt: 'الحقيقة المرة: الحميات الغذائية مصممة لتفشل! اكتشف السبب الحقيقي',
                        excerptEn: 'The bitter truth: diets are designed to fail! Discover the real reason',
                        date: '2025-01-18',
                        featured: true,
                        content: `
                            <h2>الخدعة الكبرى</h2>
                            <p>صناعة الحميات الغذائية تبلغ قيمتها 72 مليار دولار سنوياً... هل تعتقد أنهم يريدونك أن تنجح؟</p>
                            <h3>لماذا تفشل الحميات؟</h3>
                            <ul>
                                <li>تتجاهل بيولوجيا الجسم الفريدة</li>
                                <li>تسبب اضطرابات هرمونية</li>
                                <li>تبطئ معدل الحرق</li>
                                <li>تؤدي للإدمان على الطعام</li>
                            </ul>
                            <h3>الحل الحقيقي</h3>
                            <p>الطب الوظيفي يكشف: لكل شخص نظام غذائي خاص بناءً على:</p>
                            <ul>
                                <li>تحاليل الدم الشاملة</li>
                                <li>حساسيات الطعام</li>
                                <li>الميكروبيوم المعوي</li>
                                <li>الحالة الهرمونية</li>
                            </ul>
                        `
                    },
                    {
                        id: 'gut-brain-connection',
                        title: 'أمعاؤك هي عقلك الثاني - اكتشاف طبي مذهل!',
                        titleEn: 'Your Gut is Your Second Brain - Amazing Medical Discovery!',
                        category: 'nutrition',
                        image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=80&w=2031&auto=format&fit=crop',
                        excerpt: '90% من السيروتونين يُنتج في الأمعاء... هل تعالج الاكتئاب بشكل خاطئ؟',
                        excerptEn: '90% of serotonin is produced in the gut... are you treating depression wrong?',
                        date: '2025-01-27',
                        featured: true,
                        content: `
                            <h2>المحور المعوي-الدماغي</h2>
                            <p>اكتشاف علمي ثوري: الأمعاء تتحكم في مزاجك، تركيزك، قراراتك!</p>
                            <h3>حقائق صادمة</h3>
                            <ul>
                                <li>90% من السيروتونين يُنتج في الأمعاء</li>
                                <li>الميكروبيوم يؤثر على سلوكك</li>
                                <li>التهاب الأمعاء = التهاب الدماغ</li>
                                <li>تسريب الأمعاء يسبب الاكتئاب</li>
                            </ul>
                            <h3>علامات الأمعاء المريضة</h3>
                            <ul>
                                <li>اكتئاب وقلق مستمر</li>
                                <li>تعب رغم النوم الكافي</li>
                                <li>ضباب ذهني وقلة تركيز</li>
                                <li>انتفاخ وإمساك مزمن</li>
                            </ul>
                            <h3>بروتوكول شفاء الأمعاء (4R Protocol)</h3>
                            <ol>
                                <li><strong>إزالة:</strong> الجلوتين، الألبان، السكر</li>
                                <li><strong>إصلاح:</strong> مرق العظام، L-Glutamine</li>
                                <li><strong>إعادة التوازن:</strong> بروبيوتيك، بريبايوتك</li>
                                <li><strong>إعادة التلقيح:</strong> أطعمة مخمرة</li>
                            </ol>
                        `
                    }
                ];

                function renderGrid(cat = 'all', q = '') {
                    const norm = (s) => (s || '').toLowerCase();
                    const nq = norm(q);
                    const filtered = posts.filter(p => (cat === 'all' || p.category === cat) && (!nq || norm(p.title).includes(nq) || norm(p.excerpt).includes(nq)));
                    
                    blogGrid.innerHTML = filtered.map(p => {
                        const displayTitle = currentLang === 'en' && p.titleEn ? p.titleEn : p.title;
                        const displayExcerpt = currentLang === 'en' && p.excerptEn ? p.excerptEn : p.excerpt;
                        const featuredBadge = p.featured ? '<div class="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">🔥 مثير للجدل</div>' : '';
                        
                        return `
                        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 fade-in-up hover:-translate-y-2">
                            <div class="relative">
                                <img src="${p.image}" alt="${displayTitle}" loading="lazy" decoding="async" class="w-full h-56 object-cover">
                                ${featuredBadge}
                            </div>
                            <div class="p-6 text-right">
                                <p class="text-xs text-gray-500 mb-1">${catLabel(p.category)} · ${readingTime(p.content)}</p>
                                <h3 class="text-xl font-bold mb-2 hover:text-[--primary-color] transition-colors">${displayTitle}</h3>
                                <p class="text-gray-600 mb-4">${displayExcerpt}</p>
                                <a href="#" class="read-more-btn font-bold text-[--primary-color] hover:underline" data-postid="${p.id}">${currentLang === 'en' ? 'Read More →' : 'اقرأ المزيد ←'}</a>
                            </div>
                        </div>`;
                    }).join('');
                }

                function openPost(id) {
                    const post = posts.find(p => p.id === id);
                    if (!post) return;
                    document.getElementById('post-title').textContent = post.title;
                    const imgEl = document.getElementById('post-image');
                    imgEl.src = post.image; imgEl.alt = post.title; imgEl.loading = 'lazy'; imgEl.decoding = 'async';
                    document.getElementById('post-content').innerHTML = post.content;
                    // Meta
                    const metaEl = document.getElementById('post-meta');
                    if (metaEl) {
                        const dateStr = post.date ? new Date(post.date).toLocaleDateString('ar-YE') : '';
                        metaEl.innerHTML = `
                        <span class="px-2 py-0.5 bg-gray-100 rounded-full">${catLabel(post.category)}</span>
                        ${dateStr ? `<span>${dateStr}</span>` : ''}
                        <span>${readingTime(post.content)}</span>`;
                    }
                    // Related posts
                    if (relatedContainer) {
                        const related = posts.filter(p => p.id !== id && p.category === post.category).slice(0, 2);
                        relatedContainer.innerHTML = related.map(p => `
                        <div class="bg-white rounded-lg overflow-hidden shadow border">
                            <img src="${p.image}" alt="${p.title}" loading="lazy" decoding="async" class="w-full h-28 object-cover">
                            <div class="p-3 text-right">
                                <h4 class="font-bold text-sm mb-1">${p.title}</h4>
                                <a href="#" class="read-more-btn text-[--primary-color] font-semibold text-sm" data-postid="${p.id}">اقرأ المقال &larr;</a>
                            </div>
                        </div>`).join('');
                    }
                    // Share links
                    const base = window.location.origin + window.location.pathname;
                    const shareText = encodeURIComponent(post.title + ' — ' + base);
                    const shareUrl = encodeURIComponent(base);
                    const w = document.getElementById('share-whatsapp'); if (w) w.href = `https://wa.me/?text=${shareText}`;
                    const f = document.getElementById('share-facebook'); if (f) f.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
                    const x = document.getElementById('share-x'); if (x) x.href = `https://twitter.com/intent/tweet?text=${shareText}`;
                    showView('single-post');
                }

                // Event delegation for opening posts
                blogGrid.addEventListener('click', (e) => {
                    const a = e.target.closest('.read-more-btn');
                    if (!a) return;
                    e.preventDefault();
                    openPost(a.dataset.postid);
                });
                relatedContainer?.addEventListener('click', (e) => {
                    const a = e.target.closest('.read-more-btn');
                    if (!a) return;
                    e.preventDefault();
                    openPost(a.dataset.postid);
                });

                // Filters
                function activeCat() {
                    const btn = Array.from(catBtns).find(b => b.getAttribute('aria-selected') === 'true');
                    return btn ? btn.dataset.cat : 'all';
                }
                catBtns.forEach(btn => btn.addEventListener('click', () => {
                    catBtns.forEach(x => x.setAttribute('aria-selected', 'false'));
                    btn.setAttribute('aria-selected', 'true');
                    renderGrid(activeCat(), searchInput?.value?.trim() || '');
                }));
                searchInput?.addEventListener('input', () => {
                    renderGrid(activeCat(), searchInput.value.trim());
                });

                // Initial render
                renderGrid('all', '');

                // Featured hero: pick latest by date or first
                if (featuredWrap && featuredImg && featuredRead) {
                    const sorted = posts.slice().sort((a, b) => (new Date(b.date || 0)) - (new Date(a.date || 0)));
                    const feat = sorted[0] || posts[0];
                    if (feat) {
                        featuredImg.src = feat.image;
                        featuredTitle.textContent = feat.title;
                        featuredExcerpt.textContent = feat.excerpt;
                        featuredCat.textContent = catLabel(feat.category) + ' · ' + readingTime(feat.content);
                        featuredRead.dataset.postid = feat.id;
                        featuredWrap.classList.remove('hidden');
                    }
                    featuredRead.addEventListener('click', (e) => {
                        e.preventDefault();
                        openPost(featuredRead.dataset.postid);
                    });
                }
            }

            // --- ENHANCED WHEEL OF LIFE MODULE ---
            let currentWheelData = {};
            
            async function initWheelOfLife() {
                await ensureChart();
                setupWheelInterface();
                initializeWheelChart();
                setupWheelEventListeners();
            }
            
            function setupWheelInterface() {
                const categories = [
                    { name: 'الصحة الجسدية', icon: '💪', desc: 'اللياقة والطاقة والصحة العامة' },
                    { name: 'الصحة النفسية', icon: '🧠', desc: 'المزاج والتوتر والاستقرار العاطفي' },
                    { name: 'الحياة المهنية', icon: '💼', desc: 'الرضا الوظيفي والإنجاز المهني' },
                    { name: 'العلاقات الاجتماعية', icon: '👥', desc: 'الأسرة والأصدقاء والعلاقات' },
                    { name: 'الوضع المالي', icon: '💰', desc: 'الاستقرار المالي والأمان الاقتصادي' },
                    { name: 'النمو الشخصي', icon: '🌱', desc: 'التعلم والتطوير الذاتي' },
                    { name: 'الترفيه والاستجمام', icon: '🎯', desc: 'الهوايات والأنشطة الممتعة' },
                    { name: 'الحياة الروحية', icon: '🕊️', desc: 'المعنى والهدف والروحانية' }
                ];
                
                currentWheelData = {
                    categories: categories,
                    scores: Array(categories.length).fill(5),
                    timestamp: new Date()
                };
                
                const container = document.getElementById('wheel-of-life-sliders');
                container.innerHTML = categories.map((cat, index) => `
                    <div class="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all">
                        <div class="flex items-center gap-4 mb-3">
                            <div class="text-2xl">${cat.icon}</div>
                            <div class="flex-1">
                                <h4 class="font-bold text-lg">${cat.name}</h4>
                                <p class="text-sm text-gray-600">${cat.desc}</p>
                            </div>
                            <div class="text-center">
                                <span id="value-${index}" class="text-2xl font-bold text-blue-600">5</span>
                                <div class="text-xs text-gray-500">من 10</div>
                            </div>
                        </div>
                        <input type="range" id="slider-${index}" min="0" max="10" value="5" 
                               class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                               data-index="${index}">
                        <div class="flex justify-between text-xs text-gray-500 mt-1">
                            <span>ضعيف</span>
                            <span>متوسط</span>
                            <span>ممتاز</span>
                        </div>
                    </div>
                `).join('');
            }

            function initializeWheelChart() {
                const ctx = document.getElementById('wheel-of-life-chart');
                if (!ctx) return;
                
                window.wheelChart = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: currentWheelData.categories.map(cat => cat.name),
                        datasets: [{
                            label: 'تقييمي الحالي',
                            data: currentWheelData.scores,
                            fill: true,
                            backgroundColor: hexToRgba(cssVar('--accent-color') || '#2DD4BF', 0.35),
                            borderColor: cssVar('--primary-color') || '#1F6FEB',
                            pointBackgroundColor: cssVar('--primary-color') || '#1F6FEB',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: cssVar('--primary-color') || '#1F6FEB',
                            borderWidth: 3,
                            pointRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            r: {
                                angleLines: { color: hexToRgba(cssVar('--primary-dark') || '#0F4CA8', 0.25) },
                                grid: { color: hexToRgba(cssVar('--primary-dark') || '#0F4CA8', 0.25) },
                                pointLabels: { 
                                    font: { family: "'Noto Kufi Arabic', sans-serif", size: 11, weight: 'bold' }, 
                                    color: cssVar('--text-dark') || '#222' 
                                },
                                ticks: { backdropColor: 'rgba(255,255,255,0.8)', color: '#555', stepSize: 2 },
                                suggestedMin: 0,
                                suggestedMax: 10
                            }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
                
                updateWheelStats();
            }
            
            function setupWheelEventListeners() {
                // Slider changes
                document.getElementById('wheel-of-life-sliders').addEventListener('input', handleSliderChange);
                
                // Action buttons
                document.getElementById('get-wheel-insight-btn').addEventListener('click', generateWheelAnalysis);
                document.getElementById('generate-action-plan-btn').addEventListener('click', generateActionPlan);
                document.getElementById('save-assessment-btn').addEventListener('click', saveWheelAssessment);
                document.getElementById('reset-wheel-btn').addEventListener('click', resetWheelAssessment);
            }
            
            function handleSliderChange(e) {
                if (e.target.type === 'range') {
                    const index = parseInt(e.target.dataset.index);
                    const value = parseInt(e.target.value);
                    
                    // Update display
                    document.getElementById(`value-${index}`).textContent = value;
                    
                    // Update data
                    currentWheelData.scores[index] = value;
                    
                    // Update chart
                    if (window.wheelChart) {
                        window.wheelChart.data.datasets[0].data[index] = value;
                        window.wheelChart.update('none');
                    }
                    
                    updateWheelStats();
                }
            }
            
            function updateWheelStats() {
                const scores = currentWheelData.scores;
                const categories = currentWheelData.categories;
                
                // Overall score
                const overall = (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1);
                document.getElementById('overall-score').textContent = overall;
                
                // Strongest area
                const maxScore = Math.max(...scores);
                const strongestIndex = scores.indexOf(maxScore);
                document.getElementById('strongest-area').textContent = maxScore;
                
                // Weakest area
                const minScore = Math.min(...scores);
                const weakestIndex = scores.indexOf(minScore);
                document.getElementById('weakest-area').textContent = minScore;
                
                // Balance score (lower variance = better balance)
                const variance = scores.reduce((sum, score) => sum + Math.pow(score - overall, 2), 0) / scores.length;
                const balance = Math.max(0, (10 - Math.sqrt(variance))).toFixed(1);
                document.getElementById('balance-score').textContent = balance;
            }
            
            async function generateWheelAnalysis() {
                const analysisContainer = document.getElementById('wheel-analysis-content');
                const resultsSection = document.getElementById('wheel-results-section');
                
                resultsSection.classList.remove('hidden');
                analysisContainer.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-2xl text-blue-600"></i><p class="mt-2">جاري تحليل النتائج...</p></div>';
                
                const scores = currentWheelData.scores;
                const categories = currentWheelData.categories;
                
                let analysisData = "نتائج تقييم عجلة العافية:\n";
                categories.forEach((cat, index) => {
                    analysisData += `${cat.name}: ${scores[index]}/10\n`;
                });
                
                const prompt = `أنت مستشار صحي وخبير في التطوير الشخصي. قم بتحليل نتائج تقييم عجلة العافية التالية:

${analysisData}

قدم تحليلاً شاملاً يتضمن:
1. **التقييم العام**: نظرة شاملة على الوضع الحالي
2. **نقاط القوة**: المجالات التي تحقق فيها أداءً جيداً (7+ نقاط)
3. **مجالات التحسين**: المجالات التي تحتاج اهتماماً (أقل من 6 نقاط)
4. **الترابطات**: كيف تؤثر المجالات على بعضها البعض
5. **الأولويات**: ما هي المجالات الأهم للتركيز عليها أولاً

استخدم لغة عربية واضحة ومشجعة مع تنسيق markdown.`;

                try {
                    const analysis = await handleApiRequest(prompt, 'wheel-analysis', GEMINI_API_KEY);
                    if (analysis) {
                        analysisContainer.innerHTML = `<div class="prose prose-sm max-w-none text-right">${analysis}</div>`;
                    }
                } catch (error) {
                    analysisContainer.innerHTML = '<div class="text-red-600 text-center py-4">حدث خطأ في التحليل. يرجى المحاولة مرة أخرى.</div>';
                }
            }
            
            async function generateActionPlan() {
                const actionContainer = document.getElementById('wheel-action-plan-content');
                const recommendationsContainer = document.getElementById('wheel-recommendations');
                
                actionContainer.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-2xl text-green-600"></i><p class="mt-2">جاري إعداد خطة العمل...</p></div>';
                
                const scores = currentWheelData.scores;
                const categories = currentWheelData.categories;
                
                // Find priority areas (lowest scores)
                const priorityAreas = scores
                    .map((score, index) => ({ score, category: categories[index].name, index }))
                    .filter(item => item.score < 7)
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3);
                
                let planData = "المجالات ذات الأولوية للتحسين:\n";
                priorityAreas.forEach(area => {
                    planData += `${area.category}: ${area.score}/10\n`;
                });
                
                const prompt = `بناءً على نتائج تقييم عجلة العافية، أعد خطة عمل عملية ومتدرجة:

${planData}

أعد خطة تتضمن:
1. **الأهداف قصيرة المدى** (الأسبوعين القادمين)
2. **الأهداف متوسطة المدى** (الشهر القادم)
3. **الأهداف طويلة المدى** (3 أشهر)

لكل هدف قدم:
- خطوات عملية محددة
- مؤشرات النجاح
- الموارد المطلوبة

استخدم تنسيق markdown باللغة العربية.`;

                try {
                    const actionPlan = await handleApiRequest(prompt, 'wheel-action-plan', GEMINI_API_KEY);
                    if (actionPlan) {
                        actionContainer.innerHTML = `<div class="prose prose-sm max-w-none text-right">${actionPlan}</div>`;
                        generateRecommendations(priorityAreas);
                    }
                } catch (error) {
                    actionContainer.innerHTML = '<div class="text-red-600 text-center py-4">حدث خطأ في إعداد خطة العمل. يرجى المحاولة مرة أخرى.</div>';
                }
            }
            
            function generateRecommendations(priorityAreas) {
                const container = document.getElementById('wheel-recommendations');
                
                const recommendations = {
                    'الصحة الجسدية': ['ابدأ بتمارين خفيفة 15 دقيقة يومياً', 'اشرب 8 أكواب ماء يومياً', 'نم 7-8 ساعات ليلاً'],
                    'الصحة النفسية': ['مارس التأمل 10 دقائق يومياً', 'احتفظ بمذكرة امتنان', 'تواصل مع الأصدقاء المقربين'],
                    'الحياة المهنية': ['حدد أهدافاً مهنية واضحة', 'طور مهارة جديدة', 'ابحث عن فرص التطوير'],
                    'العلاقات الاجتماعية': ['خصص وقتاً للعائلة', 'انضم لأنشطة اجتماعية', 'تواصل مع أصدقاء قدامى'],
                    'الوضع المالي': ['ضع ميزانية شهرية', 'ابدأ بالادخار', 'استثمر في تعليمك المالي'],
                    'النمو الشخصي': ['اقرأ كتاباً شهرياً', 'تعلم مهارة جديدة', 'احضر دورات تدريبية'],
                    'الترفيه والاستجمام': ['مارس هواية تحبها', 'خطط لرحلات قصيرة', 'خصص وقتاً للاسترخاء'],
                    'الحياة الروحية': ['مارس التأمل أو الصلاة', 'اقرأ كتباً روحية', 'تطوع في أعمال خيرية']
                };
                
                container.innerHTML = priorityAreas.map(area => `
                    <div class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <h4 class="font-bold text-lg mb-2 flex items-center">
                            <span class="w-3 h-3 rounded-full ${area.score <= 3 ? 'bg-red-500' : area.score <= 6 ? 'bg-yellow-500' : 'bg-green-500'} ml-2"></span>
                            ${area.category}
                        </h4>
                        <div class="text-sm text-gray-600 mb-3">النقاط الحالية: ${area.score}/10</div>
                        <ul class="space-y-2 text-sm">
                            ${(recommendations[area.category] || ['حدد أهدافاً صغيرة', 'اطلب الدعم من المحيطين', 'راقب تقدمك بانتظام']).map(rec => `
                                <li class="flex items-start gap-2">
                                    <i class="fas fa-check-circle text-green-500 mt-1 flex-shrink-0"></i>
                                    <span>${rec}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('');
            }
            
            function saveWheelAssessment() {
                if (!currentUser) {
                    showNotification('يجب تسجيل الدخول لحفظ التقييم', 'warning');
                    return;
                }
                
                const assessment = {
                    ...currentWheelData,
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    userId: currentUser.uid
                };
                
                try {
                    localStorage.setItem('lastWheelAssessment', JSON.stringify(assessment));
                    showNotification('تم حفظ التقييم بنجاح', 'success');
                } catch (error) {
                    showNotification('حدث خطأ في حفظ التقييم', 'error');
                }
            }
            
            function resetWheelAssessment() {
                if (confirm('هل أنت متأكد من إعادة تعيين جميع القيم؟')) {
                    currentWheelData.scores.fill(5);
                    
                    // Reset sliders and values
                    currentWheelData.categories.forEach((_, index) => {
                        const slider = document.getElementById(`slider-${index}`);
                        const valueDisplay = document.getElementById(`value-${index}`);
                        if (slider && valueDisplay) {
                            slider.value = 5;
                            valueDisplay.textContent = 5;
                        }
                    });
                    
                    // Update chart
                    if (window.wheelChart) {
                        window.wheelChart.data.datasets[0].data.fill(5);
                        window.wheelChart.update();
                    }
                    
                    updateWheelStats();
                    document.getElementById('wheel-results-section').classList.add('hidden');
                    showNotification('تم إعادة تعيين التقييم', 'info');
                }
            }

            // --- AUDIO PLAYER MODULE ---
            function initAudioPlayer() {
                const audio = document.getElementById('guided-audio');
                if (!audio) return;
                const playPauseBtn = document.getElementById('audio-play-pause-btn');
                if (!playPauseBtn) return;
                const playIcon = playPauseBtn.querySelector('i') || playPauseBtn;
                const progressBar = document.getElementById('audio-progress-bar');
                const timeDisplay = document.getElementById('audio-time');
                if (!progressBar || !timeDisplay) return;
                const totalDuration = 60; // 1 minute

                const formatTime = (seconds) => {
                    const minutes = Math.floor(seconds / 60);
                    const secs = Math.floor(seconds % 60);
                    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                };

                playPauseBtn.addEventListener('click', () => {
                    if (audio.paused) {
                        audio.play();
                        if (playIcon.classList) {
                            playIcon.classList.replace('fa-play-circle', 'fa-pause-circle');
                        } else {
                            playIcon.textContent = '⏸️';
                        }
                    } else {
                        audio.pause();
                        if (playIcon.classList) {
                            playIcon.classList.replace('fa-pause-circle', 'fa-play-circle');
                        } else {
                            playIcon.textContent = '▶️';
                        }
                    }
                });

                audio.addEventListener('timeupdate', () => {
                    const progress = (audio.currentTime / audio.duration) * 100;
                    progressBar.value = progress;
                    timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(totalDuration)}`;
                });

                audio.addEventListener('ended', () => {
                    if (playIcon.classList) {
                        playIcon.classList.replace('fa-pause-circle', 'fa-play-circle');
                    } else {
                        playIcon.textContent = '▶️';
                    }
                    progressBar.value = 0;
                    timeDisplay.textContent = `00:00 / ${formatTime(totalDuration)}`;
                });

                progressBar.addEventListener('input', () => {
                    const seekTime = (progressBar.value / 100) * audio.duration;
                    audio.currentTime = seekTime;
                });
            }

            // --- GENERAL UI & CREATIVE EFFECTS ---
            function initGeneralUI() {
                const mobileMenuButton = document.getElementById('mobile-menu-button');
                const mobileMenu = document.getElementById('mobile-menu');
                let lastFocused = null;
                function setMenuOpen(open) {
                    if (!mobileMenu || !mobileMenuButton) return;
                    mobileMenu.classList.toggle('hidden', !open);
                    mobileMenuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
                    if (open) {
                        lastFocused = document.activeElement;
                        const firstLink = mobileMenu.querySelector('.nav-link');
                        try { firstLink?.focus(); } catch { }
                    } else {
                        try { lastFocused?.focus(); } catch { }
                    }
                }
                if (mobileMenuButton) {
                    mobileMenuButton.addEventListener('click', () => setMenuOpen(mobileMenu?.classList.contains('hidden')));
                }
                if (mobileMenu) {
                    mobileMenu.addEventListener('click', (e) => {
                        if (e.target.classList.contains('nav-link') || e.target.closest('.nav-link')) {
                            setMenuOpen(false);
                        }
                    });
                }
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') setMenuOpen(false);
                });

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) entry.target.classList.add('is-visible');
                    });
                }, { threshold: 0.1 });
                document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
                
                // Lazy load images
                if ('loading' in HTMLImageElement.prototype) {
                    // Native lazy loading support
                    document.querySelectorAll('img[data-src]').forEach(img => {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    });
                } else {
                    // Fallback for older browsers
                    const lazyLoadObserver = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const img = entry.target;
                                if (img.dataset.src) {
                                    img.src = img.dataset.src;
                                    img.removeAttribute('data-src');
                                    lazyLoadObserver.unobserve(img);
                                }
                            }
                        });
                    });
                    document.querySelectorAll('img[data-src]').forEach(img => lazyLoadObserver.observe(img));
                }

                // Back to top button
                const backToTopBtn = document.getElementById('back-to-top-btn');
                if (backToTopBtn) {
                    window.addEventListener('scroll', () => {
                        backToTopBtn.classList.toggle('hidden', window.scrollY < 300);
                    }, { passive: true });
                    backToTopBtn.addEventListener('click', () => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                }

                // Compact header on scroll
                const headerEl = document.querySelector('header');
                const heroView = document.getElementById('view-hero');
                function applyScrollUI() {
                    const y = window.scrollY || 0;
                    // Header compact style
                    if (headerEl) headerEl.classList.toggle('scrolled', y > 12);
                }
                window.addEventListener('scroll', applyScrollUI, { passive: true });
                setTimeout(applyScrollUI, 50);
            }


            function initCreativeEffects() {
                const cards = document.querySelectorAll('.dashboard-card');
                cards.forEach(card => {
                    card.addEventListener('mousemove', (e) => {
                        const rect = card.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        const rotateX = ((y - card.offsetHeight / 2) / (card.offsetHeight / 2)) * -5;
                        const rotateY = ((x - card.offsetWidth / 2) / (card.offsetWidth / 2)) * 5;
                        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                    });
                });
                document.querySelectorAll('.btn').forEach(button => {
                    button.addEventListener('click', function (e) {
                        const rect = this.getBoundingClientRect();
                        const ripple = document.createElement('span');
                        const d = Math.max(this.clientWidth, this.clientHeight);
                        ripple.style.width = ripple.style.height = d + 'px';
                        ripple.style.left = e.clientX - rect.left - d / 2 + 'px';
                        ripple.style.top = e.clientY - rect.top - d / 2 + 'px';
                        ripple.classList.add('ripple');
                        this.appendChild(ripple);
                        setTimeout(() => ripple.remove(), 600);
                    });
                });
            }

            // --- BODY MAP MODULE (SVG UPGRADE) ---
            function initBodyMap() {
                const infoContainer = document.getElementById('body-map-info');
                const organNameEl = document.getElementById('organ-name');
                const organDetailsEl = document.getElementById('organ-details');
                const organPaths = document.querySelectorAll('#body-map-svg .organ-path');
                const tooltip = document.getElementById('body-map-tooltip');
                const searchEl = document.getElementById('body-map-search');
                const chipEls = document.querySelectorAll('.body-map-toolbar .chip');
                const svgContainer = document.getElementById('body-map-svg-container');
                const container3D = document.getElementById('body-map-3d-container');
                const model3D = document.getElementById('body-model-3d');
                const modeBtns = document.querySelectorAll('.body-map-toolbar .segmented-control [data-mode]');
                const hotspotBtns = document.querySelectorAll('#body-map-3d-container .hotspot-btn');
                const model3DError = document.getElementById('body-map-3d-error');
                const refToggle = document.getElementById('anatomy-ref-toggle');
                const refEl = document.getElementById('anatomy-ref');
                let modelFallbackTried = false;
                if (!infoContainer) return;
                // Ensure 3D component is available when needed
                try { ensureModelViewer(); } catch { }

                window.organData = {
                    brain: {
                        name: 'الدماغ والجهاز العصبي',
                        emotionalCause: 'صراعات فكرية مستمرة، رفض أو مقاومة الأفكار الجديدة، الشعور بالانفصال عن الحدس الداخلي.',
                        associatedDiseases: 'الصداع النصفي، الزهايمر، باركنسون، الجلطات، الأورام، ضبابية الدماغ.',
                        holisticAdvice: 'مارس التأمل لتصفية الذهن، تعلم تقنيات التنفس لتهدئة الجهاز العصبي، اكتب أفكارك لتحريرها، ثق بحدسك أكثر.',
                        category: 'neuro',
                        keywords: ['دماغ', 'عصبي', 'صداع', 'تشنج', 'ذاكرة', 'قلق', 'توتر']
                    },
                    thyroid: {
                        name: 'الغدة الدرقية',
                        emotionalCause: 'الشعور بالإذلال، عدم القدرة على التعبير عن الذات، الشعور بأن دورك لم يأت بعد، كبت الإبداع.',
                        associatedDiseases: 'خمول أو فرط نشاط الغدة، تضخم الغدة، مرض هاشيموتو، مرض جريفز.',
                        holisticAdvice: 'تحدث عن حقيقتك، مارس هواية إبداعية (رسم، كتابة، غناء)، قل "لا" عند الحاجة، حرر رقبتك وكتفيك من خلال التمارين.',
                        category: 'endocrine',
                        keywords: ['درقية', 'هرمونات', 'سيلان', 'وزن', 'طاقة']
                    },
                    heart: {
                        name: 'القلب',
                        emotionalCause: 'نقص الفرح والحب، جروح عاطفية قديمة، الشعور بالوحدة، النقد الذاتي القاسي.',
                        associatedDiseases: 'ارتفاع ضغط الدم، النوبات القلبية، عدم انتظام ضربات القلب, أمراض الشرايين.',
                        holisticAdvice: 'مارس الامتنان يومياً، سامح نفسك والآخرين، اقض وقتاً في الطبيعة، تواصل مع الأصدقاء والأحباء، احتضن أكثر.',
                        category: 'cardio',
                        keywords: ['قلب', 'ضغط', 'شرايين', 'خفقان', 'ألم صدر']
                    },
                    liver: {
                        name: 'الكبد',
                        emotionalCause: 'الغضب المكبوت، المرارة، الاستياء المزمن، الخوف من النقص والفقر.',
                        associatedDiseases: 'تليف الكبد، الكبد الدهني، التهاب الكبد، حصوات المرارة، مشاكل جلدية.',
                        holisticAdvice: 'تعلم تقنيات صحية للتعبير عن الغضب (مثل الكتابة أو الرياضة)، مارس التسامح، ركز على الوفرة بدلاً من النقص، تناول الأطعمة المرة (جرجير، هندباء).',
                        category: 'digestive',
                        keywords: ['كبد', 'مرارة', 'سموم', 'غضب', 'حبوب']
                    },
                    gut: {
                        name: 'الأمعاء (الجهاز الهضمي)',
                        emotionalCause: 'عدم القدرة على "هضم" أو تقبل مواقف الحياة، التمسك بالماضي، القلق المفرط بشأن المستقبل.',
                        associatedDiseases: 'القولون العصبي، كرونز، التهاب القولون التقرحي، الإمساك/الإسهال المزمن، الحساسيات الغذائية.',
                        holisticAdvice: 'مارس اليقظة الذهنية أثناء تناول الطعام، تعلم التخلي عما لا يمكنك التحكم فيه، اكتب مخاوفك على ورق، تناول البروبيوتيك لدعم "عقلك الثاني".',
                        category: 'digestive',
                        keywords: ['أمعاء', 'قولون', 'نفخة', 'هضم', 'غذاء']
                    },
                    adrenals: {
                        name: 'الغدد الكظرية',
                        emotionalCause: 'الإجهاد المزمن، الشعور بأنك في وضع "النجاة" باستمرار، عدم الشعور بالأمان، تحمل مسؤوليات تفوق طاقتك.',
                        associatedDiseases: 'الإرهاق الكظري، متلازمة التعب المزمن، مشاكل النوم، القلق.',
                        holisticAdvice: 'ضع حدوداً صحية، تعلم قول "لا"، خصص وقتاً يومياً للاسترخاء التام (بدون شاشات)، قلل من الكافيين، مارس التأمل أو اليوجا التصالحية.',
                        category: 'adrenal',
                        keywords: ['كظر', 'إجهاد', 'كورتيزول', 'تعب', 'توتر']
                    },
                    kidneys: {
                        name: 'الكلى',
                        emotionalCause: 'الخوف العميق، مشاكل في العلاقات والشراكات، الشعور بخيبة الأمل والنقد.',
                        associatedDiseases: 'حصوات الكلى، الفشل الكلوي، التهابات المسالك البولية المتكررة.',
                        holisticAdvice: 'واجه مخاوفك بدلاً من الهروب منها، قيم علاقاتك وابنِ روابط صحية، اشرب كمية كافية من الماء بنية التطهير، مارس تقنيات التأريض.',
                        category: 'adrenal',
                        keywords: ['كلى', 'بول', 'حصى', 'خوف', 'سائل']
                    },
                    lungs: {
                        name: 'الرئتان',
                        emotionalCause: 'الحزن العميق أو الإحساس بالاختناق من القيود، صعوبة “أخذ نفس” من الحياة.',
                        associatedDiseases: 'الربو، العدوى التنفسية، الانسداد الرئوي، الحساسية، ضيق التنفس.',
                        holisticAdvice: 'تمارين تنفس عميق، تعرض للشمس والهواء النقي، معالجة الحزن بالكتابة والبكاء الصحي، زيوت عطرية كالكافور.',
                        category: 'respiratory',
                        keywords: ['رئة', 'تنفسي', 'ضيق', 'سعال', 'أكسجين', 'صدر']
                    },
                    stomach: {
                        name: 'المعدة',
                        emotionalCause: 'القلق والتوتر المزمن، صعوبة تقبّل المواقف الجديدة، “هضم” الخبرات الثقيلة.',
                        associatedDiseases: 'حموضة، قرحة، عسر هضم، غثيان.',
                        holisticAdvice: 'الأكل بوعي وببطء، تقليل الكافيين والسكّر، شاي الزنجبيل/النعناع، كتابة المخاوف قبل النوم.',
                        category: 'digestive',
                        keywords: ['معدة', 'حموضة', 'قرحة', 'غثيان', 'هضم']
                    },
                    pancreas: {
                        name: 'البنكرياس',
                        emotionalCause: 'مرارة داخلية أو إحباط من “حلاوة الحياة”، ضغط حول السيطرة والتنظيم.',
                        associatedDiseases: 'اختلال سكر الدم، السكري النوع الثاني، التهاب البنكرياس.',
                        holisticAdvice: 'تنظيم السكر والوجبات، موازنة العمل والراحة، ممارسة الامتنان يومياً.',
                        category: 'digestive',
                        keywords: ['بنكرياس', 'سكر', 'أنسولين', 'حلاوة', 'تنظيم']
                    },
                    spleen: {
                        name: 'الطحال (مناعة)',
                        emotionalCause: 'إحساس بالضعف أو عدم الحماية، اجترار الأفكار والقلق.',
                        associatedDiseases: 'تضخم الطحال، ضعف المناعة، العدوى المتكررة.',
                        holisticAdvice: 'تعزيز المناعة بالغذاء الكامل والنوم الجيد، تهدئة العقل بالتأمل والمشي.',
                        category: 'digestive',
                        keywords: ['طحال', 'مناعة', 'عدوى', 'حماية']
                    },
                    bladder: {
                        name: 'المثانة',
                        emotionalCause: 'توتر وعدم الأمان، احتباس مشاعر أو حدود غير واضحة.',
                        associatedDiseases: 'التهابات المسالك، تهيّج المثانة، تكرار البول.',
                        holisticAdvice: 'شرب الماء بانتظام، دعم صحة المسالك (التوت البري)، التعبير عن الاحتياجات بوضوح.',
                        category: 'adrenal',
                        keywords: ['مثانة', 'بول', 'التهاب', 'إلحاح']
                    },
                    reproductive: {
                        name: 'الجهاز التناسلي',
                        emotionalCause: 'قضايا تتعلق بالقيمة الذاتية والعلاقات والحميمية والإبداع.',
                        associatedDiseases: 'اضطرابات الدورة، تكيس المبايض، آلام الحوض، مشاكل البروستاتا.',
                        holisticAdvice: 'رعاية الذات والحدود الصحية، علاج الصدمات اللطيف، الحركة الواعية وتمارين الحوض.',
                        category: 'endocrine',
                        keywords: ['هرمونات', 'مبايض', 'رحم', 'بروستاتا', 'خصوبة']
                    },
                    trachea: {
                        name: 'القصبة الهوائية',
                        emotionalCause: 'صعوبة التعبير والتنفس بحرية، شعور بالضغط في الصدر أو الخوف.',
                        associatedDiseases: 'التهاب القصبات، السعال المزمن، تضيق القصبة.',
                        holisticAdvice: 'تمارين تنفّس وتمطيط للصدر، تخفيف المهيّجات، تهدئة الجهاز العصبي.',
                        category: 'respiratory',
                        keywords: ['قصبة', 'هوائية', 'سعال', 'تنفس']
                    },
                    esophagus: {
                        name: 'المريء',
                        emotionalCause: 'صعوبة “ابتلاع” مواقف الحياة، توتر مزمن، استعجال.',
                        associatedDiseases: 'ارتجاع مريئي، التهاب مريء، صعوبة بلع.',
                        holisticAdvice: 'إبطاء وتيرة الأكل، تقليل الأطعمة المهيّجة، إدارة التوتر، الامتناع عن الأكل قبل النوم.',
                        category: 'digestive',
                        keywords: ['مريء', 'ارتجاع', 'حرقة', 'بلع']
                    },
                    diaphragm: {
                        name: 'الحجاب الحاجز',
                        emotionalCause: 'حبس النفس تحت التوتر، عدم السماح “بالتنفس” وسط الضغوط.',
                        associatedDiseases: 'تشنج حجاب حاجز، حموضة مترافقة، ألم صدري وظيفي.',
                        holisticAdvice: 'تنفّس بطني عميق، استرخاء تدريجي، إطلاق التوتر العاطفي.',
                        category: 'respiratory',
                        keywords: ['حجاب', 'تنفّس', 'صدر', 'تشنج']
                    },
                    small_intestine: {
                        name: 'الأمعاء الدقيقة',
                        emotionalCause: 'حساسية زائدة/فرط تحليل التفاصيل، صعوبة امتصاص “العبر”.',
                        associatedDiseases: 'سوء امتصاص، حساسية جلوتين/سيلياك، فرط نمو بكتيري (SIBO).',
                        holisticAdvice: 'أكل بسيط ونظيف، بروبيوتيك/بريبايوتيك مناسب، تخفيف التوتر.',
                        category: 'digestive',
                        keywords: ['أمعاء دقيقة', 'امتصاص', 'SIBO', 'حساسية']
                    },
                    colon: {
                        name: 'القولون',
                        emotionalCause: 'التمسّك بالماضي، مقاومة التغيير، قلق على المستقبل.',
                        associatedDiseases: 'قولون عصبي، إمساك/إسهال مزمن، التهاب قولون.',
                        holisticAdvice: 'روتين يومي ثابت، ألياف وماء كافٍ، تفريغ عاطفي آمن.',
                        category: 'digestive',
                        keywords: ['قولون', 'IBS', 'إمساك', 'إسهال', 'غازات']
                    },
                    gallbladder: {
                        name: 'المرارة',
                        emotionalCause: 'مرارة مستمرة وصعوبة اتخاذ القرارات، غضب مكبوت.',
                        associatedDiseases: 'حصوات المرارة، التهاب المرارة، عسر هضم دهون.',
                        holisticAdvice: 'إدارة الغضب بلطف، دهون صحية متوازنة، دعم الكبد والألياف.',
                        category: 'digestive',
                        keywords: ['مرارة', 'حصى', 'صفرا', 'دهون']
                    },
                    prostate: {
                        name: 'البروستاتا',
                        emotionalCause: 'قضايا تتعلق بالرجولة والسلطة والحدود، أو ضغط مزمن غير معبّر عنه.',
                        associatedDiseases: 'التهاب البروستاتا، تضخم البروستاتا الحميد، اضطرابات التبوّل.',
                        holisticAdvice: 'تقليل الجلوس الطويل، دعم صحة الحوض، تخفيف التوتر، غذاء مضاد للالتهاب، مراجعة الطبيب للفحص الدوري.',
                        category: 'endocrine',
                        keywords: ['بروستاتا', 'تبوّل', 'تضخم', 'التهاب']
                    },
                    uterus_ovaries: {
                        name: 'الرحم والمبايض',
                        emotionalCause: 'قيمة ذاتية وإبداع وأنوثة، قضايا متعلقة بالخصوبة والعلاقات والحدود.',
                        associatedDiseases: 'اضطرابات الدورة، بطانة رحم مهاجرة، تكيس المبايض، آلام حوض.',
                        holisticAdvice: 'رعاية ذاتية لطيفة، معالجة جذرية للصدمات، توازن هرموني غذائي ونومي، حركة واعية وتمارين حوض.',
                        category: 'endocrine',
                        keywords: ['رحم', 'مبايض', 'خصوبة', 'دورة']
                    }
                };

                // --- Helpers & UI state ---
                const categoryMeta = {
                    cardio: { label: 'قلبي وعائي', color: '#b91c1c' },
                    neuro: { label: 'عصبي', color: '#2563eb' },
                    respiratory: { label: 'تنفسي', color: '#0ea5e9' },
                    digestive: { label: 'هضمي', color: '#059669' },
                    endocrine: { label: 'غدد صماء', color: '#a855f7' },
                    adrenal: { label: 'كظري/كلوي', color: '#f59e0b' }
                };

                const categoryDefaults = {
                    cardio: {
                        symptoms: ['ألم/ضغط صدري', 'خفقان', 'ضيق نفس', 'تعب سريع'],
                        redFlags: ['ألم صدري شديد ممتد للذراع أو الفك', 'إغماء مفاجئ', 'ضيق نفس شديد مع تعرّق'],
                        tests: ['قياس ضغط الدم', 'ECG تخطيط قلب', 'Troponin', 'Echo موجات صوتية للقلب'],
                        seeDoctor: ['ألم صدري جديد أو متكرر', 'تورم الساقين مع ضيق نفس', 'دوخة مترافقة بخفقان']
                    },
                    neuro: {
                        symptoms: ['صداع مستمر', 'دوخة', 'تنميل/ضعف', 'تشنجات'],
                        redFlags: ['علامات سكتة: ضعف مفاجئ بوجه/ذراع/رجل أو صعوبة كلام', 'أسوأ صداع بحياتي', 'اختلاجات لأول مرة'],
                        tests: ['فحص عصبي', 'CT/MRI دماغ', 'تحاليل فيتامينات (B12/D)', 'EEG عند اللزوم'],
                        seeDoctor: ['صداع جديد شديد', 'ضعف/خدر مفاجئ', 'تدهور إدراكي']
                    },
                    respiratory: {
                        symptoms: ['سعال', 'صفير', 'ضيق نفس', 'ألم صدري مع التنفس'],
                        redFlags: ['زرقة/انخفاض أكسجة', 'ألم صدري حاد مفاجئ', 'سعال دم'],
                        tests: ['أشعة صدر', 'قياس وظائف الرئة', 'تحاليل حساسية', 'Pulse oximetry'],
                        seeDoctor: ['ضيق نفس مترقٍ', 'حُمّى مع سعال مستمر', 'سعال دم']
                    },
                    digestive: {
                        symptoms: ['ألم بطني', 'غثيان/إقياء', 'نفخة', 'تغير عادات إخراج'],
                        redFlags: ['قيء دم/براز أسود', 'ألم حاد مستمر', 'نقص وزن غير مفسر'],
                        tests: ['عد دم كامل', 'وظائف كبد/بنكرياس', 'إيكو بطن', 'تنظير عند اللزوم'],
                        seeDoctor: ['ألم شديد مستمر', 'إقياء أو إسهال مع تجفاف', 'نزف هضمي']
                    },
                    endocrine: {
                        symptoms: ['تعب', 'تبدلات وزن', 'عدم تحمل حر/برد', 'اضطراب دورة/مزاج'],
                        redFlags: ['ارتباك شديد/إغماء', 'ألم بطني مع قيء مستمر', 'ارتفاع ضغط/سكر غير مضبوط'],
                        tests: ['TSH/FT4 هرمونات درقية', 'سكر تراكمي HbA1c', 'كورتيزول وغير ذلك حسب الحالة'],
                        seeDoctor: ['أعراض هرمونية مترقية', 'اضطراب دورة شديد', 'اشتباه حمل مع أعراض']
                    },
                    adrenal: {
                        symptoms: ['ألم خاصرتين', 'تبوّل متكرر/حرقة', 'تورم', 'تعب'],
                        redFlags: ['انقطاع بول', 'حمّى مرتفعة مع قشعريرة', 'ألم خاصرة شديد مفاجئ'],
                        tests: ['تحليل بول', 'كرياتينين ووظائف كلى', 'إيكو كلى', 'CT عند الحاجة'],
                        seeDoctor: ['ألم خاصرة شديد', 'تورم مع قلة بول', 'حرقة بول مع حمّى']
                    }
                };

                const hotspotSetSelected = (key) => {
                    hotspotBtns.forEach(b => b.classList.toggle('selected', b.dataset.organ === key));
                };

                const highlight2D = (key) => {
                    // clear previous
                    organPaths.forEach(p => p.classList.remove('selected'));
                    // select all shapes/groups for this organ
                    document.querySelectorAll(`#body-map-svg [data-organ="${key}"]`).forEach(p => p.classList.add('selected'));
                };

                const renderCategoryChip = (cat) => {
                    const meta = categoryMeta[cat] || { label: cat || 'غير مصنف', color: '#6b7280' };
                    return `<span class="category-chip"><span class="dot" style="background:${meta.color}"></span>${meta.label}</span>`;
                };

                const renderList = (title, items) => {
                    if (!items || !items.length) return '';
                    const lis = items.map(i => `<li>• ${i}</li>`).join('');
                    return `<div class="mb-2"><strong>${title}:</strong><ul class="list-disc pr-5">${lis}</ul></div>`;
                };

                const selectOrgan = (organKey) => {
                    const data = window.organData[organKey];
                    if (!data) return;
                    highlight2D(organKey);
                    hotspotSetSelected(organKey);
                    infoContainer.style.opacity = 0;
                    infoContainer.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        organNameEl.textContent = data.name;
                        const cat = data.category;
                        const dflt = categoryDefaults[cat] || {};
                        const symptoms = data.symptoms || dflt.symptoms || [];
                        const redFlags = data.redFlags || dflt.redFlags || [];
                        const tests = data.tests || dflt.tests || [];
                        const seeDoctor = data.seeDoctor || dflt.seeDoctor || [];

                        organDetailsEl.innerHTML = `
                        <div class="mb-3">${renderCategoryChip(cat)}</div>
                        <p class="mb-2"><strong>الأمراض المرتبطة:</strong> ${data.associatedDiseases}</p>
                        ${renderList('أعراض شائعة', symptoms)}
                        ${renderList('علامات إنذار', redFlags)}
                        ${renderList('فحوصات مقترحة', tests)}
                        ${renderList('متى تراجع الطبيب؟', seeDoctor)}
                        <p class="mb-2"><strong>السبب الشعوري الجذري:</strong> ${data.emotionalCause}</p>
                        <p class="mb-2"><strong>نصيحة شمولية:</strong> ${data.holisticAdvice}</p>
                        <p class="mt-3 text-xs text-gray-500">تنويه: هذه المعلومات تثقيفية ولا تغني عن استشارة الطبيب عند ظهور علامات الإنذار أو استمرار الأعراض.</p>
                    `;
                        infoContainer.style.opacity = 1;
                        infoContainer.style.transform = 'translateY(0)';
                    }, 200);
                    
                    // On mobile, show bottom sheet instead of sidebar
                    if (window.innerWidth <= 768 && window.openBodyMapSheet) {
                        const sheetContent = `
                            <div class="text-sm">
                                <div class="mb-3">${renderCategoryChip(cat)}</div>
                                <p class="mb-2"><strong>الأمراض المرتبطة:</strong> ${data.associatedDiseases}</p>
                                ${renderList('أعراض شائعة', symptoms)}
                                <p class="mb-2"><strong>السبب الشعوري الجذري:</strong> ${data.emotionalCause}</p>
                                <p class="mb-2"><strong>نصيحة شمولية:</strong> ${data.holisticAdvice}</p>
                            </div>
                        `;
                        window.openBodyMapSheet(data.name, sheetContent);
                    }
                    
                    // Persist and deep-link
                    ls.set('bm_lastOrgan', organKey);
                    updateHash({ organ: organKey });
                };

                // Sex toggle (2D)
                const sexBtns = document.querySelectorAll('.body-map-toolbar [data-sex]');
                let activeSex = 'male';
                const applySex = (sex) => {
                    activeSex = sex;
                    // Update buttons state
                    sexBtns.forEach(btn => btn.setAttribute('aria-selected', (btn.dataset.sex === sex).toString()));
                    // Show/hide sex-specific organs
                    document.querySelectorAll('#body-map-svg [data-sex]').forEach(el => {
                        el.style.display = (el.dataset.sex === sex) ? '' : 'none';
                    });
                    // Re-apply filters to respect sex visibility
                    applyFilter();
                    // Persist and deep-link
                    ls.set('bm_sex', sex);
                    updateHash({ sex });
                };

                sexBtns.forEach(btn => btn.addEventListener('click', () => applySex(btn.dataset.sex)));

                // Fine-tune mode (drag organs)
                const tuneToggleBtn = document.getElementById('body-map-tune-toggle');
                const tuneResetBtn = document.getElementById('body-map-tune-reset');
                let tuneMode = false;
                let activeDragEl = null;
                let dragStart = { x: 0, y: 0 };
                let startTranslate = { x: 0, y: 0 };

                const parseTranslate = (el) => {
                    const t = el.getAttribute('transform') || '';
                    const m = t.match(/translate\(([-\d\.]+)[,\s]+([\-\d\.]+)\)/);
                    if (m) return { x: parseFloat(m[1] || 0), y: parseFloat(m[2] || 0) };
                    return { x: 0, y: 0 };
                };
                const setTranslate = (el, x, y) => {
                    // preserve other transforms if any (simple case: only translate)
                    el.setAttribute('transform', `translate(${x} ${y})`);
                };
                const svgRoot = document.getElementById('body-map-svg');
                if (svgRoot) {
                    svgRoot.addEventListener('pointerdown', (e) => {
                        if (!tuneMode) return;
                        const el = e.target.closest('#body-map-svg [data-organ]');
                        if (!el) return;
                        activeDragEl = el;
                        dragStart = { x: e.clientX, y: e.clientY };
                        startTranslate = parseTranslate(el);
                        try { svgRoot.setPointerCapture(e.pointerId); } catch { }
                    });
                    svgRoot.addEventListener('pointermove', (e) => {
                        if (!tuneMode || !activeDragEl) return;
                        const dx = e.clientX - dragStart.x;
                        const dy = e.clientY - dragStart.y;
                        setTranslate(activeDragEl, startTranslate.x + dx, startTranslate.y + dy);
                    });
                    svgRoot.addEventListener('pointerup', (e) => {
                        if (!tuneMode) return;
                        // Save transform before clearing selection
                        if (activeDragEl) {
                            const key = activeDragEl.dataset.organ;
                            const t = activeDragEl.getAttribute('transform') || '';
                            const storeKey = `${activeSex}::${key}`;
                            savedTransforms[storeKey] = t;
                            try { ls.set('bm_transforms', savedTransforms); } catch { }
                        }
                        activeDragEl = null;
                        try { svgRoot.releasePointerCapture(e.pointerId); } catch { }
                    });
                }

                tuneToggleBtn?.addEventListener('click', () => {
                    tuneMode = !tuneMode;
                    svgContainer.classList.toggle('tune-active', tuneMode);
                    try { showNotification(tuneMode ? 'تم تفعيل وضع الضبط: اسحب الأعضاء لتعديل مواضعها' : 'تم إيقاف وضع الضبط', 'success'); } catch (e) { }
                });
                tuneResetBtn?.addEventListener('click', () => {
                    document.querySelectorAll('#body-map-svg [data-organ]').forEach(el => el.removeAttribute('transform'));
                    savedTransforms = {};
                    ls.set('bm_transforms', savedTransforms);
                    try { showNotification('تمت إعادة ضبط مواضع الأعضاء', 'success'); } catch (e) { }
                });

                // color by category (optional visual cue using stroke)
                organPaths.forEach(path => {
                    const organKey = path.dataset.organ;
                    const data = window.organData[organKey];
                    if (data) {
                        path.dataset.category = data.category;
                    }
                    // Click -> unified select
                    path.addEventListener('click', () => selectOrgan(organKey));

                    // Tooltip hover
                    path.addEventListener('mouseenter', (e) => {
                        if (!tooltip) return;
                        const organKey = path.dataset.organ;
                        const data = window.organData[organKey];
                        if (!data) return;
                        tooltip.innerHTML = `<strong>${data.name}</strong>`;
                        tooltip.classList.remove('hidden');
                    });
                    path.addEventListener('mousemove', (e) => {
                        if (!tooltip) return;
                        const container = document.getElementById('body-map-svg-container');
                        const rect = container.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        tooltip.style.left = x + 'px';
                        tooltip.style.top = y + 'px';
                    });
                    path.addEventListener('mouseleave', () => {
                        if (!tooltip) return;
                        tooltip.classList.add('hidden');
                    });
                });

                // SVG-wide event delegation for groups and nested shapes
                if (svgRoot) {
                    // Click selection
                    svgRoot.addEventListener('click', (e) => {
                        const el = e.target.closest('[data-organ]');
                        if (!el) return;
                        const key = el.dataset.organ;
                        if (key) selectOrgan(key);
                    });
                    // Tooltip show/move/hide
                    svgRoot.addEventListener('mouseover', (e) => {
                        if (!tooltip) return;
                        const el = e.target.closest('[data-organ]');
                        if (!el) return;
                        const key = el.dataset.organ;
                        const data = window.organData[key];
                        tooltip.textContent = data ? data.name : key;
                        tooltip.classList.remove('hidden');
                    });
                    svgRoot.addEventListener('mousemove', (e) => {
                        if (!tooltip) return;
                        const rect = svgContainer.getBoundingClientRect();
                        tooltip.style.left = (e.clientX - rect.left) + 'px';
                        tooltip.style.top = (e.clientY - rect.top) + 'px';
                    });
                    svgContainer.addEventListener('mouseleave', () => {
                        if (tooltip) tooltip.classList.add('hidden');
                    });
                }

                // Hotspots (3D)
                hotspotBtns.forEach(btn => {
                    const key = btn.dataset.organ;
                    const data = window.organData[key];
                    if (data) {
                        btn.dataset.category = data.category;
                        btn.title = data.name;
                    }
                    btn.addEventListener('click', () => selectOrgan(key));
                });

                // --- LocalStorage helpers ---
                const ls = {
                    get: (k, def = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
                    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
                };

                // --- URL hash helper ---
                const updateHash = (updates) => {
                    const p = parseHashParams();
                    const newParams = { ...p, view: 'body-map', ...updates };
                    const qs = Object.keys(newParams).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(newParams[k])}`).join('&');
                    const newUrl = `${location.origin}${location.pathname}#${qs}`;
                    try { history.replaceState(null, '', newUrl); } catch { location.hash = qs; }
                    return newUrl;
                };

                // --- dynamic script loader helpers ---
                const loadScript = (src, type) => new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    if (type) s.type = type;
                    s.src = src;
                    s.onload = () => resolve();
                    s.onerror = () => reject(new Error('Failed to load ' + src));
                    document.head.appendChild(s);
                });
                const ensureModelViewer = async () => {
                    if (customElements && customElements.get && customElements.get('model-viewer')) return;
                    try { await loadScript('https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js', 'module'); } catch { }
                };

                // --- Mode toggle (2D/3D) ---
                const switchMode = (mode) => {
                    const show3D = mode === '3d';
                    container3D.classList.toggle('hidden', !show3D);
                    svgContainer.classList.toggle('hidden', show3D);
                    modeBtns.forEach(b => b.setAttribute('aria-selected', (b.dataset.mode === mode).toString()));
                    ls.set('bm_mode', mode);
                    updateHash({ mode });
                };

                // --- Pan/Zoom for 2D (Alt+سحب أو زر الفأرة الأوسط) ---
                const svgEl = document.getElementById('body-map-svg');
                let panZoom = ls.get('bm_panzoom', { x: 0, y: 0, scale: 1 });
                const applyPanZoom = () => {
                    if (!svgEl) return;
                    svgEl.style.transformOrigin = '50% 50%';
                    svgEl.style.transform = `translate(${panZoom.x}px, ${panZoom.y}px) scale(${panZoom.scale})`;
                };
                applyPanZoom();
                svgContainer.addEventListener('wheel', (e) => {
                    if (!svgEl) return;
                    e.preventDefault();
                    const factor = 1.1;
                    const newScale = Math.min(3, Math.max(0.8, panZoom.scale * (e.deltaY < 0 ? factor : 1 / factor)));
                    panZoom.scale = newScale;
                    applyPanZoom();
                    ls.set('bm_panzoom', panZoom);
                }, { passive: false });
                let panning = false;
                let panStart = { x: 0, y: 0 };
                let panBase = { x: 0, y: 0 };
                svgContainer.addEventListener('pointerdown', (e) => {
                    if (e.button !== 1 && !e.altKey) return;
                    panning = true;
                    panStart = { x: e.clientX, y: e.clientY };
                    panBase = { ...panZoom };
                    try { svgContainer.setPointerCapture(e.pointerId); } catch { }
                });
                svgContainer.addEventListener('pointermove', (e) => {
                    if (!panning) return;
                    panZoom.x = panBase.x + (e.clientX - panStart.x);
                    panZoom.y = panBase.y + (e.clientY - panStart.y);
                    applyPanZoom();
                });
                svgContainer.addEventListener('pointerup', (e) => {
                    if (!panning) return;
                    panning = false;
                    try { svgContainer.releasePointerCapture(e.pointerId); } catch { }
                    ls.set('bm_panzoom', panZoom);
                });

                // --- Persist transforms for tune mode (per sex) ---
                let savedTransforms = ls.get('bm_transforms', {});
                Object.keys(savedTransforms || {}).forEach(storeKey => {
                    const organKey = (storeKey.includes('::') ? storeKey.split('::')[1] : storeKey);
                    document.querySelectorAll(`#body-map-svg [data-organ="${organKey}"]`).forEach(el => el.setAttribute('transform', savedTransforms[storeKey]));
                });

                // --- Export PDF ---
                const ensurePDFLibs = async () => {
                    if (!window.html2canvas) await loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
                    if (!(window.jspdf && window.jspdf.jsPDF)) await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
                };

                const exportPDF = async () => {
                    try {
                        await ensurePDFLibs();
                        const { jsPDF } = window.jspdf || {};
                        if (!jsPDF) throw new Error('jsPDF not loaded');
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const container = document.getElementById('body-map-svg-container');
                        const info = document.getElementById('body-map-info');
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const toImg = async (el) => {
                            const canvas = await window.html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
                            return { data: canvas.toDataURL('image/png'), w: canvas.width, h: canvas.height };
                        };
                        const img1 = await toImg(container);
                        const img1W = pageWidth - 20; const img1H = (img1.h / img1.w) * img1W;
                        pdf.addImage(img1.data, 'PNG', 10, 10, img1W, img1H);
                        pdf.addPage();
                        const img2 = await toImg(info);
                        const img2W = pageWidth - 20; const img2H = (img2.h / img2.w) * img2W;
                        pdf.addImage(img2.data, 'PNG', 10, 10, img2W, img2H);
                        const fname = `خريطة-الجسد-${(organNameEl.textContent || 'عضو')}.pdf`;
                        pdf.save(fname);
                        try { showNotification('تم تصدير PDF بنجاح', 'success'); } catch { }
                    } catch (e) {
                        console.error(e);
                        try { showNotification('تعذر تصدير PDF', 'error'); } catch { }
                    }
                };
                document.getElementById('body-map-export-pdf')?.addEventListener('click', exportPDF);

                // --- Share / Copy Summary / Reset View ---
                const shareBtn = document.getElementById('body-map-share');
                const copySummaryBtn = document.getElementById('body-map-copy-summary');
                const resetViewBtn = document.getElementById('body-map-reset-view');

                const buildSummaryText = (key) => {
                    const d = window.organData[key];
                    if (!d) return '—';
                    const cat = d.category;
                    const meta = (categoryMeta[cat] || { label: cat || 'غير مصنف' }).label;
                    const dflt = categoryDefaults[cat] || {};
                    const symptoms = d.symptoms || dflt.symptoms || [];
                    const redFlags = d.redFlags || dflt.redFlags || [];
                    const tests = d.tests || dflt.tests || [];
                    const seeDoctor = d.seeDoctor || dflt.seeDoctor || [];
                    const listToLines = (arr) => arr.map(i => `- ${i}`).join('\n');
                    return (
                        `العضو: ${d.name} (${meta})\n\nالأمراض المرتبطة: ${d.associatedDiseases}\n\nأعراض شائعة:\n${listToLines(symptoms)}\n\nعلامات إنذار:\n${listToLines(redFlags)}\n\nفحوصات مقترحة:\n${listToLines(tests)}\n\nمتى تراجع الطبيب؟\n${listToLines(seeDoctor)}\n\nالسبب الشعوري: ${d.emotionalCause}\nالنصيحة الشمولية: ${d.holisticAdvice}\n`);
                };

                shareBtn?.addEventListener('click', async () => {
                    try {
                        const url = updateHash({});
                        await navigator.clipboard.writeText(url);
                        showNotification('تم نسخ رابط المشاركة إلى الحافظة', 'success');
                    } catch { showNotification('تعذر نسخ الرابط', 'error'); }
                });

                copySummaryBtn?.addEventListener('click', async () => {
                    try {
                        const key = ls.get('bm_lastOrgan', null);
                        if (!key) { showNotification('اختر عضواً أولاً لنسخ ملخصه', 'warning'); return; }
                        const txt = buildSummaryText(key);
                        await navigator.clipboard.writeText(txt);
                        showNotification('تم نسخ الملخص', 'success');
                    } catch { showNotification('تعذر نسخ الملخص', 'error'); }
                });

                resetViewBtn?.addEventListener('click', () => {
                    // Reset pan/zoom
                    panZoom = { x: 0, y: 0, scale: 1 };
                    applyPanZoom();
                    ls.set('bm_panzoom', panZoom);
                    // Reset transforms
                    document.querySelectorAll('#body-map-svg [data-organ]').forEach(el => el.removeAttribute('transform'));
                    savedTransforms = {};
                    ls.set('bm_transforms', savedTransforms);
                    // Clear selection UI
                    organPaths.forEach(p => p.classList.remove('selected'));
                    organNameEl.textContent = 'اختر عضواً من الخريطة';
                    organDetailsEl.innerHTML = '<p class="text-gray-600">استخدم البحث أو الفلاتر أعلاه، ثم انقر على العضو للاطلاع على التفاصيل.</p>';
                    showNotification('تم تصفير العرض وإعادة الوضع الافتراضي', 'success');
                });

                // --- Lesson Mode ---
                const lessonToggleBtn = document.getElementById('body-map-lesson-toggle');
                const lessonPrevBtn = document.getElementById('body-map-lesson-prev');
                const lessonNextBtn = document.getElementById('body-map-lesson-next');
                let lessonActive = false; let lessonIndex = 0; let lessonOrder = [];
                const buildLessonOrder = () => {
                    const common = ['brain', 'lungs', 'heart', 'liver', 'stomach', 'pancreas', 'spleen', 'small_intestine', 'colon', 'kidneys', 'bladder'];
                    const sexSpecific = activeSex === 'female' ? ['uterus_ovaries'] : ['prostate'];
                    lessonOrder = common.concat(sexSpecific).filter(k => window.organData[k]);
                };
                const updateLessonUI = () => {
                    lessonPrevBtn.classList.toggle('hidden', !lessonActive);
                    lessonNextBtn.classList.toggle('hidden', !lessonActive);
                    lessonToggleBtn.textContent = lessonActive ? 'إنهاء الدرس' : 'بدء الدرس';
                };
                const lessonGo = (dir) => {
                    lessonIndex = Math.min(Math.max(0, lessonIndex + dir), lessonOrder.length - 1);
                    const key = lessonOrder[lessonIndex];
                    if (key) {
                        selectOrgan(key);
                        try { showNotification(`(${lessonIndex + 1}/${lessonOrder.length}): ${window.organData[key].name}`, 'success', 2500); } catch { }
                    }
                };
                lessonToggleBtn?.addEventListener('click', () => {
                    lessonActive = !lessonActive;
                    if (lessonActive) { buildLessonOrder(); lessonIndex = 0; lessonGo(0); }
                    updateLessonUI();
                });
                lessonPrevBtn?.addEventListener('click', () => lessonGo(-1));
                lessonNextBtn?.addEventListener('click', () => lessonGo(+1));

                // Expose simple API for deep links
                window.BodyMap = { selectOrgan, applySex, switchMode, exportPDF };

                // Mode toggle
                modeBtns.forEach(btn => btn.addEventListener('click', () => switchMode(btn.dataset.mode)));
                // If 3D model loads, prefer 3D by default; otherwise stay 2D
                if (model3D) {
                    model3D.addEventListener('load', () => {
                        if (model3DError) model3DError.classList.add('hidden');
                        switchMode('3d');
                    });
                    model3D.addEventListener('error', () => {
                        // First failure: try remote fallback demo model to verify wiring
                        if (!modelFallbackTried) {
                            modelFallbackTried = true;
                            try { showNotification('لم يتم العثور على النموذج المحلي. نحاول تحميل نموذج اختباري...', 'warning'); } catch (e) { }
                            model3D.src = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
                            return;
                        }
                        // Second failure: fall back to 2D and show inline error
                        switchMode('2d');
                        try { showNotification('تعذر تحميل النموذج ثلاثي الأبعاد. تم عرض النسخة ثنائية الأبعاد.', 'warning'); } catch (e) { }
                        if (model3DError) model3DError.classList.remove('hidden');
                    });
                }
                switchMode('2d');

                // Anatomy reference toggle
                if (refToggle && refEl) {
                    refToggle.addEventListener('click', () => {
                        const nowHidden = refEl.classList.toggle('hidden');
                        refToggle.textContent = nowHidden ? 'عرض المخطط التشريحي المرجعي' : 'إخفاء المخطط التشريحي المرجعي';
                    });
                }

                // Filtering
                let activeFilter = 'all';
                const applyFilter = () => {
                    organPaths.forEach(p => {
                        const cat = p.dataset.category || 'other';
                        const catOk = activeFilter === 'all' || cat === activeFilter;
                        const sexOk = !p.dataset.sex || p.dataset.sex === activeSex;
                        p.style.display = (catOk && sexOk) ? '' : 'none';
                    });
                    hotspotBtns.forEach(b => {
                        const cat = b.dataset.category || 'other';
                        const catOk = activeFilter === 'all' || cat === activeFilter;
                        b.style.display = catOk ? '' : 'none';
                    });
                };
                chipEls.forEach(chip => {
                    chip.addEventListener('click', () => {
                        chipEls.forEach(c => c.classList.remove('active'));
                        chip.classList.add('active');
                        activeFilter = chip.dataset.filter || 'all';
                        applyFilter();
                    });
                });

                // Save transform on drag end (redundant safety)
                svgRoot && svgRoot.addEventListener('pointerup', (e) => {
                    if (!tuneMode || !activeDragEl) return;
                    const key = activeDragEl.dataset.organ;
                    const t = activeDragEl.getAttribute('transform') || '';
                    const storeKey = `${activeSex}::${key}`;
                    savedTransforms[storeKey] = t;
                    ls.set('bm_transforms', savedTransforms);
                });

                // Search
                const normalize = (s) => (s || '').toString().toLowerCase();
                const applySearch = (term) => {
                    const q = normalize(term);
                    let anyMatch = false;
                    organPaths.forEach(p => {
                        const key = p.dataset.organ;
                        const data = window.organData[key];
                        if (!data) return;
                        const hay = [data.name, data.emotionalCause, data.associatedDiseases, ...(data.keywords || [])].join(' ');
                        const match = !q || normalize(hay).includes(q);
                        p.style.opacity = match ? '1' : '0.25';
                        p.classList.toggle('match', !!q && match);
                        if (match) anyMatch = true;
                    });
                    hotspotBtns.forEach(b => {
                        const key = b.dataset.organ;
                        const data = window.organData[key];
                        if (!data) return;
                        const hay = [data.name, data.emotionalCause, data.associatedDiseases, ...(data.keywords || [])].join(' ');
                        const match = !q || normalize(hay).includes(q);
                        b.style.opacity = match ? '1' : '0.25';
                    });
                };
                if (searchEl) {
                    searchEl.addEventListener('input', (e) => applySearch(e.target.value));
                }
                // initial states (from hash or saved)
                const hp = parseHashParams();
                const initialSex = hp.sex || ls.get('bm_sex', 'male');
                applySex(initialSex);
                const initialMode = hp.mode || ls.get('bm_mode', '2d');
                switchMode(initialMode);
                const initialOrgan = hp.organ || ls.get('bm_lastOrgan', null);
                if (initialOrgan) selectOrgan(initialOrgan);
                applyFilter();
                applySearch('');

                // Keyboard shortcuts (when on body-map view and not typing)
                document.addEventListener('keydown', (e) => {
                    const inInput = ['INPUT', 'TEXTAREA'].includes((document.activeElement || {}).tagName || '');
                    if (inInput) return;
                    if (typeof currentViewId !== 'string' || currentViewId !== 'body-map') return;
                    const key = e.key.toLowerCase();
                    if (key === 'l') { document.getElementById('body-map-lesson-toggle')?.click(); }
                    else if (key === ']') { document.getElementById('body-map-lesson-next')?.click(); }
                    else if (key === '[') { document.getElementById('body-map-lesson-prev')?.click(); }
                    else if (key === 'm') { const next = (ls.get('bm_mode', '2d') === '2d' ? '3d' : '2d'); switchMode(next); }
                    else if (key === 's') { const nextSex = (ls.get('bm_sex', 'male') === 'male' ? 'female' : 'male'); applySex(nextSex); }
                    else if (key === 'r') { document.getElementById('body-map-reset-view')?.click(); }
                    else if (key === 'p') { exportPDF(); }
                    else if (key === 'h') { document.getElementById('anatomy-ref-toggle')?.click(); }
                });
            }

            // --- QUIZZES MODULE (COMPLETED) ---
            function initQuizzes() {
                const modal = document.getElementById('quiz-modal');
                let modalContent = document.getElementById('quiz-modal-content');
                const modalClose = document.getElementById('quiz-modal-close');
                const catControl = document.getElementById('quiz-cat-control');
                const searchInput = document.getElementById('quiz-search');
                const featuredWrap = document.getElementById('quizzes-featured');
                const gridWrap = document.getElementById('quizzes-grid');
                const inlineContainer = document.getElementById('quiz-inline');
                const useInline = true; // user preference: inline rendering, no modal
                const catIcon = {
                    mental: 'fa-brain',
                    sleep: 'fa-bed',
                    metabolic: 'fa-apple-whole',
                    cardio: 'fa-heart-pulse',
                    respiratory: 'fa-lungs',
                    gastro: 'fa-bacteria',
                    geriatrics: 'fa-person-cane',
                    lifestyle: 'fa-person-walking'
                };
                let activeQuizId = null;
                let lastFocusedQuiz = null;

                const quizzes = {
                    'adrenal-fatigue': {
                        title: 'اختبار الإرهاق الكظري',
                        questions: [
                            { q: "هل تشعر بالتعب حتى بعد ليلة نوم كاملة؟", points: 2 },
                            { q: "هل تجد صعوبة في الاستيقاظ في الصباح؟", points: 2 },
                            { q: "هل تشتهي الأطعمة المالحة أو السكرية بشدة؟", points: 2 },
                            { q: "هل تشعر بالدوار أو الدوخة عند الوقوف بسرعة؟", points: 1 },
                            { q: "هل قدرتك على التعامل مع الإجهاد منخفضة؟", points: 2 },
                            { q: "هل تمرض بسهولة وتستغرق وقتاً أطول للشفاء؟", points: 1 },
                            { q: "هل تشعر بأن لديك طاقة أفضل في المساء؟", points: 1 },
                        ],
                        results: [
                            { score: 0, text: "احتمالية منخفضة لوجود إرهاق كظري. يبدو أن غددك الكظرية تعمل بشكل جيد. حافظ على نمط حياتك الصحي!" },
                            { score: 4, text: "احتمالية متوسطة لوجود إرهاق كظري. قد تكون غددك الكظرية تحت ضغط. من الجيد البدء في تطبيق تقنيات إدارة الإجهاد والنوم بشكل أفضل." },
                            { score: 7, text: "احتمالية عالية لوجود إرهاق كظري. غددك الكظرية بحاجة ماسة للدعم. نوصي بشدة بالتركيز على إدارة الإجهاد، التغذية الداعمة، والنوم. قد يكون من المفيد حجز استشارة لمناقشة النتائج." }
                        ]
                    },
                    'leaky-gut': {
                        title: 'تقييم الأمعاء المتسربة',
                        questions: [
                            { q: "هل تعاني من انتفاخ أو غازات أو آلام في البطن بشكل منتظم؟", points: 2 },
                            { q: "هل لديك حساسيات غذائية معروفة أو تشتبه في وجودها؟", points: 2 },
                            { q: "هل تعاني من مشاكل جلدية مثل الأكزيما، حب الشباب، أو الصدفية؟", points: 2 },
                            { q: "هل تعاني من آلام في المفاصل أو العضلات بدون سبب واضح؟", points: 1 },
                            { q: "هل تعاني من ضبابية الدماغ، صعوبة في التركيز، أو تقلبات مزاجية؟", points: 2 },
                            { q: "هل تم تشخيصك بمرض مناعي ذاتي (مثل الهاشيموتو أو التهاب المفاصل الروماتويدي)؟", points: 2 },
                            { q: "هل تتناول المضادات الحيوية أو مسكنات الألم بشكل متكرر؟", points: 1 },
                        ],
                        results: [
                            { score: 0, text: "احتمالية منخفضة لوجود أمعاء متسربة. جهازك الهضمي يبدو في حالة جيدة." },
                            { score: 4, text: "احتمالية متوسطة لوجود أمعاء متسربة. قد يكون من المفيد التركيز على نظام غذائي مضاد للالتهابات ودعم صحة الأمعاء." },
                            { score: 7, text: "احتمالية عالية لوجود أمعاء متسربة. نوصي بشدة بالنظر في بروتوكول علاجي للأمعاء واستشارة مختص." }
                        ]
                    },
                    'toxicity-score': {
                        title: 'احسب درجة السمية في جسمك',
                        questions: [
                            { q: "هل تستخدم أواني طهي غير لاصقة (تيفلون) بانتظام؟", points: 1 },
                            { q: "هل تشرب من قوارير بلاستيكية أو تستخدم حاويات طعام بلاستيكية؟", points: 1 },
                            { q: "هل نظامك الغذائي يحتوي على الكثير من الأطعمة المصنعة أو السريعة؟", points: 2 },
                            { q: "هل تستخدم منتجات التنظيف أو العناية الشخصية التقليدية (غير الطبيعية)؟", points: 2 },
                            { q: "هل تعاني من صداع، تعب، أو حساسية كيميائية (للعطور مثلاً)؟", points: 2 },
                            { q: "هل حركة أمعائك منتظمة (على الأقل مرة واحدة يومياً)؟", points: -2 },
                            { q: "هل تتعرق بانتظام من خلال التمارين الرياضية أو الساونا؟", points: -1 },
                        ],
                        results: [
                            { score: -3, text: "درجة سمية منخفضة جدًا. يبدو أنك تقوم بعمل رائع في تقليل تعرضك للسموم ودعم قدرة جسمك على التخلص منها." },
                            { score: 0, text: "درجة سمية منخفضة إلى معتدلة. هناك بعض الجوانب التي يمكن تحسينها لتقليل العبء على جسمك." },
                            { score: 3, text: "درجة سمية معتدلة إلى عالية. قد يستفيد جسمك بشكل كبير من استراتيجيات دعم إزالة السموم وتقليل التعرض للمواد الكيميائية." },
                            { score: 6, text: "درجة سمية عالية. من المهم اتخاذ خطوات جادة لتقليل تعرضك للسموم ودعم مسارات التخلص منها في الكبد والأمعاء والجلد." }
                        ]
                    },
                    'luscher-color-test': {
                        title: 'اختبار لوشير المبسط للألوان',
                        isColorTest: true,
                        colors: [
                            { name: 'أزرق', hex: '#004084' }, { name: 'أخضر', hex: '#006400' }, { name: 'أحمر', hex: '#b00000' }, { name: 'أصفر', hex: '#ffd700' },
                            { name: 'بنفسجي', hex: '#6a0dad' }, { name: 'بني', hex: '#8b4513' }, { name: 'أسود', hex: '#000000' }, { name: 'رمادي', hex: '#808080' }
                        ],
                        interpretations: {
                            'أزرق': 'يشير إلى الحاجة إلى الهدوء والسكينة والرضا. اختيارك له أولاً يعكس رغبة في بيئة مستقرة ومتناغمة.',
                            'أخضر': 'يمثل الثبات والعزيمة والمثابرة. اختياره يعبر عن رغبة في تأكيد الذات والسيطرة على مسار الحياة.',
                            'أحمر': 'يرمز إلى الطاقة والحيوية والرغبة في الفعل والإنجاز. اختياره يعكس حالة من الإثارة والقوة الدافعة.',
                            'أصفر': 'يعبر عن الأمل والتفاؤل والرغبة في التحرر والمستقبل المشرق. اختياره يشير إلى البحث عن السعادة والتوسع.',
                            'بنفسجي': 'مزيج من الأحمر والأزرق، يرمز إلى الرغبة في علاقة صوفية أو سحرية. قد يعبر عن عدم النضج أو الحاجة للهروب من الواقع.',
                            'بني': 'يمثل الجذور والحواس الجسدية. قد يشير اختياره إلى الشعور بالإرهاق والحاجة إلى الراحة واستعادة الحيوية الجسدية.',
                            'أسود': 'يرمز إلى النفي والرفض والتخلي. اختياره كأول لون قد يشير إلى التمرد ضد الوضع الحالي أو الشعور بالضغط الشديد.',
                            'رمادي': 'يمثل الحياد وعدم الرغبة في المشاركة. اختياره قد يعبر عن رغبة في عزل النفس عن الصراعات أو التحفيز الزائد.'
                        }
                    },
                    // --- Validated assessments (مختارات موثوقة) ---
                    'phq9': {
                        title: 'PHQ‑9 | تقييم الاكتئاب',
                        type: 'questionnaire',
                        meta: { cat: 'mental', featured: true, description: 'قياس شدة أعراض الاكتئاب خلال أسبوعين.' },
                        items: [
                            { q: 'قلة الاهتمام أو المتعة في فعل الأشياء', options: [{ label: 'أبداً (0)', score: 0 }, { label: 'عدة أيام (1)', score: 1 }, { label: 'أكثر من نصف الأيام (2)', score: 2 }, { label: 'تقريباً كل يوم (3)', score: 3 }] },
                            { q: 'الشعور بالاكتئاب أو الإحباط أو اليأس', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'مشاكل في النوم', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'الشعور بالتعب أو قلة الطاقة', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'ضعف الشهية أو الإفراط في الأكل', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'الشعور بسوء تجاه نفسك', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'صعوبة في التركيز', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'بطء/تململ ملحوظ', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'أفكار إيذاء النفس', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] }
                        ],
                        thresholds: [
                            { min: 0, max: 4, label: 'حدّي', text: 'أعراض منخفضة.' },
                            { min: 5, max: 9, label: 'خفيف', text: 'راقب نمط الحياة وناقش إن استمرت.' },
                            { min: 10, max: 14, label: 'متوسط', text: 'يوصى بتقييم سريري.' },
                            { min: 15, max: 19, label: 'شديد', text: 'يفضل متابعة مختص.' },
                            { min: 20, max: 27, label: 'شديد جداً', text: 'يُنصح بطلب مساعدة مختص فوراً.' }
                        ],
                        references: ['Kroenke K, Spitzer RL, Williams JBW. The PHQ‑9: Validity of a Brief Depression Severity Measure. J Gen Intern Med. 2001']
                    },
                    'gad7': {
                        title: 'GAD‑7 | تقييم القلق',
                        type: 'questionnaire',
                        meta: { cat: 'mental', featured: true, description: 'قياس شدة القلق العام.' },
                        items: [
                            { q: 'الشعور بالتوتر أو العصبية', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'عدم القدرة على التوقف عن القلق', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'القلق بشأن أمور مختلفة', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'صعوبة الاسترخاء', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'التململ', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'الانفعال بسهولة', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] },
                            { q: 'الشعور بالخوف من حدوث شيء سيء', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] }
                        ],
                        thresholds: [
                            { min: 0, max: 4, label: 'حدّي', text: 'أعراض منخفضة.' },
                            { min: 5, max: 9, label: 'خفيف', text: 'تكنيكات تنفس ونوم جيد.' },
                            { min: 10, max: 14, label: 'متوسط', text: 'يفيد تقييم سلوكي معرفي.' },
                            { min: 15, max: 21, label: 'شديد', text: 'تقييم سريري مُستحسن.' }
                        ],
                        references: ['Spitzer RL, Kroenke K, Williams JBW, Löwe B. A Brief Measure for Assessing Generalized Anxiety Disorder: The GAD‑7. Arch Intern Med. 2006']
                    },
                    'stop-bang': {
                        title: 'STOP‑Bang | خطر انقطاع النفس أثناء النوم',
                        type: 'questionnaire',
                        meta: { cat: 'sleep', featured: true, description: 'تقدير خطر OSA.' },
                        items: [
                            { q: 'شخير عالٍ؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'نعاس نهاري/إرهاق؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'توقف التنفس أثناء النوم؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'تعاني من ضغط دم مرتفع؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'BMI > 35؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'العمر > 50؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'محيط رقبة > 40 سم؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'ذكر؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] }
                        ],
                        thresholds: [
                            { min: 0, max: 2, label: 'منخفض', text: 'خطر منخفض.' },
                            { min: 3, max: 4, label: 'متوسط', text: 'قد يفيد تقييم نوم.' },
                            { min: 5, max: 8, label: 'مرتفع', text: 'ناقش دراسة نوم.' }
                        ]
                    },
                    'epworth': {
                        title: 'Epworth | مقياس النعاس النهاري',
                        type: 'questionnaire',
                        meta: { cat: 'sleep', featured: false, description: 'قياس ميل النعاس النهاري.' },
                        items: ['الجلوس وقراءة', 'مشاهدة التلفاز', 'مكان عام', 'راكب سيارة لساعة', 'الاستلقاء للراحة', 'التحدث مع شخص', 'بعد الغداء', 'قيادة والتوقف'].map(q => ({ q, options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }] })),
                        thresholds: [
                            { min: 0, max: 10, label: 'طبيعي', text: 'طبيعي.' },
                            { min: 11, max: 12, label: 'حدّي', text: 'راقب النوم.' },
                            { min: 13, max: 24, label: 'مرتفع', text: 'يستحسن تقييم اضطرابات النوم.' }
                        ]
                    },
                    'findrisc': {
                        title: 'FINDRISC | خطر السكري (10 سنوات)',
                        type: 'questionnaire',
                        meta: { cat: 'metabolic', featured: true, description: 'تقدير خطر الإصابة بالسكري من النمط 2.' },
                        items: [
                            { q: 'العمر', options: [{ label: '<45', score: 0 }, { label: '45–54', score: 2 }, { label: '55–64', score: 3 }, { label: '>64', score: 4 }] },
                            { q: 'BMI', options: [{ label: '<25', score: 0 }, { label: '25–30', score: 1 }, { label: '>30', score: 3 }] },
                            { q: 'محيط الخصر', options: [{ label: 'ذكر<94/أنثى<80', score: 0 }, { label: 'ذكر 94–102/أنثى 80–88', score: 3 }, { label: 'ذكر>102/أنثى>88', score: 4 }] },
                            { q: 'نشاط بدني ≥ 30 دقيقة/يوم', options: [{ label: 'نعم', score: 0 }, { label: 'لا', score: 2 }] },
                            { q: 'خضار/فاكهة يومياً', options: [{ label: 'نعم', score: 0 }, { label: 'لا', score: 1 }] },
                            { q: 'أدوية ضغط', options: [{ label: 'نعم', score: 2 }, { label: 'لا', score: 0 }] },
                            { q: 'سبق ارتفاع السكر', options: [{ label: 'نعم', score: 5 }, { label: 'لا', score: 0 }] },
                            { q: 'تاريخ عائلي سكري', options: [{ label: 'لا', score: 0 }, { label: 'درجة ثانية', score: 3 }, { label: 'درجة أولى', score: 5 }] }
                        ],
                        thresholds: [
                            { min: 0, max: 6, label: 'منخفض', text: 'حافظ على نمط صحي.' },
                            { min: 7, max: 11, label: 'معتدل', text: 'حسّن التغذية والنشاط.' },
                            { min: 12, max: 14, label: 'مرتفع', text: 'ناقش فحوص مع مختص.' },
                            { min: 15, max: 26, label: 'مرتفع جداً', text: 'يوصى بتقييم طبي وفحوص.' }
                        ],
                        references: ['Lindström J, Tuomilehto J. The Diabetes Risk Score: A practical tool to predict type 2 diabetes risk. Diabetes Care. 2003']
                    },
                    'bmi': {
                        title: 'حاسبة مؤشر كتلة الجسم (BMI)',
                        type: 'calculator',
                        meta: { cat: 'lifestyle', featured: false, description: 'احسب BMI من الطول والوزن.' },
                        fields: [{ id: 'weight', label: 'الوزن (كغ)' }, { id: 'height', label: 'الطول (سم)' }],
                        references: ['WHO Expert Committee. Obesity: Preventing and Managing the Global Epidemic. WHO, 2000']
                    },
                    'whtr': {
                        title: 'WHtR | نسبة الخصر للطول',
                        type: 'calculator',
                        meta: { cat: 'metabolic', featured: false, description: 'مؤشر مركّز لمخاطر القلب والأيض.' },
                        fields: [{ id: 'waist', label: 'محيط الخصر (سم)' }, { id: 'height', label: 'الطول (سم)' }],
                        references: ['Browning LM, Hsieh SD, Ashwell M. A systematic review of waist-to-height ratio as a screening tool. Nutr Res Rev. 2010']
                    },
                    'act': {
                        title: 'ACT | اختبار التحكم بالربو',
                        type: 'questionnaire',
                        meta: { cat: 'respiratory', featured: true, description: 'خمسة أسئلة لتقييم التحكم بالربو خلال 4 أسابيع.' },
                        items: [
                            { q: 'خلال 4 أسابيع، كم مرة أثّر الربو على نشاطك اليومي؟', options: [{ label: 'دائماً (1)', score: 1 }, { label: 'غالباً (2)', score: 2 }, { label: 'أحياناً (3)', score: 3 }, { label: 'نادراً (4)', score: 4 }, { label: 'أبداً (5)', score: 5 }] },
                            { q: 'كم مرة شعرت بضيق نفس؟', options: [{ label: 'دائماً (1)', score: 1 }, { label: 'غالباً (2)', score: 2 }, { label: 'أحياناً (3)', score: 3 }, { label: 'نادراً (4)', score: 4 }, { label: 'أبداً (5)', score: 5 }] },
                            { q: 'كم مرة استيقظت ليلاً بسبب الربو؟', options: [{ label: '4+ ليال/أسبوع (1)', score: 1 }, { label: '2–3 ليال (2)', score: 2 }, { label: '1 ليلة/أسبوع (3)', score: 3 }, { label: '1–2 مرات/شهر (4)', score: 4 }, { label: 'أبداً (5)', score: 5 }] },
                            { q: 'كم مرة استخدمت بخاخ الإنقاذ؟', options: [{ label: '3+ مرات/يوم (1)', score: 1 }, { label: '1–2 مرات/يوم (2)', score: 2 }, { label: '2–3 مرات/أسبوع (3)', score: 3 }, { label: '1 مرة/أسبوع (4)', score: 4 }, { label: 'أقل/أبداً (5)', score: 5 }] },
                            { q: 'كيف تُقيّم تحكمك العام بالربو؟', options: [{ label: 'سيء جداً (1)', score: 1 }, { label: 'سيء (2)', score: 2 }, { label: 'مقبول (3)', score: 3 }, { label: 'جيد (4)', score: 4 }, { label: 'ممتاز (5)', score: 5 }] }
                        ],
                        thresholds: [
                            { min: 5, max: 15, label: 'تحكم ضعيف جداً', text: 'يلزم مراجعة خطة العلاج. ناقش التعديلات مع مختص.' },
                            { min: 16, max: 19, label: 'تحكم غير كافٍ', text: 'قد تستفيد من تحسين الالتزام أو تعديل العلاج.' },
                            { min: 20, max: 25, label: 'تحكم جيد', text: 'استمر، وناقش تقليل المخاطر ومفاتيح الحفاظ.' }
                        ],
                        references: ['Nathan RA et al., J Allergy Clin Immunol, 2004']
                    },
                    'mmrc': {
                        title: 'mMRC | مقياس ضيق النفس المعدّل',
                        type: 'questionnaire',
                        meta: { cat: 'respiratory', featured: false, description: 'تقدير عبء ضيق النفس من 0 إلى 4.' },
                        items: [
                            { q: '0: ضيق نفس فقط عند الجهد الشديد', options: [{ label: 'ينطبق', score: 0 }] },
                            { q: '1: ضيق نفس عند الإسراع أو صعود تلّة خفيفة', options: [{ label: 'ينطبق', score: 1 }] },
                            { q: '2: المشي أبطأ من أقراني لضيق النفس أو التوقف بعد 15 دقيقة مشي', options: [{ label: 'ينطبق', score: 2 }] },
                            { q: '3: التوقف بعد مسافة قصيرة (100 متر) بسبب ضيق النفس', options: [{ label: 'ينطبق', score: 3 }] },
                            { q: '4: ضيق نفس يمنع مغادرة المنزل أو عند ارتداء الملابس', options: [{ label: 'ينطبق', score: 4 }] }
                        ],
                        thresholds: [
                            { min: 0, max: 1, label: 'خفيف', text: 'عبء ضيق نفس منخفض.' },
                            { min: 2, max: 2, label: 'متوسط', text: 'عبء متوسط؛ يفيد برنامج تأهيل رئوي.' },
                            { min: 3, max: 4, label: 'شديد', text: 'عبء عالٍ؛ يُستحسن تقييم وعلاج تخصصي.' }
                        ],
                        references: ['Bestall JC et al., Thorax, 1999']
                    },
                    'gerdq': {
                        title: 'GERD‑Q | تقييم الارتجاع المعدي المريئي',
                        type: 'questionnaire',
                        meta: { cat: 'gastro', featured: true, description: 'ستة بنود بدرجات تكرارية لمساعدة تقدير GERD.' },
                        items: [
                            { q: 'حرقة المعدة خلال الأسبوع الماضي', options: [{ label: '0 يوم (0)', score: 0 }, { label: '1 يوم (1)', score: 1 }, { label: '2–3 أيام (2)', score: 2 }, { label: '4–7 أيام (3)', score: 3 }] },
                            { q: 'ارتجاع/طعم مرّ بالفم', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2–3', score: 2 }, { label: '4–7', score: 3 }] },
                            { q: 'ألم أعلى البطن', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2–3', score: 2 }, { label: '4–7', score: 3 }] },
                            { q: 'الغثيان', options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2–3', score: 2 }, { label: '4–7', score: 3 }] },
                            { q: 'اضطراب النوم بسبب الأعراض', options: [{ label: '0 يوم (3)', score: 3 }, { label: '1 (2)', score: 2 }, { label: '2–3 (1)', score: 1 }, { label: '4–7 (0)', score: 0 }] },
                            { q: 'استخدام أدوية إضافية للأعراض', options: [{ label: '0 (3)', score: 3 }, { label: '1 (2)', score: 2 }, { label: '2–3 (1)', score: 1 }, { label: '4–7 (0)', score: 0 }] }
                        ],
                        thresholds: [
                            { min: 0, max: 7, label: 'منخفض', text: 'احتمال GERD منخفض.' },
                            { min: 8, max: 18, label: 'مرتفع', text: 'احتمال GERD مرتفع؛ ناقش خطة التشخيص/العلاج.' }
                        ],
                        references: ['Jones R et al., Aliment Pharmacol Ther, 2009']
                    },
                    'sarc-f': {
                        title: 'SARC‑F | خطر الساركوبينيا',
                        type: 'questionnaire',
                        meta: { cat: 'geriatrics', featured: false, description: 'خمسة بنود (0–2)؛ ≥4 يشير إلى خطر ساركوبينيا.' },
                        items: [
                            { q: 'القوة (فتح علبة أو حمل كيس)', options: [{ label: 'بدون صعوبة (0)', score: 0 }, { label: 'بعض الصعوبة (1)', score: 1 }, { label: 'صعوبة شديدة/غير قادر (2)', score: 2 }] },
                            { q: 'المشي عبر الغرفة', options: [{ label: 'بدون صعوبة (0)', score: 0 }, { label: 'بعض الصعوبة (1)', score: 1 }, { label: 'صعوبة شديدة/مساعدة (2)', score: 2 }] },
                            { q: 'القيام من كرسي/سرير', options: [{ label: 'بدون صعوبة (0)', score: 0 }, { label: 'بعض الصعوبة (1)', score: 1 }, { label: 'صعوبة شديدة (2)', score: 2 }] },
                            { q: 'الصعود عدة درجات', options: [{ label: 'بدون صعوبة (0)', score: 0 }, { label: 'بعض الصعوبة (1)', score: 1 }, { label: 'صعوبة شديدة (2)', score: 2 }] },
                            { q: 'السقوط خلال السنة الماضية', options: [{ label: '0 (0)', score: 0 }, { label: '1–3 (1)', score: 1 }, { label: '4+ (2)', score: 2 }] }
                        ],
                        thresholds: [
                            { min: 0, max: 3, label: 'منخفض', text: 'خطر ساركوبينيا منخفض.' },
                            { min: 4, max: 10, label: 'مرتفع', text: 'خطر مرتفع؛ يُستحسن تقييم وظيفة وكتلة العضلات.' }
                        ],
                        references: ['Malmstrom TK, Morley JE, J Nutr Health Aging, 2013']
                    },
                    'frail': {
                        title: 'FRAIL | متلازمة الوهَن (5 بنود)',
                        type: 'questionnaire',
                        meta: { cat: 'geriatrics', featured: false, description: 'Fatigue, Resistance, Ambulation, Illnesses, Loss of weight.' },
                        items: [
                            { q: 'Fatigue – تعب متكرر؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'Resistance – صعوبة صعود 10 درجات؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'Ambulation – صعوبة المشي عدة مئات أمتار؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'Illnesses – ≥5 أمراض مزمنة؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'Loss of weight – فقدان >5% خلال سنة؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] }
                        ],
                        thresholds: [
                            { min: 0, max: 0, label: 'سليم', text: 'لا توجد دلائل وهَن.' },
                            { min: 1, max: 2, label: 'ما قبل الوهَن', text: 'اعتمد خطة تغذية ونشاط ووظيفة.' },
                            { min: 3, max: 5, label: 'وهَن', text: 'يُنصح بتقييم شيخوخة شامل.' }
                        ],
                        references: ['Morley JE et al., J Nutr Health Aging, 2012']
                    },
                    'cat': {
                        title: 'CAT | تأثير داء الانسداد الرئوي المزمن (COPD)',
                        type: 'questionnaire',
                        meta: { cat: 'respiratory', featured: false, description: 'ثمانية بنود بدرجة 0–5 لكل بند لقياس التأثير اليومي.' },
                        items: ['الكحة', 'البلغم', 'ضيق النفس عند الجهد', 'ألم/ثقل الصدر', 'الأنشطة المنزلية', 'الخروج بثقة', 'النوم', 'الطاقة'].map(q => ({ q, options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }, { label: '4', score: 4 }, { label: '5', score: 5 }] })),
                        thresholds: [
                            { min: 0, max: 10, label: 'منخفض', text: 'تأثير منخفض. استمر على الخطة الحالية.' },
                            { min: 11, max: 20, label: 'متوسط', text: 'تأثير متوسط. ناقش برنامج تأهيل رئوي.' },
                            { min: 21, max: 30, label: 'شديد', text: 'تأثير واضح؛ يلزم مراجعة خطة العلاج.' },
                            { min: 31, max: 40, label: 'شديد جداً', text: 'تأثير شديد جداً؛ يُنصح بتقييم تخصصي عاجل.' }
                        ],
                        references: ['Jones PW et al., Eur Respir J, 2009']
                    },
                    'audit-c': {
                        title: 'AUDIT‑C | فحص تعاطي الكحول (3 بنود)',
                        type: 'questionnaire',
                        meta: { cat: 'lifestyle', featured: false, description: 'أداة سريعة (0–12). ≥4 قد يشير لاستخدام خطِر (يختلف حسب الجنس).' },
                        items: [
                            { q: 'عدد المرّات التي تتناول فيها مشروباً كحولياً؟', options: [{ label: 'أبداً (0)', score: 0 }, { label: 'شهرياً أو أقل (1)', score: 1 }, { label: '2–4 مرات/شهر (2)', score: 2 }, { label: '2–3 مرات/أسبوع (3)', score: 3 }, { label: '4+ مرات/أسبوع (4)', score: 4 }] },
                            { q: 'كم عدد المشروبات القياسية في اليوم المعتاد؟', options: [{ label: '1–2 (0)', score: 0 }, { label: '3–4 (1)', score: 1 }, { label: '5–6 (2)', score: 2 }, { label: '7–9 (3)', score: 3 }, { label: '10+ (4)', score: 4 }] },
                            { q: 'كم مرة تتناول 6 مشروبات أو أكثر في مناسبة واحدة؟', options: [{ label: 'أبداً (0)', score: 0 }, { label: 'أقل من شهرياً (1)', score: 1 }, { label: 'شهرياً (2)', score: 2 }, { label: 'أسبوعياً (3)', score: 3 }, { label: 'يومياً/تقريباً (4)', score: 4 }] }
                        ],
                        thresholds: [
                            { min: 0, max: 3, label: 'منخفض', text: 'استخدام منخفض الخطورة.' },
                            { min: 4, max: 12, label: 'محتمل خطر', text: 'نتيجة موجبة للفحص؛ تختلف العتبات حسب الجنس. ناقش مع مختص.' }
                        ],
                        references: ['Bush K et al., Arch Intern Med, 1998']
                    },
                    'scoff': {
                        title: 'SCOFF | فحص اضطرابات الأكل (5 أسئلة)',
                        type: 'questionnaire',
                        meta: { cat: 'mental', featured: false, description: '≥2 يشير لاحتمال اضطراب أكل؛ يلزم تقييم مختص.' },
                        items: [
                            { q: 'هل تُحدث القيء عمدًا لأنك تشعر بالامتلاء غير المريح؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'هل تقلق من فقدان السيطرة على كمّية ما تأكل؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'هل فقدت أكثر من 6 كغ خلال 3 أشهر؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'هل تعتقد أن الطعام يهيمن على حياتك؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] },
                            { q: 'هل ترى نفسك بديناً رغم قول الآخرين عكس ذلك؟', options: [{ label: 'نعم', score: 1 }, { label: 'لا', score: 0 }] }
                        ],
                        thresholds: [
                            { min: 0, max: 1, label: 'سلبي', text: 'لا توجد دلائل كافية؛ راقب فقط.' },
                            { min: 2, max: 5, label: 'موجب', text: 'نتيجة موجبة للفحص؛ يُستحسن تقييم مختص تغذية/نفسية.' }
                        ],
                        references: ['Morgan JF et al., BMJ, 1999']
                    },
                    'isi': {
                        title: 'ISI | مؤشر شدة الأرق (7 بنود)',
                        type: 'questionnaire',
                        meta: { cat: 'sleep', featured: false, description: '0–28؛ (0–7 طبيعي، 8–14 تحت العتبة، 15–21 متوسط، 22–28 شديد).' },
                        items: [
                            'صعوبة بدء النوم', 'صعوبة الاستمرار بالنوم', 'الاستيقاظ مبكراً', 'الرضا عن نمط النوم', 'ضعف الأداء النهاري', 'ملاحظة الآخرين لصعوباتك', 'القلق بشأن صعوبات النوم'
                        ].map(q => ({ q, options: [{ label: '0', score: 0 }, { label: '1', score: 1 }, { label: '2', score: 2 }, { label: '3', score: 3 }, { label: '4', score: 4 }] })),
                        thresholds: [
                            { min: 0, max: 7, label: 'طبيعي', text: 'لا توجد دلائل أرق سريري.' },
                            { min: 8, max: 14, label: 'تحت العتبة', text: 'تدخلات نمط الحياة قد تكفي.' },
                            { min: 15, max: 21, label: 'متوسط', text: 'قد يفيد CBT‑I أو تدخل علاجي.' },
                            { min: 22, max: 28, label: 'شديد', text: 'أرق شديد؛ يُستحسن تقييم متخصص بالنوم.' }
                        ],
                        references: ['Morin CM, Sleep Med, 2011']
                    },
                    'k10': {
                        title: 'K10 | مؤشر الضائقة النفسية (10 بنود)',
                        type: 'questionnaire',
                        meta: { cat: 'mental', featured: false, description: '10–50؛ درجات أعلى = ضائقة أعلى خلال 4 أسابيع.' },
                        items: [
                            'كم مرة شعرت بالتعب دون سبب؟', 'عصبي؟', 'ميّال للانهيار؟', 'ميّال باليأس؟', 'قلق؟', 'لا تستطيع الهدوء؟', 'كآبة؟', 'كل شيء جهد؟', 'لا شيء يفرحك؟', 'لا يمكنك الاستمرار؟'
                        ].map(q => ({ q, options: [{ label: 'أبداً (1)', score: 1 }, { label: 'قليلاً (2)', score: 2 }, { label: 'أحياناً (3)', score: 3 }, { label: 'غالباً (4)', score: 4 }, { label: 'دائماً (5)', score: 5 }] })),
                        thresholds: [
                            { min: 10, max: 15, label: 'منخفض', text: 'ضائقة منخفضة.' },
                            { min: 16, max: 21, label: 'متوسط', text: 'ضائقة متوسطة.' },
                            { min: 22, max: 29, label: 'عالٍ', text: 'ضائقة عالية؛ ناقش استراتيجيات دعم.' },
                            { min: 30, max: 50, label: 'عالٍ جداً', text: 'ضائقة عالية جداً؛ يُستحسن تقييم مختص.' }
                        ],
                        references: ['Kessler RC et al., Psychol Med, 2002']
                    },
                    'cha2ds2-vasc': {
                        title: 'CHA₂DS₂‑VASc | خطر السكتة في الرجفان الأذيني',
                        type: 'questionnaire',
                        meta: { cat: 'cardio', featured: false, description: 'للمرضى ذوي الرجفان الأذيني فقط. مجموع النقاط يقدّر خطر السكتة.' },
                        items: [
                            { q: 'قصور قلب احتقاني/خلل بطين أيسر', options: [{ label: 'نعم (1)', score: 1 }, { label: 'لا (0)', score: 0 }] },
                            { q: 'ارتفاع ضغط الدم', options: [{ label: 'نعم (1)', score: 1 }, { label: 'لا (0)', score: 0 }] },
                            { q: 'العمر ≥75 سنة', options: [{ label: 'نعم (2)', score: 2 }, { label: 'لا (0)', score: 0 }] },
                            { q: 'داء السكري', options: [{ label: 'نعم (1)', score: 1 }, { label: 'لا (0)', score: 0 }] },
                            { q: 'سكتة/نوبة إقفارية/صمّات سابقة', options: [{ label: 'نعم (2)', score: 2 }, { label: 'لا (0)', score: 0 }] },
                            { q: 'مرض وعائي (احتشاء/مرض شرياني/لويحات)', options: [{ label: 'نعم (1)', score: 1 }, { label: 'لا (0)', score: 0 }] },
                            { q: 'العمر 65–74 سنة', options: [{ label: 'نعم (1)', score: 1 }, { label: 'لا (0)', score: 0 }] },
                            { q: 'الجنس أنثى', options: [{ label: 'نعم (1)', score: 1 }, { label: 'لا (0)', score: 0 }] }
                        ],
                        thresholds: [
                            { min: 0, max: 0, label: 'منخفض', text: 'خطر سنوي منخفض. القرار العلاجي يعتمد على عوامل أخرى.' },
                            { min: 1, max: 1, label: 'متوسط', text: 'خطر متوسط؛ ناقش موازنة فائدة المضادّات للتخثّر.' },
                            { min: 2, max: 9, label: 'مرتفع', text: 'خطر مرتفع؛ غالباً توصى مضادات التخثّر إذا لا يوجد مانع.' }
                        ],
                        references: ['Lip GYH et al., Chest, 2010']
                    }
                };

                function showCatalog(show) {
                    try {
                        const controlsRow = searchInput?.closest('.mb-6');
                        const quickLinksEl = document.getElementById('quiz-quick-links');
                        controlsRow && controlsRow.classList.toggle('hidden', !show);
                        featuredWrap && featuredWrap.classList.toggle('hidden', !show);
                        quickLinksEl && quickLinksEl.classList.toggle('hidden', !show);
                        gridWrap && gridWrap.classList.toggle('hidden', !show);
                        inlineContainer && inlineContainer.classList.toggle('hidden', show);
                    } catch { }
                }
                function hideQuizInline() {
                    showCatalog(true);
                    if (inlineContainer) inlineContainer.innerHTML = '';
                    try {
                        const p = typeof parseHashParams === 'function' ? parseHashParams() : {};
                        const cat = p && p.cat ? `&cat=${encodeURIComponent(p.cat)}` : '';
                        window.__quizNavigating = true;
                        location.hash = `view=quizzes${cat}`;
                    } catch { }
                    activeQuizId = null;
                }
                const hideQuizModal = () => {
                    modal.classList.remove('is-open');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        if (modalContent) modalContent.innerHTML = '';
                        try { lastFocusedQuiz?.focus(); } catch { }
                    }, 300);
                    // Clean quiz param from hash but preserve category
                    try {
                        const p = typeof parseHashParams === 'function' ? parseHashParams() : {};
                        const cat = p && p.cat ? `&cat=${encodeURIComponent(p.cat)}` : '';
                        window.__quizNavigating = true;
                        location.hash = `view=quizzes${cat}`;
                    } catch { }
                    activeQuizId = null;
                };
                modalClose?.addEventListener('click', hideQuizModal);
                // Close on overlay click
                modal?.addEventListener('click', (e) => { if (e.target === modal) hideQuizModal(); });
                // Close on Escape
                window.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && !modal.classList.contains('hidden')) hideQuizModal();
                });
                // Close when navigating via CTA inside modal
                modalContent?.addEventListener('click', (ev) => {
                    const link = ev.target.closest('.nav-link');
                    if (link) hideQuizModal();
                });

                function bindStartButtons(scope) {
                    (scope || document).querySelectorAll('.quiz-start-btn').forEach(btn => {
                        if (btn.dataset.bound === '1') return;
                        btn.dataset.bound = '1';
                        btn.addEventListener('click', () => {
                            const quizId = btn.dataset.quiz;
                            startQuiz(quizId);
                        });
                    });
                }
                bindStartButtons();
                // Event delegation for dynamically inserted quiz cards
                const quizzesViewEl = document.getElementById('view-quizzes');
                quizzesViewEl?.addEventListener('click', (ev) => {
                    const btn = ev.target.closest('.quiz-start-btn');
                    if (!btn) return;
                    ev.preventDefault();
                    const id = btn.getAttribute('data-quiz');
                    if (id) startQuiz(id);
                });
                // Quick links (chips) fast start
                document.querySelectorAll('#quiz-quick-links .quiz-quick-btn')?.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const id = btn.getAttribute('data-quiz');
                        if (id) startQuiz(id);
                    });
                });
                // Expose starter for deep links
                window.__startQuiz = startQuiz;

                // Catalog rendering and interactivity (inside initQuizzes)
                if (featuredWrap && gridWrap) {
                    const staticGrid = document.querySelector('#view-quizzes .max-w-4xl');
                    function renderCatalog() {
                        try {
                            const activeCatBtn = catControl?.querySelector('.quiz-cat-btn[aria-selected="true"]');
                            const cat = activeCatBtn?.dataset.cat || 'all';
                            const q = (searchInput?.value || '').trim();
                            const entries = Object.entries(quizzes).map(([id, data]) => ({ id, data })).filter(e => {
                                const d = e.data;
                                const inCat = cat === 'all' || (d.meta && d.meta.cat === cat);
                                const text = (d.title + ' ' + (d.meta?.description || '')).toLowerCase();
                                const okSearch = !q || text.includes(q.toLowerCase());
                                return inCat && okSearch;
                            });
                            const featured = entries.filter(e => e.data.meta?.featured).slice(0, 2);
                            const regular = entries.filter(e => !e.data.meta?.featured);
                            const card = (e) => {
                                const cat = e.data.meta?.cat || 'lifestyle';
                                const icon = catIcon[cat] || 'fa-clipboard-check';
                                const isCalc = (e.data.type === 'calculator');
                                const verified = Array.isArray(e.data.references) && e.data.references.length > 0;
                                return `<div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow transform transition-transform hover:-translate-y-1">
                                <div class="flex items-center justify-between mb-2">
                                   <h3 class="text-2xl font-bold text-[--primary-dark]">${e.data.title}</h3>
                                   <span class="text-[--primary-color]"><i class="fa-solid ${icon}"></i></span>
                                </div>
                                <div class="flex items-center gap-2 mb-3">
                                   <span class="badge ${isCalc ? 'badge-secondary' : 'badge-primary'}">${isCalc ? 'حاسبة' : 'استبيان'}</span>
                                   ${verified ? '<span class="badge badge-success"><i class="fa-solid fa-shield-heart ml-1"></i>موثّق</span>' : ''}
                                </div>
                                <p class="text-gray-600 mb-3">${e.data.meta?.description || ''}</p>
                                <button class="btn btn-primary text-white py-2 px-6 rounded-full quiz-start-btn" data-quiz="${e.id}">ابدأ التقييم</button>
                            </div>`;
                            };
                            // Always hide static fallback; render dynamic list (or an empty-state message)
                            staticGrid?.classList.add('hidden');
                            featuredWrap.innerHTML = featured.map(card).join('');
                            gridWrap.innerHTML = entries.length
                                ? regular.map(card).join('')
                                : `<div class="col-span-2 text-center text-gray-600">لا توجد نتائج مطابقة. جرّب تصنيفاً آخر أو عدّل عبارة البحث.</div>`;
                            bindStartButtons(featuredWrap);
                            bindStartButtons(gridWrap);
                        } catch (err) {
                            console.error('renderCatalog error:', err);
                            // Fallback to static grid if dynamic fails
                            staticGrid?.classList.remove('hidden');
                        }
                    }
                    catControl?.addEventListener('click', (ev) => {
                        const btn = ev.target.closest('.quiz-cat-btn');
                        if (!btn) return;
                        catControl.querySelectorAll('.quiz-cat-btn').forEach(b => b.setAttribute('aria-selected', 'false'));
                        btn.setAttribute('aria-selected', 'true');
                        try { location.hash = `view=quizzes&cat=${encodeURIComponent(btn.dataset.cat || 'all')}`; } catch { }
                        renderCatalog();
                    });
                    searchInput?.addEventListener('input', renderCatalog);

                    // Enter to open top result
                    searchInput?.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            const first = gridWrap.querySelector('.quiz-start-btn') || featuredWrap.querySelector('.quiz-start-btn');
                            if (first) first.click();
                        }
                    });
                    renderCatalog();
                    // Expose re-render for view activation safety
                    window.__renderQuizzes = renderCatalog;
                }

                function startQuiz(quizId) {
                    const quizData = quizzes[quizId];
                    if (!quizData) return;
                    activeQuizId = quizId;
                    lastFocusedQuiz = document.activeElement;
                    // Update hash for deep-linking state
                    try {
                        const p = typeof parseHashParams === 'function' ? parseHashParams() : {};
                        const cat = p && p.cat ? `&cat=${encodeURIComponent(p.cat)}` : '';
                        window.__quizNavigating = true;
                        location.hash = `view=quizzes&quiz=${encodeURIComponent(quizId)}${cat}`;
                    } catch { }
                    if (useInline && inlineContainer) {
                        // Prepare inline rendering shell with Back button
                        showCatalog(false);
                        inlineContainer.innerHTML = `
                        <div class="text-right mb-4">
                          <button id="quiz-inline-back" class="btn btn-outline py-2 px-4 rounded-full"><i class="fa-solid fa-arrow-right-long ml-2"></i>عودة للقائمة</button>
                        </div>
                        <div id="quiz-inner"></div>`;
                        modalContent = document.getElementById('quiz-inner');
                        inlineContainer.querySelector('#quiz-inline-back')?.addEventListener('click', hideQuizInline);
                    }
                    if (quizData.type === 'calculator') {
                        renderCalculator(quizId, quizData);
                    } else if (quizData.isColorTest) {
                        renderColorTest(quizData);
                    } else {
                        // generic questionnaire/likert
                        renderQuestionnaire(quizData);
                    }
                    if (!useInline) {
                        modal.classList.remove('hidden');
                        setTimeout(() => modal.classList.add('is-open'), 10);
                    }
                }

                function renderQuestionnaire(quizData) {
                    let currentQuestion = 0;
                    let score = 0;
                    function renderQuestion() {
                        const list = (quizData.items || quizData.questions || []);
                        if (currentQuestion >= list.length) {
                            renderResult();
                            return;
                        }
                        const q = list[currentQuestion];
                        const total = list.length;
                        const hasOptions = Array.isArray(q.options);
                        let optionsHtml = '';
                        if (hasOptions) {
                            optionsHtml = q.options.map((op, i) => `<button class="quiz-option-btn btn ${i === 0 ? 'btn-primary text-white' : 'btn-secondary'} py-2 px-6 rounded-full" data-score="${op.score}">${op.label}</button>`).join(' ');
                        } else {
                            optionsHtml = `
                           <button class="quiz-yn-btn btn btn-primary text-white py-2 px-8 rounded-full" data-yn="yes">نعم</button>
                           <button class="quiz-yn-btn btn btn-secondary py-2 px-8 rounded-full" data-yn="no">لا</button>`;
                        }
                        const progress = Math.round((currentQuestion) / Math.max(1, total) * 100);
                        modalContent.innerHTML = `
                        <h3 class="text-2xl font-bold mb-2">${quizData.title}</h3>
                        <div class="w-full h-2 bg-gray-200 rounded-full mb-4 overflow-hidden" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" aria-label="التقدم"><div class="h-2 bg-[--accent-color] rounded-full" style="width:${progress}%"></div></div>
                        <p class="text-gray-500 mb-4">السؤال ${currentQuestion + 1} من ${total}</p>
                        <p class="text-xl font-semibold mb-6 text-center">${q.q || q}</p>
                        <div class="flex flex-wrap justify-center gap-3">${optionsHtml}</div>
                    `;
                        if (hasOptions) {
                            modalContent.querySelectorAll('.quiz-option-btn').forEach(btn => {
                                btn.addEventListener('click', () => {
                                    const s = parseFloat(btn.dataset.score || '0');
                                    score += isNaN(s) ? 0 : s;
                                    currentQuestion++;
                                    renderQuestion();
                                });
                            });
                        } else {
                            modalContent.querySelectorAll('.quiz-yn-btn').forEach(btn => {
                                btn.addEventListener('click', (e) => {
                                    const yes = e.currentTarget.getAttribute('data-yn') === 'yes';
                                    if (yes) score += q.points || 0; else if ((q.points || 0) < 0) score -= (q.points || 0);
                                    currentQuestion++;
                                    renderQuestion();
                                });
                            });
                        }
                    }
                    function renderResult() {
                        let resultText = '';
                        if (Array.isArray(quizData.thresholds)) {
                            const t = quizData.thresholds.find(th => score >= th.min && score <= th.max) || {};
                            resultText = `${t.label ? ('التصنيف: ' + t.label + '<br>') : ''}${t.text || ''}`;
                        } else if (Array.isArray(quizData.results)) {
                            for (let i = quizData.results.length - 1; i >= 0; i--) {
                                if (score >= quizData.results[i].score) { resultText = quizData.results[i].text; break; }
                            }
                        }
                        const toolTitle = quizData.title || 'نتيجة التقييم';
                        const saveBtnHtml = (typeof currentUser === 'object' && currentUser) ? '<button id="save-quiz-result" class="btn btn-secondary py-2 px-6 rounded-full mr-2">حفظ النتيجة</button>' : '';
                        const refs = Array.isArray(quizData.references) ? `<div class="text-xs text-gray-500 mt-4 text-right"><strong>مراجع:</strong><ul class="list-disc pr-5">${quizData.references.map(r => `<li>${r}</li>`).join('')}</ul></div>` : '';
                        const ctas = `
                        <div class="flex flex-wrap gap-2 justify-center mt-4">
                          <a href="#" class="nav-link btn btn-outline py-2 px-4 rounded-full" data-view="second-opinion"><i class="fa-solid fa-stethoscope ml-2"></i>الرأي الطبي الثاني</a>
                          <a href="#" class="nav-link btn btn-outline py-2 px-4 rounded-full" data-view="medical-travel"><i class="fa-solid fa-plane-departure ml-2"></i>تنسيق السفر الطبي</a>
                        </div>`;
                        modalContent.innerHTML = `
                        <h3 class="text-2xl font-bold mb-2">${toolTitle}</h3>
                        <div class="bg-gray-100 p-6 rounded-lg text-center">
                            <p class="text-lg mb-2">درجتك هي: <span class="font-bold text-2xl text-[--primary-color]">${score}</span></p>
                            <p class="text-gray-700">${resultText}</p>
                        </div>
                        ${refs}
                        ${ctas}
                        <div class="text-center mt-6 flex flex-wrap gap-2 justify-center">
                            ${saveBtnHtml}
                            <button id="copy-quiz-result" class="btn btn-secondary py-2 px-6 rounded-full">نسخ النتيجة</button>
                            <button id="share-quiz-result" class="btn btn-secondary py-2 px-6 rounded-full"><i class="fa-solid fa-share-nodes ml-1"></i>مشاركة</button>
                            <button id="download-quiz-pdf" class="btn btn-primary text-white py-2 px-6 rounded-full">تحميل كـ PDF</button>
                        </div>
                        <div class="legal-disclaimer mt-4 p-3 text-sm">
                            <p>هذه الأداة معلوماتية ولا تُعد تشخيصاً طبياً. شارك نتائجك مع مختص لاتخاذ القرار الأنسب لحالتك.</p>
                        </div>`;
                        document.getElementById('download-quiz-pdf')?.addEventListener('click', () => downloadResultAsPDF(useInline ? 'quiz-inner' : 'quiz-modal-content', toolTitle));
                        document.getElementById('save-quiz-result')?.addEventListener('click', () => {
                            const full = `--- العنوان ---\n${toolTitle}\n\n--- الدرجة ---\n${score}\n\n--- التفسير ---\n${resultText}`;
                            saveResultToFirestore(toolTitle, full, { kind: 'assessment', id: activeQuizId, cat: quizData.meta?.cat || null, score });
                        });
                        document.getElementById('copy-quiz-result')?.addEventListener('click', async () => {
                            try {
                                const txt = `${toolTitle}\nالدرجة: ${score}\n${stripHtml(resultText)}`;
                                await navigator.clipboard.writeText(txt);
                                showNotification('تم نسخ النتيجة إلى الحافظة.', 'success');
                            } catch { showNotification('تعذّر النسخ. حاول يدوياً.', 'warning'); }
                        });
                        document.getElementById('share-quiz-result')?.addEventListener('click', async () => {
                            try {
                                const shareText = `${toolTitle} — الدرجة: ${score}\n${stripHtml(resultText)}`;
                                if (navigator.share) {
                                    await navigator.share({ title: toolTitle, text: shareText, url: location.href });
                                } else {
                                    await navigator.clipboard.writeText(shareText + `\n${location.href}`);
                                    showNotification('تم نسخ نص المشاركة لأن Web Share غير متاح.', 'warning');
                                }
                            } catch { }
                        });
                        modalContent.querySelector('.close-quiz-modal-btn')?.addEventListener('click', useInline ? hideQuizInline : hideQuizModal);
                    }
                    renderQuestion();
                }

                function renderCalculator(quizId, quizData) {
                    const fieldsHtml = (quizData.fields || []).map(f => `
                    <div class="mb-4">
                        <label class="block mb-1">${f.label}</label>
                        <input id="calc-${f.id}" type="number" class="w-full p-2 border rounded-md" step="0.1">
                    </div>`).join('');
                    modalContent.innerHTML = `
                    <h3 class="text-2xl font-bold mb-4">${quizData.title}</h3>
                    <div class="bg-gray-50 p-4 rounded-lg mb-4">${quizData.meta?.description || ''}</div>
                    ${fieldsHtml}
                    <div class="text-center mt-4">
                        <button id="calc-run" class="btn btn-primary text-white py-2 px-8 rounded-full">احسب</button>
                    </div>
                    <div id="calc-result" class="mt-4"></div>
                `;
                    document.getElementById('calc-run')?.addEventListener('click', () => {
                        const out = document.getElementById('calc-result');
                        if (quizId === 'bmi') {
                            const w = parseFloat(document.getElementById('calc-weight')?.value || '0');
                            const hcm = parseFloat(document.getElementById('calc-height')?.value || '0');
                            if (!w || !hcm) { out.innerHTML = '<p class="text-red-600">أدخل الطول والوزن.</p>'; return; }
                            if (w < 20 || w > 300 || hcm < 100 || hcm > 250) { out.innerHTML = '<p class="text-red-600">تحقق من القيم: الطول 100–250 سم والوزن 20–300 كغ.</p>'; return; }
                            const m = hcm / 100; const bmi = w / (m * m);
                            let cls = bmi < 18.5 ? 'نحافة' : (bmi < 25 ? 'طبيعي' : (bmi < 30 ? 'زيادة وزن' : 'بدانة'));
                            out.innerHTML = `<div class="bg-white p-4 rounded-lg shadow text-center">
                            <p>BMI: <strong>${bmi.toFixed(1)}</strong> — ${cls}</p>
                            <div class="mt-3 flex flex-wrap gap-2 justify-center">
                                ${currentUser ? '<button id="save-calc-result" class="btn btn-secondary py-1.5 px-4 rounded-full">حفظ</button>' : ''}
                                <button id="copy-calc-result" class="btn btn-secondary py-1.5 px-4 rounded-full">نسخ</button>
                            </div>
                        </div>`;
                            document.getElementById('save-calc-result')?.addEventListener('click', () => {
                                const toolTitle = quizData.title;
                                const full = `--- العنوان ---\n${toolTitle}\n\n--- النتيجة ---\nBMI: ${bmi.toFixed(1)} — ${cls}`;
                                saveResultToFirestore(toolTitle, full, { kind: 'calculator', id: quizId, inputs: { weight: w, height: hcm }, bmi });
                            });
                            document.getElementById('copy-calc-result')?.addEventListener('click', async () => {
                                try { await navigator.clipboard.writeText(`BMI: ${bmi.toFixed(1)} — ${cls}`); showNotification('تم النسخ.', 'success'); } catch { }
                            });
                        } else if (quizId === 'whtr') {
                            const waist = parseFloat(document.getElementById('calc-waist')?.value || '0');
                            const height = parseFloat(document.getElementById('calc-height')?.value || '0');
                            if (!waist || !height) { out.innerHTML = '<p class="text-red-600">أدخل الخصر والطول.</p>'; return; }
                            if (waist < 40 || waist > 200 || height < 100 || height > 250) { out.innerHTML = '<p class="text-red-600">تحقق من القيم: الخصر 40–200 سم والطول 100–250 سم.</p>'; return; }
                            const whtr = waist / height;
                            let cls = whtr < 0.5 ? 'منخفض' : (whtr < 0.6 ? 'متوسط' : 'مرتفع');
                            out.innerHTML = `<div class="bg-white p-4 rounded-lg shadow text-center">
                            <p>WHtR: <strong>${whtr.toFixed(2)}</strong> — خطر ${cls}</p>
                            <div class="mt-3 flex flex-wrap gap-2 justify-center">
                                ${currentUser ? '<button id="save-calc-result" class="btn btn-secondary py-1.5 px-4 rounded-full">حفظ</button>' : ''}
                                <button id="copy-calc-result" class="btn btn-secondary py-1.5 px-4 rounded-full">نسخ</button>
                            </div>
                        </div>`;
                            document.getElementById('save-calc-result')?.addEventListener('click', () => {
                                const toolTitle = quizData.title;
                                const full = `--- العنوان ---\n${toolTitle}\n\n--- النتيجة ---\nWHtR: ${whtr.toFixed(2)} — خطر ${cls}`;
                                saveResultToFirestore(toolTitle, full, { kind: 'calculator', id: quizId, inputs: { waist, height }, whtr });
                            });
                            document.getElementById('copy-calc-result')?.addEventListener('click', async () => {
                                try { await navigator.clipboard.writeText(`WHtR: ${whtr.toFixed(2)} — خطر ${cls}`); showNotification('تم النسخ.', 'success'); } catch { }
                            });
                        }
                    });
                }

                function renderColorTest(quizData) {
                    let selectedOrder = [];
                    const totalColors = quizData.colors.length;

                    function updateInstructions() {
                        const instructionEl = modalContent.querySelector('#luscher-instruction');
                        if (instructionEl) {
                            const remaining = totalColors - selectedOrder.length;
                            if (remaining > 0) {
                                instructionEl.textContent = `اختر اللون المفضل لديك من بين الألوان المتبقية. (${remaining} متبقي)`;
                            } else {
                                instructionEl.textContent = 'اكتمل الاختيار! انقر أدناه للحصول على تحليلك.';
                            }
                        }
                    }

                    function handleColorClick(e) {
                        const swatch = e.target;
                        if (swatch.classList.contains('selected')) return;

                        selectedOrder.push(swatch.dataset.colorName);
                        swatch.classList.add('selected');
                        swatch.setAttribute('data-order', selectedOrder.length);

                        updateInstructions();

                        if (selectedOrder.length === totalColors) {
                            const analyzeBtn = modalContent.querySelector('#analyze-luscher-btn');
                            if (analyzeBtn) {
                                analyzeBtn.classList.remove('hidden');
                                analyzeBtn.classList.add('flex', 'mx-auto');
                            }
                        }
                    }

                    modalContent.innerHTML = `
                    <h3 class="text-2xl font-bold mb-2">${quizData.title}</h3>
                    <p id="luscher-instructions" class="text-gray-600 mb-4 text-center">اختر اللون المفضل لديك من بين الألوان المتبقية. (8 متبقي)</p>
                    <div class="color-swatch-container">
                        ${quizData.colors.map(c => `<div class="color-swatch" data-color-name="${c.name}" style="background-color: ${c.hex};"></div>`).join('')}
                    </div>
                    <div class="text-sm text-gray-500 mb-4">
                        <p><strong>إخلاء مسؤولية:</strong> هذا الاختبار هو نسخة مبسطة لأغراض الاستكشاف الذاتي فقط ولا يمثل تشخيصاً نفسياً أو طبياً كاملاً.</p>
                    </div>
                    <div class="text-center mt-6">
                        <button id="analyze-luscher-btn" class="hidden btn btn-primary text-white py-2 px-8 rounded-full">احصل على التحليل</button>
                    </div>
                `;

                    const swatches = modalContent.querySelectorAll('.color-swatch');
                    swatches.forEach(swatch => swatch.addEventListener('click', handleColorClick));

                    modalContent.querySelector('#analyze-luscher-btn').addEventListener('click', () => {
                        const firstChoice = selectedOrder[0];
                        const lastChoice = selectedOrder[7];
                        const analysis = `
                        <h3 class="text-2xl font-bold mb-2">تحليل اختياراتك</h3>
                        <div class="text-right space-y-3">
                           <p><strong>تفضيلك الأول (<span class="font-bold text-green-600">هدف مرغوب</span>): ${firstChoice}</strong></p>
                           <p class="text-gray-700 pr-4">${quizData.interpretations[firstChoice]}</p>
                           <p><strong>تفضيلك الأخير (<span class="font-bold text-red-600">صفة مرفوضة</span>): ${lastChoice}</strong></p>
                           <p class="text-gray-700 pr-4">رفضك للون ${lastChoice} قد يشير إلى أنك ترفض بوعي أو بغير وعي الصفات التي يمثلها. ${quizData.interpretations[lastChoice]}</p>
                        </div>
                        <div class="text-center mt-6">
                           <button class="close-quiz-modal-btn btn btn-primary text-white py-2 px-6 rounded-full">إغلاق</button>
                        </div>
                    `;
                        modalContent.innerHTML = analysis;
                        modalContent.querySelector('.close-quiz-modal-btn').addEventListener('click', hideQuizModal);
                    });
                }
            }

            // --- ENHANCED JOURNAL MODULE ---
            let journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
            let currentJournalChart = null;
            let activeChartType = 'mood';

            function initJournal() {
                const form = document.getElementById('journal-form');
                if (!form) return;

                // Set current date and time
                const now = new Date();
                document.getElementById('entry-date').valueAsDate = now;
                document.getElementById('entry-time').value = now.toTimeString().slice(0, 5);

                // Initialize sliders with real-time feedback
                initJournalSliders();
                
                // Initialize chart tabs
                initJournalChartTabs();

                // Load existing data
                loadJournalData();
                updateJournalStats();
                renderJournalChart();
                generateJournalInsights();

                // Form submission
                form.addEventListener('submit', handleJournalFormSubmit);

                // Export and clear buttons
                document.getElementById('export-journal')?.addEventListener('click', exportJournal);
                document.getElementById('clear-journal')?.addEventListener('click', clearJournal);
            }

            function initJournalSliders() {
                // Mood slider
                const moodSlider = document.getElementById('mood-rating');
                const moodValue = document.getElementById('mood-value');
                moodSlider?.addEventListener('input', (e) => {
                    moodValue.textContent = `(${e.target.value})`;
                    updateSliderColor(e.target, e.target.value);
                });

                // Energy slider
                const energySlider = document.getElementById('energy-rating');
                const energyValue = document.getElementById('energy-value');
                energySlider?.addEventListener('input', (e) => {
                    energyValue.textContent = `(${e.target.value})`;
                    updateSliderColor(e.target, e.target.value);
                });

                // Stress slider
                const stressSlider = document.getElementById('stress-rating');
                const stressValue = document.getElementById('stress-value');
                stressSlider?.addEventListener('input', (e) => {
                    stressValue.textContent = `(${e.target.value})`;
                    updateSliderColor(e.target, e.target.value);
                });
            }

            function updateSliderColor(slider, value) {
                const percentage = ((value - slider.min) / (slider.max - slider.min)) * 100;
                const hue = ((10 - value) * 12); // Red to green gradient
                slider.style.background = `linear-gradient(90deg, hsl(${hue}, 70%, 50%) ${percentage}%, #e5e7eb ${percentage}%)`;
            }

            function initJournalChartTabs() {
                const tabs = document.querySelectorAll('.chart-tab-btn');
                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        // Update active tab
                        tabs.forEach(t => {
                            t.classList.remove('active', 'bg-[--accent-color]', 'text-white');
                            t.classList.add('bg-gray-100', 'text-gray-600');
                        });
                        tab.classList.remove('bg-gray-100', 'text-gray-600');
                        tab.classList.add('active', 'bg-[--accent-color]', 'text-white');
                        
                        // Update chart
                        activeChartType = tab.dataset.chart;
                        renderJournalChart();
                    });
                });
            }

            function handleJournalFormSubmit(e) {
                e.preventDefault();
                
                const formData = {
                    id: Date.now().toString(),
                    date: document.getElementById('entry-date').value,
                    time: document.getElementById('entry-time').value,
                    mood: parseInt(document.getElementById('mood-rating').value),
                    energy: parseInt(document.getElementById('energy-rating').value),
                    stress: parseInt(document.getElementById('stress-rating').value),
                    sleepHours: parseFloat(document.getElementById('sleep-hours').value) || 0,
                    sleepQuality: document.getElementById('sleep-quality').value,
                    symptoms: Array.from(document.querySelectorAll('input[name="symptoms"]:checked')).map(cb => cb.value),
                    customSymptoms: document.getElementById('custom-symptoms').value,
                    activities: Array.from(document.querySelectorAll('input[name="activities"]:checked')).map(cb => cb.value),
                    notes: document.getElementById('daily-notes').value,
                    createdAt: new Date().toISOString()
                };

                // Save entry
                journalEntries.unshift(formData);
                localStorage.setItem('journalEntries', JSON.stringify(journalEntries));

                // Reset form
                e.target.reset();
                const now = new Date();
                document.getElementById('entry-date').valueAsDate = now;
                document.getElementById('entry-time').value = now.toTimeString().slice(0, 5);
                
                // Reset sliders
                document.getElementById('mood-value').textContent = '(5)';
                document.getElementById('energy-value').textContent = '(5)';
                document.getElementById('stress-value').textContent = '(5)';

                // Update UI
                loadJournalData();
                updateJournalStats();
                renderJournalChart();
                generateJournalInsights();

                showNotification('تم حفظ الإدخال بنجاح!', 'success');
            }

            function loadJournalData() {
                const container = document.getElementById('journal-entries-container');
                
                if (journalEntries.length === 0) {
                    container.innerHTML = `
                        <div class="text-center text-gray-500 py-8">
                            <i class="fas fa-clipboard-list text-4xl mb-3 opacity-50"></i>
                            <p>لا توجد إدخالات بعد</p>
                            <p class="text-sm">ابدأ بإضافة إدخالك الأول!</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = journalEntries.slice(0, 10).map(entry => `
                    <div class="bg-gray-50 p-4 rounded-lg border-r-4 border-[--accent-color] journal-entry-card">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-medium">${new Date(entry.date).toLocaleDateString('ar-SA')}</span>
                                ${entry.time ? `<span class="text-xs text-gray-500">${entry.time}</span>` : ''}
                            </div>
                            <button onclick="deleteJournalEntry('${entry.id}')" class="text-red-500 hover:text-red-700 text-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                            <div class="flex items-center">
                                <span class="text-blue-600">😊 ${entry.mood}/10</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-green-600">⚡ ${entry.energy}/10</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-purple-600">😰 ${entry.stress}/10</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-orange-600">😴 ${entry.sleepHours}h</span>
                            </div>
                        </div>
                        ${entry.symptoms.length > 0 ? `
                            <div class="mb-2">
                                <span class="text-xs text-gray-600">الأعراض:</span>
                                <div class="flex flex-wrap gap-1 mt-1">
                                    ${entry.symptoms.map(symptom => `<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">${getSymptomName(symptom)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${entry.activities.length > 0 ? `
                            <div class="mb-2">
                                <span class="text-xs text-gray-600">الأنشطة:</span>
                                <div class="flex flex-wrap gap-1 mt-1">
                                    ${entry.activities.map(activity => `<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">${getActivityName(activity)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${entry.notes ? `<p class="text-sm text-gray-700 mt-2">${entry.notes}</p>` : ''}
                    </div>
                `).join('');
            }

            function updateJournalStats() {
                if (journalEntries.length === 0) {
                    document.getElementById('avg-mood-stat').textContent = '--';
                    document.getElementById('avg-energy-stat').textContent = '--';
                    document.getElementById('avg-sleep-stat').textContent = '--';
                    document.getElementById('total-entries-stat').textContent = '0';
                    return;
                }

                const avgMood = (journalEntries.reduce((sum, entry) => sum + entry.mood, 0) / journalEntries.length).toFixed(1);
                const avgEnergy = (journalEntries.reduce((sum, entry) => sum + entry.energy, 0) / journalEntries.length).toFixed(1);
                const avgSleep = (journalEntries.reduce((sum, entry) => sum + (entry.sleepHours || 0), 0) / journalEntries.length).toFixed(1);

                document.getElementById('avg-mood-stat').textContent = avgMood;
                document.getElementById('avg-energy-stat').textContent = avgEnergy;
                document.getElementById('avg-sleep-stat').textContent = avgSleep + 'h';
                document.getElementById('total-entries-stat').textContent = journalEntries.length;
            }

            async function renderJournalChart() {
                await ensureChart();
                const canvas = document.getElementById('journal-chart');
                if (!canvas || journalEntries.length === 0) return;

                const ctx = canvas.getContext('2d');
                
                // Destroy existing chart
                if (currentJournalChart) {
                    currentJournalChart.destroy();
                }

                const last30Days = journalEntries.slice(0, 30).reverse();
                const labels = last30Days.map(entry => new Date(entry.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }));

                let datasets = [];
                
                switch (activeChartType) {
                    case 'mood':
                        datasets = [{
                            label: 'المزاج',
                            data: last30Days.map(entry => entry.mood),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4
                        }];
                        break;
                    case 'energy':
                        datasets = [{
                            label: 'الطاقة',
                            data: last30Days.map(entry => entry.energy),
                            borderColor: 'rgb(34, 197, 94)',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            fill: true,
                            tension: 0.4
                        }];
                        break;
                    case 'sleep':
                        datasets = [{
                            label: 'ساعات النوم',
                            data: last30Days.map(entry => entry.sleepHours || 0),
                            borderColor: 'rgb(168, 85, 247)',
                            backgroundColor: 'rgba(168, 85, 247, 0.1)',
                            fill: true,
                            tension: 0.4
                        }];
                        break;
                    case 'stress':
                        datasets = [{
                            label: 'التوتر',
                            data: last30Days.map(entry => entry.stress),
                            borderColor: 'rgb(239, 68, 68)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.4
                        }];
                        break;
                    case 'correlation':
                        datasets = [
                            {
                                label: 'المزاج',
                                data: last30Days.map(entry => entry.mood),
                                borderColor: 'rgb(59, 130, 246)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                tension: 0.4
                            },
                            {
                                label: 'الطاقة',
                                data: last30Days.map(entry => entry.energy),
                                borderColor: 'rgb(34, 197, 94)',
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                tension: 0.4
                            },
                            {
                                label: 'التوتر',
                                data: last30Days.map(entry => entry.stress),
                                borderColor: 'rgb(239, 68, 68)',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                tension: 0.4
                            }
                        ];
                        break;
                }

                currentJournalChart = new Chart(ctx, {
                    type: 'line',
                    data: { labels, datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: activeChartType === 'sleep' ? 12 : 10
                            }
                        }
                    }
                });
            }

            function generateJournalInsights() {
                const container = document.getElementById('insights-container');
                
                if (journalEntries.length < 7) {
                    container.innerHTML = `
                        <div class="bg-white p-3 rounded-lg text-sm">
                            <i class="fas fa-info-circle text-blue-500 ml-2"></i>
                            ابدأ بتسجيل بياناتك لمدة أسبوع للحصول على رؤى مخصصة
                        </div>
                    `;
                    return;
                }

                const insights = [];
                const recent7Days = journalEntries.slice(0, 7);
                
                // Mood trend
                const avgMood = recent7Days.reduce((sum, entry) => sum + entry.mood, 0) / 7;
                if (avgMood >= 7) {
                    insights.push({
                        type: 'positive',
                        icon: 'fas fa-smile',
                        text: 'مزاجك ممتاز هذا الأسبوع! استمر على هذا المنوال'
                    });
                } else if (avgMood <= 4) {
                    insights.push({
                        type: 'warning',
                        icon: 'fas fa-exclamation-triangle',
                        text: 'مزاجك منخفض مؤخراً. فكر في ممارسة الرياضة أو التأمل'
                    });
                }

                // Sleep pattern
                const avgSleep = recent7Days.reduce((sum, entry) => sum + (entry.sleepHours || 0), 0) / 7;
                if (avgSleep < 6) {
                    insights.push({
                        type: 'warning',
                        icon: 'fas fa-bed',
                        text: 'تحتاج إلى المزيد من النوم. حاول النوم 7-8 ساعات يومياً'
                    });
                } else if (avgSleep >= 8) {
                    insights.push({
                        type: 'positive',
                        icon: 'fas fa-check-circle',
                        text: 'نومك ممتاز! هذا يساعد على تحسين مزاجك وطاقتك'
                    });
                }

                // Stress correlation
                const highStressDays = recent7Days.filter(entry => entry.stress >= 7);
                if (highStressDays.length >= 3) {
                    insights.push({
                        type: 'warning',
                        icon: 'fas fa-heart',
                        text: 'مستوى التوتر مرتفع. جرب تقنيات الاسترخاء والتنفس العميق'
                    });
                }

                // Activity correlation
                const exerciseDays = recent7Days.filter(entry => entry.activities.includes('exercise'));
                if (exerciseDays.length >= 3) {
                    const avgMoodExercise = exerciseDays.reduce((sum, entry) => sum + entry.mood, 0) / exerciseDays.length;
                    const avgMoodNoExercise = recent7Days.filter(entry => !entry.activities.includes('exercise'))
                        .reduce((sum, entry) => sum + entry.mood, 0) / (7 - exerciseDays.length);
                    
                    if (avgMoodExercise > avgMoodNoExercise + 1) {
                        insights.push({
                            type: 'positive',
                            icon: 'fas fa-running',
                            text: 'الرياضة تحسن مزاجك بشكل واضح! استمر في ممارستها'
                        });
                    }
                }

                if (insights.length === 0) {
                    insights.push({
                        type: 'info',
                        icon: 'fas fa-chart-line',
                        text: 'استمر في تسجيل بياناتك للحصول على رؤى أكثر تفصيلاً'
                    });
                }

                container.innerHTML = insights.map(insight => `
                    <div class="bg-white p-3 rounded-lg text-sm border-r-4 ${
                        insight.type === 'positive' ? 'border-green-500' :
                        insight.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
                    }">
                        <i class="${insight.icon} ${
                            insight.type === 'positive' ? 'text-green-500' :
                            insight.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                        } ml-2"></i>
                        ${insight.text}
                    </div>
                `).join('');
            }

            function getSymptomName(symptom) {
                const symptoms = {
                    'headache': 'صداع',
                    'fatigue': 'إرهاق',
                    'nausea': 'غثيان',
                    'pain': 'ألم',
                    'bloating': 'انتفاخ',
                    'dizziness': 'دوخة'
                };
                return symptoms[symptom] || symptom;
            }

            function getActivityName(activity) {
                const activities = {
                    'exercise': 'رياضة',
                    'meditation': 'تأمل',
                    'work': 'عمل',
                    'social': 'اجتماعي'
                };
                return activities[activity] || activity;
            }

            function deleteJournalEntry(entryId) {
                if (confirm('هل أنت متأكد من حذف هذا الإدخال؟')) {
                    journalEntries = journalEntries.filter(entry => entry.id !== entryId);
                    localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
                    loadJournalData();
                    updateJournalStats();
                    renderJournalChart();
                    generateJournalInsights();
                    showNotification('تم حذف الإدخال', 'info');
                }
            }

            function exportJournal() {
                if (journalEntries.length === 0) {
                    showNotification('لا توجد بيانات للتصدير', 'warning');
                    return;
                }

                const dataStr = JSON.stringify(journalEntries, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `journal-export-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
                
                showNotification('تم تصدير البيانات بنجاح', 'success');
            }

            function clearJournal() {
                if (confirm('هل أنت متأكد من حذف جميع الإدخالات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
                    journalEntries = [];
                    localStorage.removeItem('journalEntries');
                    loadJournalData();
                    updateJournalStats();
                    if (currentJournalChart) currentJournalChart.destroy();
                    generateJournalInsights();
                    showNotification('تم مسح جميع الإدخالات', 'info');
                }
            }

            function toggleJournalView(isLoggedIn) {
                document.getElementById('journal-content-container').classList.toggle('hidden', !isLoggedIn);
                document.getElementById('journal-login-prompt').classList.toggle('hidden', isLoggedIn);
            }

            // Make deleteJournalEntry globally accessible
            window.deleteJournalEntry = deleteJournalEntry;