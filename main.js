/* ══════════════════════════════════════════
   ProfilWebseite — Main Script
   ══════════════════════════════════════════ */

function toggleStation(id) {
    const panels = document.querySelectorAll('.detail-panel');
    const icons = document.querySelectorAll('.expand-icon');
    const cards = document.querySelectorAll('.station-card');
    const target = document.getElementById('detail-' + id);
    const icon = document.getElementById('icon-' + id);
    const card = document.querySelector('[data-station="' + id + '"]');
    const isOpen = target.classList.contains('active');

    panels.forEach(p => p.classList.remove('active'));
    icons.forEach(i => i.classList.remove('rotate-90'));
    cards.forEach(c => c.classList.remove('active-station'));

    if (!isOpen) {
        target.classList.add('active');
        icon.classList.add('rotate-90');
        card.classList.add('active-station');

        // Auf Mobile: warten bis Panel-Transition fertig, dann scrollen
        if (window.innerWidth < 768) {
            setTimeout(function() {
                target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 650);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const progressBar = document.getElementById('progress-bar');
    const nav = document.getElementById('navbar');

    // ── Loader: kurze Marken-Einblendung, kein künstliches Warten ──
    setTimeout(() => document.getElementById('loader')?.classList.add('hidden'), 300);

    // ── Scroll: Progress + Navbar ──
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                progressBar.style.width = (window.pageYOffset / totalHeight) * 100 + '%';
                if (window.scrollY > 80) {
                    nav.classList.add('bg-[#f5f5f4]/95', 'backdrop-blur-3xl', 'py-8', 'border-b', 'border-stone-200', 'shadow-2xl');
                } else {
                    nav.classList.remove('bg-[#f5f5f4]/95', 'backdrop-blur-3xl', 'py-8', 'border-b', 'border-stone-200', 'shadow-2xl');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // ── Reveal Animations — Choreographed ──
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // ── Animated Counters ──
    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.counted) {
                entry.target.dataset.counted = 'true';
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                const suffix = el.dataset.suffix || '';
                const duration = 2500;

                setTimeout(() => {
                    const start = performance.now();
                    function update(now) {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        const current = Math.round(easeOutQuart(progress) * target);
                        el.textContent = current + suffix;
                        if (progress < 1) {
                            requestAnimationFrame(update);
                        } else {
                            el.textContent = target + suffix;
                        }
                    }
                    requestAnimationFrame(update);
                }, 300);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

    // ── Language Bars — Animate on Scroll ──
    const langObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.dataset.width;
                bar.style.width = width;
                langObserver.unobserve(bar);
            }
        });
    }, { threshold: 0.3 });
    document.querySelectorAll('.lang-bar').forEach(bar => {
        bar.dataset.width = bar.style.width;
        bar.style.width = '0%';
        langObserver.observe(bar);
    });

    // ── Mobile Menu ──
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        const isEN = document.documentElement.lang === 'en';
        const LABEL = isEN ? { open: 'Open menu', close: 'Close menu' } : { open: 'Menü öffnen', close: 'Menü schließen' };
        const setMenu = (open) => {
            menuBtn.classList.toggle('open', open);
            mobileMenu.classList.toggle('open', open);
            menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            menuBtn.setAttribute('aria-label', open ? LABEL.close : LABEL.open);
            mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
            document.body.style.overflow = open ? 'hidden' : '';
            if (open) mobileMenu.querySelector('a')?.focus();
        };
        menuBtn.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setMenu(false));
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
                setMenu(false);
                menuBtn.focus();
            }
        });
    }
});
