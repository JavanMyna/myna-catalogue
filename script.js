/* =================================================== */
/* Fred's Archive — script.js                            */
/* Two responsibilities, adapted from JBC_Catalogue:    */
/*   1. initSlider(wrapper) — the carousel (was JBC's    */
/*      initSlider) renamed to fa- classes. Same index   */
/*      clamping + dot logic + debounced resize.        */
/*   2. Plaque open/close — built using JBC lightbox's   */
/*      a11y mechanics: inert siblings, Tab-trap,        */
/*      Escape, focus restore. Displays placard content  */
/*      from data- attributes instead of swapping an     */
/*      img src.                                        */
/* Plus a tiny nav-on-click to set body[data-focus] so   */
/* the CSS background-vignette responds to navigation.   */
/* =================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ----------------------------------------------- */
    /* Section focus: set body[data-focus] so the CSS  */
    /* vignette recolours as the user moves through the */
    /* page. Driven by nav clicks (best V1 signal).     */
    /* ----------------------------------------------- */
    const navLinks = document.querySelectorAll('.fa-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const id = link.getAttribute('href').replace('#', '');
            document.body.setAttribute('data-focus', id);
        });
    });

    /* ----------------------------------------------- */
    /* CAROUSEL — adapted from JBC initSlider           */
    /* Same math: translateX by (cardWidth + gap) per   */
    /* index, clamped to maxIndex = total - perView.   */
    /* ----------------------------------------------- */
    function initSlider(wrapperEl) {
        const track         = wrapperEl.querySelector('.fa-track');
        const prevBtn       = wrapperEl.querySelector('.fa-prev');
        const nextBtn       = wrapperEl.querySelector('.fa-next');
        const dotsContainer = wrapperEl.querySelector('.fa-dots');
        if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

        const cards = Array.from(track.children).filter(el => el.classList.contains('fa-card'));
        const totalCards = cards.length;
        if (totalCards === 0) return;

        let currentIndex = 0;

        function getCardsPerView() {
            const raw = getComputedStyle(document.documentElement)
                .getPropertyValue('--fa-cards-per-view');
            return parseInt(raw, 10) || 1;
        }
        function maxIndex() {
            return Math.max(0, totalCards - getCardsPerView());
        }

        function createDots() {
            dotsContainer.innerHTML = '';
            const dotCount = maxIndex() + 1;
            // Only bother with dots if there's more than one page.
            if (dotCount <= 1) return;
            for (let i = 0; i < dotCount; i++) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'fa-dot';
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.addEventListener('click', () => goTo(i));
                dotsContainer.appendChild(dot);
            }
        }
        function updateDots() {
            const dots = dotsContainer.querySelectorAll('.fa-dot');
            dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
        }

        function update() {
            if (cards.length === 0) return;
            const cardWidth = cards[0].getBoundingClientRect().width;
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            const step = cardWidth + gap;
            track.style.transform = `translateX(${-(currentIndex * step)}px)`;
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= maxIndex();
            updateDots();
        }
        function move(dir) {
            currentIndex = Math.min(Math.max(currentIndex + dir, 0), maxIndex());
            update();
        }
        function goTo(i) {
            currentIndex = Math.min(Math.max(i, 0), maxIndex());
            update();
        }

        prevBtn.addEventListener('click', () => move(parseInt(prevBtn.dataset.dir, 10)));
        nextBtn.addEventListener('click', () => move(parseInt(nextBtn.dataset.dir, 10)));

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { createDots(); goTo(currentIndex); }, 150);
        });

        createDots();
        update();
    }

    document.querySelectorAll('.fa-slider-wrapper').forEach(initSlider);

    /* ----------------------------------------------- */
    /* PLAQUE — uses JBC lightbox's a11y wiring: inert  */
    /* siblings while open, Tab-trap, Escape, focus    */
    /* restore. Differs in CONTENT: reads data-* attrs  */
    /* off the trigger and fills a placard template.   */
    /* ----------------------------------------------- */
    const plaque      = document.getElementById('plaque');
    const plaqueImg   = document.getElementById('plaque-img');
    const plaqueTitle = document.getElementById('plaque-title');
    const plaqueMed   = document.getElementById('plaque-medium');
    const plaqueDate  = document.getElementById('plaque-date');
    const plaqueDesc  = document.getElementById('plaque-desc');
    const plaqueLinks = document.getElementById('plaque-links');
    const plaqueClose = plaque.querySelector('.fa-plaque-close');

    let lastFocused = null;

    function openPlaque(trigger) {
        lastFocused = trigger;

        const medium = trigger.dataset.medium || '';
        const title  = trigger.dataset.title  || '';
        const date   = trigger.dataset.date   || '';
        const desc   = trigger.dataset.desc   || '';
        const gh     = trigger.dataset.github || '';
        const live   = trigger.dataset.live   || '';

        // Image: gallery cards have an <img>; project cards don't.
        const img = trigger.querySelector('img');
        if (img) {
            plaqueImg.src = img.currentSrc || img.src;
            plaqueImg.alt = img.alt || title;
            plaqueImg.hidden = false;
        } else {
            plaqueImg.hidden = true;
            plaqueImg.src = '';
            plaqueImg.alt = '';
        }

        plaqueMed.textContent   = medium;
        plaqueTitle.textContent = title;
        plaqueDate.textContent  = date ? `· ${date}` : '';
        plaqueDesc.textContent  = desc;

        // Project links (gallery cards have neither).
        if (gh || live) {
            plaqueLinks.hidden = false;
            plaqueLinks.innerHTML = '';
            if (live) {
                plaqueLinks.innerHTML +=
                    `<a href="${live}" target="_blank" rel="noopener"><span class="label">Live:</span>visit site</a>`;
            }
            if (gh) {
                plaqueLinks.innerHTML +=
                    `<a href="${gh}" target="_blank" rel="noopener"><span class="label">Code:</span>GitHub repo</a>`;
            }
        } else {
            plaqueLinks.hidden = true;
            plaqueLinks.innerHTML = '';
        }

        plaque.classList.remove('fa-hidden');
        document.body.setAttribute('data-focus', trigger.closest('[data-section]')?.dataset.section || 'hub');

        // Inert every direct child of body except the plaque — same
        // pattern as JBC: only the overlay is reachable while open.
        Array.from(document.body.children).forEach(child => {
            if (child !== plaque) child.inert = true;
        });

        // Focus the close button as the first focusable stop.
        plaqueClose.focus();
    }

    function closePlaque() {
        plaque.classList.add('fa-hidden');
        Array.from(document.body.children).forEach(child => { child.inert = false; });
        if (lastFocused) lastFocused.focus();
    }

    // Open via event delegation: any .fa-trigger (card click or keyboard).
    document.body.addEventListener('click', (e) => {
        const trig = e.target.closest('.fa-trigger');
        if (!trig || plaque.classList.contains('fa-hidden') === false) return;
        // Don't hijack clicks on actual controls sitting inside a trigger
        // (none right now, but defensive).
        if (e.target.closest('audio, a, button')) return;
        openPlaque(trig);
    });
    document.body.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const trig = e.target.closest('.fa-trigger');
        if (!trig) return;
        e.preventDefault();
        openPlaque(trig);
    });

    // Close: click on backdrop or close button.
    plaque.addEventListener('click', (e) => {
        if (e.target.closest('.fa-plaque-card')) return; // ignore clicks inside the placard
        closePlaque();
    });
    plaqueClose.addEventListener('click', closePlaque);

    // Escape + focus trap while open.
    document.addEventListener('keydown', (e) => {
        if (plaque.classList.contains('fa-hidden')) return;
        if (e.key === 'Escape') { closePlaque(); return; }

        if (e.key === 'Tab') {
            const focusable = plaque.querySelectorAll('button, a[href], img[tabindex], [tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last  = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        }
    });
});