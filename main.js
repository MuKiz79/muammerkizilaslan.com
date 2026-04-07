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

    // ── Splash Screen ──
    const splash = document.getElementById('splash');
    if (splash) {
        document.body.style.overflow = 'hidden';
        // Name einblenden
        setTimeout(() => {
            splash.querySelector('.splash-name').style.opacity = '1';
            splash.querySelector('.splash-name').style.transform = 'translateY(0)';
        }, 300);
        // Subline einblenden
        setTimeout(() => {
            splash.querySelector('.splash-sub').style.opacity = '1';
            splash.querySelector('.splash-sub').style.transform = 'translateY(0)';
        }, 800);
        // Splash wegfaden
        setTimeout(() => {
            splash.style.opacity = '0';
            splash.style.visibility = 'hidden';
            document.body.style.overflow = '';
        }, 3000);
        setTimeout(() => splash.remove(), 4000);
    }

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
                const target = parseInt(entry.target.dataset.target);
                const suffix = entry.target.dataset.suffix || '';
                const duration = 2000;
                const start = performance.now();

                function update(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const current = Math.round(easeOutQuart(progress) * target);
                    entry.target.textContent = current + suffix;
                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        entry.target.textContent = target + suffix;
                    }
                }
                requestAnimationFrame(update);
            }
        });
    }, { threshold: 0.3 });
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
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('open');
            mobileMenu.classList.toggle('open');
            document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuBtn.classList.remove('open');
                mobileMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }
});
