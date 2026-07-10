/* =================================================== */
/* Fred's Archive — songs.js                            */
/* Single source of truth for the music section.       */
/*                                                     */
/* TASK 5/6/7: every song lives here. The renderer      */
/* (script.js) reads this list to build the track      */
/* rows, the story cards, the SoundCloud title links,  */
/* and the preview/full-track player.                  */
/*                                                     */
/* FIELDS                                              */
/*   id           stable string id used for data-song-id */
/*   title        display title                       */
/*   category     group heading (matches on-site tab)   */
/*   type         "Composition", "Soundtrack", etc.   */
/*   soundcloudUrl  full URL to the track on SoundCloud; */
/*                  null means this track has NO        */
/*                  SoundCloud source (Lyna is the     */
/*                  original special case).            */
/*   story        optional free-text story behind the    */
/*                song. Leave "" to show the "Story    */
/*                coming soon" placeholder in the card.  */
/*   previewSrc   short ~20–30s preview clip path.      */
/*                null means previewing isn't set up     */
/*                yet — the player then falls back to    */
/*                the full track with preload="none"    */
/*                (NOT the brief's ideal, but no clip    */
/*                trimming tool was available here).    */
/*                When you've cut a preview clip, drop   */
/*                it in audio/previews/ and set this     */
/*                field — the player will use it and a   */
/*                "Play full track" button appears.     */
/*   fullSrc      the original mp3 used for "Play full   */
/*                track" (and the default audio src      */
/*                whenever previewSrc is null).         */
/*                                                     */
/* FRED — TODO: the soundcloudUrl values below are      */
/* placeholders pointing at the JavanMyna profile. They  */
/* make the title-link visibly work until you paste each  */
/* track's real SoundCloud URL. Replace them with the    */
/* specific track URLs as you find them. Keep Lyna null.  */
/* =================================================== */

window.SONGS = [
    {
        id: "lifeline",
        title: "Lifeline",
        category: "Personal Favourites",
        type: "Composition",
        soundcloudUrl: "https://soundcloud.com/javanmyna",
        story: "",
        previewSrc: null,
        fullSrc: "assets/music/lifeline.mp3"
    },
    {
        id: "pxr-ncrpqnq-nr-pq1",
        title: "P(Xr), nCrP^nQ^n-r, PQ1",
        category: "Personal Favourites",
        type: "Composition",
        soundcloudUrl: "https://soundcloud.com/javanmyna",
        story: "",
        previewSrc: null,
        fullSrc: "assets/music/P(Xr),%20nCrP%5EnQ%5En-r,%20PQ1.mp3"
    },
    {
        id: "fy-ibng",
        title: "Fy, IbnG",
        category: "Personal Favourites",
        type: "Composition",
        soundcloudUrl: "https://soundcloud.com/javanmyna",
        story: "",
        previewSrc: null,
        fullSrc: "assets/music/Fy,IbnG.mp3"
    },
    {
        id: "lm",
        title: "L&M",
        category: "Personal Favourites",
        type: "Composition",
        soundcloudUrl: "https://soundcloud.com/javanmyna",
        story: "",
        previewSrc: null,
        fullSrc: "assets/music/l&m.mp3"
    },
    {
        id: "dazed",
        title: "Dazed",
        category: "Mis1nf0 OST",
        type: "Soundtrack",
        soundcloudUrl: "https://soundcloud.com/javanmyna",
        story: "",
        previewSrc: null,
        fullSrc: "assets/music/dazed.mp3"
    },
    {
        id: "dfordustbin",
        title: "dfordustbin",
        category: "Mis1nf0 OST",
        type: "Soundtrack",
        soundcloudUrl: "https://soundcloud.com/javanmyna",
        story: "",
        previewSrc: null,
        fullSrc: "assets/music/dfordustbin.mp3"
    },
    {
        id: "deadpool-bag2",
        title: "Deadpool Bag 2",
        category: "Birthday Gifts",
        type: "Composition",
        soundcloudUrl: "https://soundcloud.com/javanmyna",
        story: "",
        previewSrc: null,
        fullSrc: "assets/music/deadpool_bag2.mp3"
    },
    {
        id: "lyna",
        title: "Lyna",
        category: "Birthday Gifts",
        type: "Composition",
        soundcloudUrl: null,
        story: "",
        previewSrc: null,
        fullSrc: "assets/music/lyna.mp3"
    },
    {
        id: "manyafication",
        title: "Manyafication",
        category: "Birthday Gifts",
        type: "Composition",
        soundcloudUrl: "https://soundcloud.com/javanmyna",
        story: "",
        previewSrc: null,
        fullSrc: "assets/music/manyafication.mp3"
    }
];