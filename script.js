/* =================================================== */
/* Fred's Archive — script.js                            */
/* Responsibilities, adapted from JBC_Catalogue:       */
/*   1. initSlider(wrapper) — the carousel. Originally   */
/*      JBC's initSlider; fa- classes, same index math   */
/*      + debounced resize. V1.1 swaps the one-dot-     */
/*      per-image row for a compact "current / total"   */
/*      page indicator and only hydrates the <img> src  */
/*      for a sliding window around the active index    */
/*      so off-screen cards stop queueing full-res      */
/*      downloads. Arrow nav is untouched.              */
/*   2. Plaque open/close — JBC lightbox a11y wiring    */
/*      (inert siblings, Tab-trap, Escape, focus        */
/*      restore). Reads placard content from data-*     */
/*      attributes off the trigger.                    */
/*   3. Story overlay — same a11y mechanics as the       */
/*      plaque, fed from the songs.js data model.       */
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

    // cat-specific caption mapping. mmt is checked before mm so mmt* is not swallowed.
    function catTitle(stem) {
        const s = stem.toLowerCase();
        if (s.startsWith('mmt')) return 'Miko & Mita';
        if (s.startsWith('mm'))  return 'Miko & Mango';
        return titleFromStem(stem);
    }

    // Art work — explicit titles/medium. Antformicidae keeps its existing placard detail.
    const artData = [
        { f:'antformicidae.jpg', t:'Antformicidae', med:'Sketches', date:'2025', desc:'Something my best friend said to me that sticked throughout my matrics journey.' },
        { f:'art_2024sukanDay.jpg', t:'Sukan Day', med:'Sketches' , date:'2024'},
        { f:'art_classmate01.jpg', t:'Classmate 01', med:'Sketches' , date:'2024'},
        { f:'art_classmate02.jpg', t:'Classmate 02', med:'Sketches' , date:'2024'},
        { f:'art_kmlcat.jpg', t:'KML Cat', med:'Sketches' , date:'2025', desc:"I seriously feel like everytime I eat in my college cafe, there's always times like this"},
        { f:'art_kmlPoster.jpg', t:'KML Poster', med:'Poster', date:'2025', desc:"I joined the college's art exhibition and put up the poster I drew weeks prior."},
        { f:'art_miko.jpg', t:'Miko', med:'Sketches', date:'2025', desc:'Mom sent me a cute pictures of cats and it made wanted to draw my cat in the same artstyle.' },
        { f:'art_perspectiveBed.jpg', t:'Perspective Bed', med:'Perspective drawing', date:'2024'},
        { f:'art_perspectiveBedroom.jpg', t:'Perspective Bedroom', med:'Perspective drawing', date:'2024' },
        { f:'art_perspectiveLivingroom.jpg', t:'Perspective Living Room', med:'Perspective drawing', date:'2024' },
        { f:'art_pov01.jpg', t:'POV 01', med:'Sketches', date:'2024' },
        { f:'art_ringo.jpg', t:'Ringo', med:'Sketches', date:'2024' },
        { f:'art_rkgk01.jpg', t:'RKGK 01', med:'Sketches', date:'2024' },
        { f:'art_rkgk02.jpg', t:'RKGK 02', med:'Sketches', date:'2024' },
        { f:'art_rkgk03.jpg', t:'RKGK 03', med:'Sketches', date:'2024' },
        { f:'art_rkgk04.jpg', t:'RKGK 04', med:'Sketches', date:'2024' },
        { f:'comic_chineseHumor.jpg', t:'Chinese Humor', med:'Comic', date:'2025', desc:'I was in the local massive pet store and I overheard a conversation from a family. ' },
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
    // fred01.jpg is reserved for the bio photo, so excluded from the gallery.
    const pplStems = ['anthonny01','fred02','fred03','fred04','guitar_friends','JBC_vendor','spm_nostalgia','with_lilbro'];

    function photoCards(stems, folder, titleFn, category) {
        return stems.map(s => ({ src: `assets/photography/${folder}/${s}.jpg`, title: titleFn(s), category }));
    }
    // Photography is sorted into three real categories derived from the
    // existing folder split (cats / environment / people). The filter UI
    // above the gallery keys off this `category` field.
    const photoData = [
        ...photoCards(catStems, 'cats', catTitle, 'Cats'),
        ...photoCards(envStems, 'environment', titleFromStem, 'Scenes'),
        ...photoCards(pplStems, 'people', titleFromStem, 'People'),
    ];

    /* ---- Music: single source of truth from songs.js ----
       The hard-coded musicGroups array is replaced by the SONGS data
       model (Task 5/6/7). Each song carries title, category, type,
       optional soundcloudUrl, story, and optional previewSrc. The full
       track is always present in fullSrc. previewSrc is null for now
       because no clip-trimming tool (ffmpeg) was available in this
       environment — Fred can point each previewSrc at a real preview
       file later without touching anything else here. */
    const songs = Array.isArray(window.SONGS) ? window.SONGS : [];
    const songById = new Map(songs.map(s => [s.id, s]));

    // Rebuild the {name, note, tracks:[...]} grouping the old renderer
    // expected, preserving insertion order. Every group shares the same
    // Jummbox/Beepbox byline note (matches V1 behaviour).
    function buildMusicGroups(songList) {
        const order = [];
        const groups = new Map();
        for (const s of songList) {
            if (!groups.has(s.category)) { groups.set(s.category, []); order.push(s.category); }
            groups.get(s.category).push(s);
        }
        return order.map(name => ({ name, note:'Jummbox / Beepbox', tracks: groups.get(name) }));
    }
    const musicGroups = buildMusicGroups(songs);

    /* Card HTML shared by Art + Photography. Uses data-src instead of src
       so initSlider's lazy-src-window can hydrate only the cards near the
       active index. Explicit width/height attributes give the browser a
       layout box before the image bytes arrive, preventing CLS. */
    function galleryCardHTML({ src, title, medium, date, desc }) {
        return `
            <article class="fa-card fa-trigger" tabindex="0"
                     data-title="${esc(title)}" data-medium="${esc(medium)}"
                     data-date="${esc(date || '')}" data-desc="${esc(desc || '')}">
                <img data-src="${esc(src)}" alt="${esc(title)}" loading="lazy" width="320" height="240">
                <div class="fa-card-body">
                    <h3>${esc(title)}</h3>
                    <p class="fa-card-meta">${esc(medium)}${date ? ` · ${esc(date)}` : ''}</p>
                </div>
            </article>`;
    }

    function renderArt() {
        const track = document.querySelector('#art .fa-track');
        if (!track) return;
        track.innerHTML = artData.map(a => galleryCardHTML({
            src: `assets/art/${a.f}`,
            title: a.t,
            medium: a.med,
            date: a.date,
            desc: a.desc,
        })).join('');
    }

    function renderPhotography(category = 'all') {
        const track = document.querySelector('#photography .fa-track');
        if (!track) return;
        const data = category === 'all' ? photoData : photoData.filter(p => p.category === category);
        track.innerHTML = data.map(p => galleryCardHTML({
            src: p.src,
            title: p.title,
            medium: 'Photograph',
            date: '',
            desc: '',
        })).join('');
    }

    /* Music rendering — title becomes a SoundCloud link only when
       soundcloudUrl is present; otherwise it's a plain span with a
       subtle "no link" cue so the absence reads as intentional. The
       whole row opens a story card; audio + the "Play full track"
       button are exempt so they keep their native behaviour. */
    function renderMusic() {
        const wrap = document.querySelector('#music .music-groups');
        if (!wrap) return;
        wrap.innerHTML = musicGroups.map(g => `
            <div class="music-group">
                <h3>${esc(g.name)} <span class="group-note">(${esc(g.note)})</span></h3>
                <ul class="track-list">
                    ${g.tracks.map(t => {
                        const titleLink = t.soundcloudUrl
                            ? `<a class="track-title track-title-link" href="${esc(t.soundcloudUrl)}" target="_blank" rel="noopener noreferrer">${esc(t.title)}</a>`
                            : `<span class="track-title track-title-nolink" title="No SoundCloud source for this track">${esc(t.title)}</span>`;
                        const preview = t.previewSrc;
                        const audioSrc = preview || t.fullSrc || '';
                        const fullBtn = preview
                            ? `<button type="button" class="track-full-btn" data-full-src="${esc(t.fullSrc || '')}">Play full track</button>`
                            : `<span class="track-preview-badge">full track</span>`;
                        return `
                        <li class="track fa-story-trigger" tabindex="0" data-song-id="${esc(t.id)}">
                            <div class="track-info">
                                ${titleLink}
                                <span class="track-meta">${esc(t.type)}${preview ? ' · preview' : ''} · ${esc(t.category)}</span>
                            </div>
                            <div class="track-player">
                                <audio controls preload="none" src="${esc(audioSrc)}"></audio>
                                ${fullBtn}
                            </div>
                        </li>`;
                    }).join('')}
                </ul>
            </div>`).join('');
    }

    renderArt();
    renderPhotography('all');
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
    /* PHOTOGRAPHY CATEGORY FILTER                       */
    /* The same track is re-rendered with a filtered    */
    /* slice of photoData, then the slider is reset so  */
    /* its index/cardsPerView math recomputes against  */
    /* the new card count. No markup duplication.       */
    /* ----------------------------------------------- */
    const photoFilterBar = document.querySelector('.fa-photo-filter');
    if (photoFilterBar) {
        photoFilterBar.addEventListener('click', (e) => {
            const btn = e.target.closest('.fa-filter-btn');
            if (!btn) return;
            const cat = btn.dataset.cat;
            photoFilterBar.querySelectorAll('.fa-filter-btn').forEach(b => {
                const active = b === btn;
                b.setAttribute('aria-selected', active ? 'true' : 'false');
                b.classList.toggle('active', active);
            });
            renderPhotography(cat);
            const wrap = document.querySelector('#photography .fa-slider-wrapper');
            if (wrap && wrap._faReset) wrap._faReset();
        });
    }

    /* ----------------------------------------------- */
    /* CAROUSEL — adapted from JBC initSlider           */
    /* Same math: translateX by (cardWidth + gap) per   */
    /* index, clamped to maxIndex = total - perView.    */
    /* V1.1 changes:                                    */
    /*   - the dot row becomes a single "current/total"  */
    /*     text indicator (no more 30+ dots)             */
    /*   - only the <img> tags within a small window    */
    /*     around the active index get their hydrated   */
    /*     src set, so offscreen cards stop queuing       */
    /*     full-res downloads.                          */
    /* ----------------------------------------------- */
    function initSlider(wrapperEl) {
        const track         = wrapperEl.querySelector('.fa-track');
        const prevBtn       = wrapperEl.querySelector('.fa-prev');
        const nextBtn       = wrapperEl.querySelector('.fa-next');
        const dotsContainer = wrapperEl.querySelector('.fa-dots');
        if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

        let currentIndex = 0;

        function getCardsPerView() {
            const raw = getComputedStyle(document.documentElement)
                .getPropertyValue('--fa-cards-per-view');
            return parseInt(raw, 10) || 1;
        }
        function getCards() {
            return Array.from(track.children).filter(el => el.classList.contains('fa-card'));
        }
        function maxIndex() {
            return Math.max(0, getCards().length - getCardsPerView());
        }

        // Compact "current / total" page indicator — replaces the
        // one-button-per-image dot row that grew to 30+ on Photography.
        function createIndicator() {
            dotsContainer.innerHTML = '';
            const totalPages = maxIndex() + 1;
            if (totalPages <= 1) return;
            const ind = document.createElement('span');
            ind.className = 'fa-page-indicator';
            ind.setAttribute('aria-hidden', 'true');
            dotsContainer.appendChild(ind);
            updateIndicator();
        }
        function updateIndicator() {
            const ind = dotsContainer.querySelector('.fa-page-indicator');
            if (!ind) return;
            const totalPages = maxIndex() + 1;
            ind.textContent = `${Math.min(currentIndex + 1, totalPages)} / ${totalPages}`;
        }

        // Hydrate src only for cards in a sliding window around the
        // active index. Cards outside the window keep data-src only, so
        // the browser never queues their full-res downloads.
        function populateNearby() {
            const cards = getCards();
            if (cards.length === 0) return;
            const win = getCardsPerView() + 2;
            const start = Math.max(0, currentIndex - 1);
            const end   = Math.min(cards.length, currentIndex + win + 1);
            for (let i = start; i < end; i++) {
                const img = cards[i].querySelector('img[data-src]');
                if (img && !img.getAttribute('src')) {
                    img.setAttribute('src', img.dataset.src);
                }
            }
        }

        function update() {
            const cards = getCards();
            if (cards.length === 0) return;
            // Re-clamp in case the card count changed (photo filter).
            currentIndex = Math.min(currentIndex, maxIndex());
            const cardWidth = cards[0].getBoundingClientRect().width;
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            const step = cardWidth + gap;
            track.style.transform = `translateX(${-(currentIndex * step)}px)`;
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex >= maxIndex();
            updateIndicator();
            populateNearby();
        }
        function move(dir) {
            currentIndex = Math.min(Math.max(currentIndex + dir, 0), maxIndex());
            update();
        }
        function goTo(i) {
            currentIndex = Math.min(Math.max(i, 0), maxIndex());
            update();
        }

        // Bind arrows + resize exactly once per wrapper so a filter
        // re-render doesn't stack duplicate handlers.
        if (!wrapperEl._faBound) {
            prevBtn.addEventListener('click', () => move(parseInt(prevBtn.dataset.dir, 10)));
            nextBtn.addEventListener('click', () => move(parseInt(nextBtn.dataset.dir, 10)));
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => { createIndicator(); goTo(currentIndex); }, 150);
            });
            wrapperEl._faBound = true;
        }

        // Exposed for the photo filter: rebuild indicator + reset to first page.
        wrapperEl._faReset = () => { currentIndex = 0; createIndicator(); update(); };

        createIndicator();
        update();
    }

    document.querySelectorAll('.fa-slider-wrapper').forEach(initSlider);

    /* ----------------------------------------------- */
    /* SHARED OVERLAY MECHANICS                          */
    /* Both the plaque (gallery + project placard) and  */
    /* the story card use the same JBC lightbox wiring:  */
    /* inert every body child except the open overlay,  */
    /* Tab-trap inside it, Escape closes, focus returns. */
    /* ----------------------------------------------- */
    const plaque      = document.getElementById('plaque');
    const plaqueImg   = document.getElementById('plaque-img');
    const plaqueTitle = document.getElementById('plaque-title');
    const plaqueMed   = document.getElementById('plaque-medium');
    const plaqueDate  = document.getElementById('plaque-date');
    const plaqueDesc  = document.getElementById('plaque-desc');
    const plaqueLinks = document.getElementById('plaque-links');
    const plaqueClose = plaque ? plaque.querySelector('.fa-plaque-close') : null;

    const story       = document.getElementById('fa-story');
    const storyCat    = document.getElementById('fa-story-category');
    const storyTitle  = document.getElementById('fa-story-title');
    const storyType   = document.getElementById('fa-story-type');
    const storyBody   = document.getElementById('fa-story-body');
    const storyLink   = document.getElementById('fa-story-link');
    const storyClose  = story ? story.querySelector('.fa-plaque-close') : null;

    let activeOverlay = null;
    let lastFocused   = null;

    function showModal(overlay, focusEl) {
        activeOverlay = overlay;
        overlay.classList.remove('fa-hidden');
        Array.from(document.body.children).forEach(child => { child.inert = (child !== overlay); });
        focusEl.focus();
    }
    function closeModal() {
        if (!activeOverlay) return;
        activeOverlay.classList.add('fa-hidden');
        activeOverlay = null;
        Array.from(document.body.children).forEach(child => { child.inert = false; });
        if (lastFocused) lastFocused.focus();
    }
    function activeCloseBtn() {
        if (!activeOverlay) return null;
        return activeOverlay.querySelector('.fa-plaque-close');
    }

    /* ---- Plaque: gallery + project placard content ---- */
    function openPlaque(trigger) {
        lastFocused = trigger;

        const medium = trigger.dataset.medium || '';
        const title  = trigger.dataset.title  || '';
        const date   = trigger.dataset.date   || '';
        const desc   = trigger.dataset.desc   || '';
        const gh     = trigger.dataset.github || '';
        const live   = trigger.dataset.live   || '';
        const prog   = trigger.dataset.progress || '';

        // Image: gallery cards have an <img> (possibly still data-src-only
        // if its card was off-window), so fall back to dataset.src.
        const img = trigger.querySelector('img');
        if (img) {
            plaqueImg.src = img.currentSrc || img.getAttribute('src') || img.dataset.src || '';
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

        document.body.setAttribute('data-focus', trigger.closest('[data-section]')?.dataset.section || 'hub');
        showModal(plaque, plaqueClose);
    }

    /* ---- Story card: music track modal ----
       Filled from songs.js. The title inside the card mirrors the
       row behaviour: it's a SoundCloud link only when soundcloudUrl
       is present. Empty story → "Story coming soon." placeholder so
       the card never looks broken. */
    function openStory(song, trigger) {
        lastFocused = trigger;

        storyCat.textContent = song.category || '';
        if (song.soundcloudUrl) {
            storyTitle.innerHTML = `<a href="${esc(song.soundcloudUrl)}" target="_blank" rel="noopener noreferrer">${esc(song.title)}</a>`;
        } else {
            storyTitle.textContent = song.title || '';
        }
        storyType.textContent = song.type || '';

        const storyText = (song.story && String(song.story).trim());
        storyBody.textContent = storyText || 'Story coming soon.';

        if (song.soundcloudUrl) {
            storyLink.hidden = false;
            storyLink.innerHTML = `<a href="${esc(song.soundcloudUrl)}" target="_blank" rel="noopener"><span class="label">Listen:</span>SoundCloud</a>`;
        } else {
            storyLink.hidden = true;
            storyLink.innerHTML = '';
        }

        document.body.setAttribute('data-focus', 'music');
        showModal(story, storyClose);
    }

    // Plaque open via event delegation: any .fa-trigger (gallery/project card click/keyboard).
    document.body.addEventListener('click', (e) => {
        if (plaque && !plaque.classList.contains('fa-hidden')) return;
        const trig = e.target.closest('.fa-trigger');
        if (!trig) return;
        // Don't hijack clicks on real controls sitting inside a trigger.
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

    // Story open via event delegation: any .fa-story-trigger (music track row).
    // Exempt audio + links + the "Play full track" button so native behaviours win.
    document.body.addEventListener('click', (e) => {
        if (story && !story.classList.contains('fa-hidden')) return;
        const trig = e.target.closest('.fa-story-trigger');
        if (!trig) return;
        if (e.target.closest('audio, a, button')) return;
        const song = songById.get(trig.dataset.songId);
        if (song) openStory(song, trig);
    });
    document.body.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const trig = e.target.closest('.fa-story-trigger');
        if (!trig) return;
        // Allow row activation only when focus is on the row itself,
        // not on an inner link / audio control / button.
        if (e.target.closest('a, audio, button')) return;
        e.preventDefault();
        const song = songById.get(trig.dataset.songId);
        if (song) openStory(song, trig);
    });

    // "Play full track" button — swaps the row's <audio> src to the full
    // track and starts playback. stopPropagation so the row-click → story
    // handler doesn't also fire.
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.track-full-btn');
        if (!btn) return;
        e.stopPropagation();
        e.preventDefault();
        const fullSrc = btn.dataset.fullSrc;
        if (!fullSrc) return;
        const player = btn.closest('.track-player');
        if (!player) return;
        const audio = player.querySelector('audio');
        if (audio) {
            audio.src = fullSrc;
            audio.load();
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => {});
        }
        btn.disabled = true;
        btn.textContent = 'Playing full track';
    });

    // Close: click on backdrop or close button. Backdrop detection is bound
    // to each overlay (not body) so the same click that opens an overlay
    // can't immediately bubble into a body-level handler that closes it.
    function bindBackdrop(overlay) {
        if (!overlay) return;
        overlay.addEventListener('click', (e) => {
            if (e.target.closest('.fa-plaque-card')) return; // clicks inside placard don't close
            closeModal();
        });
    }
    bindBackdrop(plaque);
    bindBackdrop(story);
    if (plaqueClose) plaqueClose.addEventListener('click', closeModal);
    if (storyClose)  storyClose.addEventListener('click', closeModal);

    // Escape + focus trap while an overlay is open.
    document.addEventListener('keydown', (e) => {
        if (!activeOverlay) return;
        if (e.key === 'Escape') { closeModal(); return; }

        if (e.key === 'Tab') {
            const focusable = activeOverlay.querySelectorAll('button, a[href], img[tabindex], [tabindex]:not([tabindex="-1"])');
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