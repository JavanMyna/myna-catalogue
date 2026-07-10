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
    /* DATA + RENDER                                     */
    /* Art, photography, and music are built from JS    */
    /* arrays so the slides stay in sync with the       */
    /* assets folders. DOM classes are identical to the */
    /* old hardcoded markup, so CSS/visuals are unchanged. */
    /* ----------------------------------------------- */
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

    // filename stem -> sensible human title (camelCase + underscores + trailing number aware).
    function titleFromStem(stem) {
        const m = stem.match(/^([^\d]*?)(\d+)$/);
        let name = m ? m[1] : stem;
        const num = m ? m[2] : '';
        name = name
            .replace(/_/g, ' ')
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(w => (w.length > 1 && w === w.toUpperCase()) ? w : w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
            .trim();
        return num ? `${name} ${num}` : name;
    }

    // cat-specific caption mapping (Task 3). mmt is checked before mm so mmt* is not swallowed.
    function catTitle(stem) {
        const s = stem.toLowerCase();
        if (s.startsWith('mmt')) return 'Miko & Mita';
        if (s.startsWith('mm'))  return 'Miko & Mango';
        return titleFromStem(stem);
    }

    // Art work — explicit titles/medium. Antformicidae keeps its existing placard detail.
    const artData = [
        { f:'antformicidae.jpg', t:'Antformicidae', med:'Digital drawing', date:'2024', desc:'Something my best friend said to me that sticked throughout my matrics journey.' },
        { f:'art_2024sukanDay.jpg', t:'2024 Sukan Day', med:'Sketches' },
        { f:'art_classmate01.jpg', t:'Classmate 01', med:'Sketches' },
        { f:'art_classmate02.jpg', t:'Classmate 02', med:'Sketches' },
        { f:'art_kmlcat.jpg', t:'KML Cat', med:'Sketches' },
        { f:'art_kmlPoster.jpg', t:'KML Poster', med:'Poster' },
        { f:'art_miko.jpg', t:'Miko', med:'Sketches' },
        { f:'art_perspectiveBed.jpg', t:'Perspective Bed', med:'Perspective drawing' },
        { f:'art_perspectiveBedroom.jpg', t:'Perspective Bedroom', med:'Perspective drawing' },
        { f:'art_perspectiveLivingroom.jpg', t:'Perspective Living Room', med:'Perspective drawing' },
        { f:'art_pov01.jpg', t:'POV 01', med:'Sketches' },
        { f:'art_ringo.jpg', t:'Ringo', med:'Sketches' },
        { f:'art_rkgk01.jpg', t:'RKGK 01', med:'Sketches' },
        { f:'art_rkgk02.jpg', t:'RKGK 02', med:'Sketches' },
        { f:'art_rkgk03.jpg', t:'RKGK 03', med:'Sketches' },
        { f:'art_rkgk04.jpg', t:'RKGK 04', med:'Sketches' },
        { f:'comic_chineseHumor.jpg', t:'Chinese Humor', med:'Comic' },
    ];

    const catStems = [
        'kml_cat01',
        'mango01','mango02','mango03','mango04',
        'miko01','miko02','miko03','miko04','miko05','miko06','miko07','miko08','miko09','miko10','miko11','miko12','miko13','miko14','miko15',
        'mita01','mita02','mita03',
        'mm01','mm02','mm03','mm04','mm05','mm06','mm07','mm08','mm09','mm10','mm11',
        'mmt01','mmt02','mmt03','mmt04',
    ];
    const envStems = ['cloud01','cloud02','cloud03','cloud04','cloud05','doulosHope','IMG_20260710_083024','JBC_display','myGuitar','panda_miniature'];
    // fred01.jpg is reserved for the bio photo (Task 6), so excluded from the gallery.
    const pplStems = ['anthonny01','fred02','fred03','fred04','guitar_friends','JBC_vendor','spm_nostalgia','with_lilbro'];

    function photoCards(stems, folder, titleFn) {
        return stems.map(s => ({ src: `assets/photography/${folder}/${s}.jpg`, title: titleFn(s) }));
    }
    const photoData = [
        ...photoCards(catStems, 'cats', catTitle),
        ...photoCards(envStems, 'environment', titleFromStem),
        ...photoCards(pplStems, 'people', titleFromStem),
    ];

    // Music — all solely by JavanMyna, made via Jummbox/Beepbox (Task 1&2, 8).
    const musicGroups = [
        { name:'Personal Favourites', note:'Jummbox / Beepbox', tracks:[
            { title:'Lifeline', meta:'Composition', src:'assets/music/lifeline.mp3' },
            { title:'P(Xr), nCrP^nQ^n-r, PQ1', meta:'Composition', src:'assets/music/P(Xr),%20nCrP%5EnQ%5En-r,%20PQ1.mp3' },
            { title:'Fy, IbnG', meta:'Composition', src:'assets/music/Fy,IbnG.mp3' },
            { title:'L&M', meta:'Composition', src:'assets/music/l&amp;m.mp3' },
        ]},
        { name:'Mis1nf0 OST', note:'Jummbox / Beepbox', tracks:[
            { title:'Dazed', meta:'Soundtrack', src:'assets/music/dazed.mp3' },
            { title:'dfordustbin', meta:'Soundtrack', src:'assets/music/dfordustbin.mp3' },
        ]},
        { name:'Birthday Gifts', note:'Jummbox / Beepbox', tracks:[
            { title:'Deadpool Bag 2', meta:'Composition', src:'assets/music/deadpool_bag2.mp3' },
            { title:'Lyna', meta:'Composition', src:'assets/music/lyna.mp3' },
            { title:'Manyafication', meta:'Composition', src:'assets/music/manyafication.mp3' },
        ]},
    ];

    function renderArt() {
        const track = document.querySelector('#art .fa-track');
        if (!track) return;
        track.innerHTML = artData.map(a => `
            <article class="fa-card fa-trigger" tabindex="0"
                     data-title="${esc(a.t)}" data-medium="${esc(a.med)}"
                     data-date="${esc(a.date || '')}" data-desc="${esc(a.desc || '')}">
                <img src="assets/art/${esc(a.f)}" alt="${esc(a.t)}" loading="lazy">
                <div class="fa-card-body">
                    <h3>${esc(a.t)}</h3>
                    <p class="fa-card-meta">${esc(a.med)}${a.date ? ` · ${esc(a.date)}` : ''}</p>
                </div>
            </article>`).join('');
    }

    function renderPhotography() {
        const track = document.querySelector('#photography .fa-track');
        if (!track) return;
        track.innerHTML = photoData.map(p => `
            <article class="fa-card fa-trigger" tabindex="0"
                     data-title="${esc(p.title)}" data-medium="Photograph" data-date="" data-desc="">
                <img src="${esc(p.src)}" alt="${esc(p.title)}" loading="lazy">
                <div class="fa-card-body">
                    <h3>${esc(p.title)}</h3>
                    <p class="fa-card-meta">Photograph</p>
                </div>
            </article>`).join('');
    }

    function renderMusic() {
        const wrap = document.querySelector('#music .music-groups');
        if (!wrap) return;
        wrap.innerHTML = musicGroups.map(g => `
            <div class="music-group">
                <h3>${esc(g.name)} <span class="group-note">(${esc(g.note)})</span></h3>
                <ul class="track-list">
                    ${g.tracks.map(t => `
                        <li class="track">
                            <div class="track-info">
                                <span class="track-title">${esc(t.title)}</span>
                                <span class="track-meta">${esc(t.meta)}</span>
                            </div>
                            <audio controls preload="none" src="${t.src}"></audio>
                        </li>`).join('')}
                </ul>
            </div>`).join('');
    }

    renderArt();
    renderPhotography();
    renderMusic();

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
        const prog   = trigger.dataset.progress || '';

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

        // Project links (gallery cards have none).
        if (gh || live || prog) {
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
            if (prog) {
                plaqueLinks.innerHTML +=
                    `<a href="${prog}" target="_blank" rel="noopener"><span class="label">Progress:</span>dev log</a>`;
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