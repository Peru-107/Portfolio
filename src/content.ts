// Everything a visitor reads lives here.

export const site = {
  name: 'Perraz',
  fullName: 'Perraz Badhniwalla',
  pitch: 'I design products, build them myself, and know their worth.',
  // The title block under the headline, like the corner of a technical drawing
  facts: [
    { k: 'Studying', v: 'Computer engineering' },
    { k: 'Alongside', v: 'Finance (MBA Tech)' },
    { k: 'At', v: 'NMIMS, Mumbai' },
    { k: 'Class of', v: '2027' },
  ],
  status: 'Open to product, front-end and fintech roles from 2027',
  location: 'Mumbai',
  timezone: 'Asia/Kolkata',
  email: 'pbadhniwalla@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/perraz-badhniwalla-367ab324a' },
    { label: 'GitHub', href: 'https://github.com/Peru-107' },
    { label: 'Instagram', href: 'https://instagram.com/byperraz' },
  ],
  // Beside the Work title on wide screens
  workLead: 'Five products. Designed, coded and shipped by one person.',
  teaser: {
    title: 'Aegis',
    label: 'In the works',
    line: 'A research desk for Indian markets that I’m building on my own laptop. Careful with data, strict with risk, and patient before it ever trades.',
  },
  about: [
    'I study two things at once: computer engineering and finance. One taught me how to build a product, the other how to ask whether it is worth building.',
    'Outside class I ship my own apps. I design them, write the code, and keep going until they feel right. Before all of this I represented India at the Karate World Championship — where I learned to practise the same move a thousand times.',
  ],
  // Contact: one quiet question, then the email as the section’s hero
  contactAsk: { before: 'Got an idea that', accent: 'should exist?' },
  contactNote: 'One email is enough.',
  tools: [
    { group: 'Design', items: ['UI and UX design', 'Design systems', 'Motion', 'Prototyping'] },
    { group: 'Build', items: ['TypeScript and React', 'Next.js', 'Python', 'Java'] },
    { group: 'Finance', items: ['MIS and reporting', 'Reconciliation', 'Forex operations', 'Excel'] },
  ],
}

export const experience = [
  {
    org: 'SOTC Travel',
    role: 'Management intern, corporate finance',
    when: 'May – Sep 2026',
    points: [
      'Consolidated and checked data for budgeting, P&L, balance sheet and cash-flow reporting, flagging discrepancies before they reached management.',
      'Processed about 120 forex approvals a day in the SAP-based Canvas system and grouped spot purchases by currency.',
    ],
  },
  {
    org: 'Hitachi Systems India',
    role: 'Technical intern, application consulting',
    when: 'May – Jul 2025',
    points: [
      'Designed JMeter load tests for a banking application and monitored the backend with Dynatrace.',
      'Built a synthetic monitoring system in Java, MySQL and Grafana that handles OTP steps and captures error screenshots, plus a multithreaded Selenium tool for URL and asset checks.',
    ],
  },
]

export const education = [
  { what: 'MBA Tech: BTech Computer Engineering with an MBA in Finance (minor in Marketing)', where: 'MPSTME, NMIMS, Mumbai', when: '2022 – 2027' },
]

export const alsoBuilt = [
  { title: 'Fashion recommender', body: 'A hybrid recommendation engine on H&M customer data, combining content-based and collaborative filtering.' },
  { title: 'Blockchain voting', body: 'A decentralised voting app with Solidity contracts, a React front end, Hardhat and IPFS storage.' },
  { title: 'Attendly', body: 'The first version of CUBE: timetable, attendance, grades, notes and exam quizzes, offline.' },
]

export const recognition = [
  'Represented India, Karate World Championship (2018)',
  'Sub-Head, Logistics, 4C The Marketing Cell, NMIMS (2023–24)',
  'Best Executive, Logistics, 4C The Marketing Cell (2022–23)',
  'Bloomberg Market Concepts certificate (2026)',
]

export type Media =
  | { type: 'video'; src: string; poster: string; alt: string; frame?: 'browser' }
  | { type: 'image'; src: string; alt: string; frame?: 'browser' | 'phone' | 'tv' }
  | { type: 'stack'; srcs: string[]; alt: string }
  | { type: 'row'; srcs: string[]; alt: string; bg: string; shape: 'phone' | 'slide' | 'screens' }

/** A gap only Perraz can fill. Shown as a marked note while developing, and never
 * in a production build, so nothing invented or unfinished can go live */
export type Todo = { todo: string }
export const TODO = (question: string): Todo => ({ todo: question })
export const isTodo = (x: unknown): x is Todo => typeof x === 'object' && x !== null && 'todo' in x

/** The design story of a project: the calls I made, what changed, what came of it */
export type Story = {
  /** Process and decisions: each one a choice, and the reason for it */
  decisions: ({ title: string; body: string } | Todo)[]
  /** What it was before, and what it is now */
  beforeAfter: { before: string | Todo; after: string | Todo; media?: Media; /** Something still missing from the comparison */ gap?: Todo }
  /** Only results that are true and checkable */
  outcomes: (string | Todo)[]
  /** A picture that belongs with the decisions */
  media?: Media
}

export type Project = {
  slug: string
  title: string
  kind: string
  year: string
  role: string
  summary: string
  brief: string
  did: string[]
  stack: string
  result: string
  /** Two words either side of the cover while it waits to zoom: what it is, in brief */
  zoom: [string, string]
  link?: { label: string; href: string }
  tone: 'clay' | 'ink' | 'pine' | 'night' | 'paper' | 'ember'
  cover: Media
  /** A tall version of the cover for phones held upright */
  portrait?: Media
  gallery: Media[]
  story: Story
}

export const projects: Project[] = [
  {
    slug: 'cube',
    zoom: ['Scatter', 'gathered'],
    title: 'CUBE',
    kind: 'College companion app',
    year: '2026',
    role: 'Design and build',
    summary: 'One free app for the college day: timetable, attendance, grades, notes, map and nearby chat.',
    brief: 'A student’s day lives in pieces — a timetable photo, an attendance sheet, a grades portal, a group chat that dies when campus Wi-Fi blocks it. CUBE gathers that day into one free app. It grew from Attendly, my first version, instead of starting over.',
    did: [
      'Scan a timetable once; it becomes the schedule',
      'Swipe to mark class, and see how many hours you can still miss',
      'Grades with SGPA and CGPA on any scale — 4, 10, or the college’s own',
      'A study notebook that turns notes and PDFs into answers, quizzes and flashcards',
      'Campus map, reminders, and nearby chat that works with no internet',
    ],
    stack: 'Next.js, TypeScript, AI study notebook, offline nearby chat',
    result: 'Live and free for any student at cu-be.vercel.app.',
    link: { label: 'Open CUBE', href: 'https://cu-be.vercel.app' },
    tone: 'clay',
    cover: { type: 'video', src: '/media/cube.mp4', poster: '/media/cube-poster.webp', alt: 'CUBE launch film: grades, study notebook, reminders and nearby chat' },
    portrait: { type: 'row', shape: 'phone', bg: '#ece6dc', srcs: ['/media/cube-phone.webp'], alt: 'CUBE on a phone' },
    gallery: [
      { type: 'image', src: '/media/cube-desk.webp', alt: 'CUBE landing page', frame: 'browser' },
      { type: 'image', src: '/media/cube-phone.webp', alt: 'CUBE on a phone', frame: 'phone' },
    ],
    story: {
      decisions: [
        {
          title: 'Grow Attendly; don’t restart',
          body: 'Attendly already carried timetable, attendance, grades, notes and exam quizzes — offline. CUBE kept that spine and added what a campus day still lacked: a map to find the room, and a chat with classmates nearby.',
        },
        {
          title: 'Chat that survives dead Wi-Fi',
          body: 'Campus group chat fails the moment the network blocks it. Nearby chat talks to people around you with no connection at all.',
        },
        {
          title: 'Scan once; never retype the week',
          body: 'Hand-copying a timetable is where students quit. One scan turns the photo into the schedule.',
        },
        {
          title: 'Any scale the college uses',
          body: 'Some grade on 4, some on 10, some invent their own. SGPA and CGPA follow whichever scale they use.',
        },
        TODO('What did you try or reject while designing CUBE (layouts, navigation, the swipe to mark)? One or two real choices and why.'),
      ],
      media: { type: 'image', src: '/media/stack-cube.webp', alt: 'CUBE after class: grades and SGPA, the study notebook, calendar reminders and the nearby chat' },
      beforeAfter: {
        before: 'Attendly: timetable, attendance, grades, notes and exam quizzes in one free offline app.',
        after: 'CUBE: that same spine, plus a campus map and nearby chat that needs no internet.',
        gap: TODO('A screenshot of Attendly, to show next to CUBE.'),
      },
      outcomes: [
        'Live and free for any student at cu-be.vercel.app.',
        TODO('How many students use CUBE, or any feedback you have had from them?'),
      ],
    },
  },
  {
    slug: 'nextup',
    zoom: ['Later', 'now'],
    title: 'Nextup',
    kind: 'Web app and Chrome extension',
    year: '2026',
    role: 'Design and build',
    summary: 'Every save gets one next action — so “do later” becomes a short list for the week.',
    brief: 'I save posts, links and screenshots for later, then never open them again. Nextup reads each save, gives it one clear next action, and keeps the week short: This week, Later, Archive, Done.',
    did: [
      'Save by link, screenshot or the Chrome extension',
      'One next action per save, with This week / Later / Archive / Done — and Undo everywhere',
      'Free and Pro plans; UPI payments approved by hand from an admin panel',
      '7 styles, 12 contrast-checked palettes, 11 ambient backgrounds',
      'Planned in a war room of seven AI agents, then built from an approved design preview',
    ],
    stack: 'Next.js, TypeScript, Chrome extension (Manifest V3), SQLite and Postgres',
    result: 'Extension packaged for the Chrome Web Store; database tests run on SQLite and on Postgres.',
    tone: 'ember',
    cover: { type: 'image', src: '/media/nextup-card.webp', alt: 'Nextup: turn what you save into what you do' },
    portrait: { type: 'image', src: '/media/nextup-poster.webp', alt: 'Nextup: get the next step' },
    gallery: [{ type: 'video', src: '/media/nextup.mp4', poster: '/media/nextup-poster.webp', alt: 'Nextup reel: you saved it, then forgot it' }],
    story: {
      decisions: [
        {
          title: 'One next action — not another pile',
          body: 'A longer list of saves is the problem, not the fix. Each save gets exactly one next action. The week stays a short list.',
        },
        {
          title: 'Argue first, then build',
          body: 'Seven AI agents debated the product in a war room, each with a vote. I approved a design preview, then built that plan — not a guess on the fly.',
        },
        {
          title: 'Payments a person can trust',
          body: 'Pro is paid by UPI. You enter the 12-digit reference; I approve it by hand. Pro switches on only then, lasts 31 or 366 days, and never renews by itself.',
        },
        {
          title: 'Contrast as a hard gate',
          body: 'A script checks all 12 palettes against WCAG contrast. Playful styles stay readable, or they don’t ship.',
        },
        {
          title: 'Undo beats “Are you sure?”',
          body: 'Done and Delete both offer Undo. A slip never loses the work.',
        },
      ],
      media: { type: 'image', src: '/media/stack-nextup.webp', alt: 'Nextup: saved items, each with one next action and a tag' },
      beforeAfter: {
        before: 'An earlier version priced Pro at $6 a month through a recurring payment link.',
        after: 'Pro at Rs 199 a month or Rs 1,799 a year — UPI, manual approval, no automatic renewal.',
        gap: TODO('Why did you move from the $6 payment link to UPI with manual approval? One line in your words.'),
      },
      outcomes: [
        'Chrome extension packaged and ready for the Chrome Web Store.',
        'Database tests run twice: on SQLite and on a real Postgres engine.',
        TODO('Is Nextup live for users yet, or published on the Chrome Web Store? Any numbers?'),
      ],
    },
  },
  {
    slug: 'folio',
    zoom: ['Quiet', 'pages'],
    title: 'Folio',
    kind: 'Reading companion',
    year: '2026',
    role: 'Design and build',
    summary: 'A calm reading app: a few pages a day, a focus room, a sound mixer, and a sprout that grows with you.',
    brief: 'Reading apps either track you like a fitness coach or do nothing at all. Folio stays quiet. It asks for a few pages a day and gives you a room to read them in — installable, and it works offline.',
    did: [
      'A Today page in one editorial column',
      'A focus room with a 25, 45 or open timer and full-screen focus',
      'A sound mixer: 9 generated channels, 6 presets, mixes you save yourself',
      'Sproutling — a live SVG that breathes, blinks, reads with you, and grows from Seed to Grove',
      'Installable; keeps working offline',
    ],
    stack: 'HTML, CSS and JavaScript, Web Audio, service worker',
    result: 'About 400 KB first load with no layout shift; passed a 64-screenshot review on phone and desktop, day and night.',
    tone: 'pine',
    cover: { type: 'row', shape: 'phone', bg: '#e6e7df', srcs: ['/media/folio-today.webp', '/media/folio-room.webp', '/media/folio-shelf.webp'], alt: 'Folio on a phone: Today page, focus room with Sproutling, and the shelf' },
    portrait: { type: 'row', shape: 'phone', bg: '#e6e7df', srcs: ['/media/folio-today.webp', '/media/folio-room.webp'], alt: 'Folio on a phone: Today page and the focus room' },
    gallery: [{ type: 'image', src: '/media/folio-card.webp', alt: 'Folio: read a little every day', frame: 'browser' }],
    story: {
      decisions: [
        {
          title: 'Four directions; then one',
          body: 'I previewed four design directions at phone size — each with its own layouts, sound presets, icons and a live Sproutling — then chose Clothbound.',
        },
        {
          title: 'One system instead of five',
          body: 'Five competing UI styles had grown inside the app. One Clothbound system, Day and Night, replaced them — set in Literata and Hanken Grotesk.',
        },
        {
          title: 'Decoration out',
          body: 'Tilt, spotlight, rainbow gradients, Three.js, GSAP and confetti all left. A reading app should be quiet.',
        },
        {
          title: 'Glass only where it floats',
          body: 'Glass sits on floating chrome — dock, sheets, player — never on the words you read.',
        },
        {
          title: 'Real icons, not stand-ins',
          body: 'A custom line icon set replaced every emoji that had been pretending to be an icon.',
        },
      ],
      media: { type: 'image', src: '/media/folio-notes.webp', alt: 'Folio’s focus room: Sproutling reading in glasses above a 25-minute timer', frame: 'phone' },
      beforeAfter: {
        before: 'Five competing UI styles, emoji for icons, decoration everywhere — all in a single 6,106-line HTML file.',
        after: 'One Clothbound system, Day and Night, custom line icons, and a calm editorial Today page.',
        gap: TODO('A screenshot of Folio before the Clothbound redesign, to show next to the new one.'),
      },
      outcomes: [
        'A second design review found 24 issues; 23 were fixed before shipping.',
        'Installable, and it keeps working offline.',
        'About 400 KB first load, with no layout shift.',
      ],
    },
  },
  {
    slug: 'glass-home',
    zoom: ['Three', 'metres'],
    title: 'Glass Home',
    kind: 'Android TV home screen',
    year: '2026',
    role: 'Design and build',
    summary: 'A glass home for my Android TV — readable from the sofa, calm on a weak chip.',
    brief: 'I wanted a calmer TV home: one big photo, a few apps, nothing else. Readable from across the room. Still smooth on a slow TV processor. Driven by a remote’s arrows alone.',
    did: [
      'Rotating nature wallpapers with a frosted dock of apps',
      'Focus that lifts with a soft ring, sized for remote arrows and a three-metre read',
      'A glass All apps sheet — hold OK to pin an app to the dock',
      'Wallpaper, clock, night and profile panels, plus music controls',
      'Only cheap effects: move, fade, images blurred in advance',
    ],
    stack: 'Java (about 4,200 lines), Android SDK, built with a script instead of Android Studio',
    result: 'Installed and running every day on my own TV.',
    tone: 'night',
    cover: { type: 'image', src: '/media/tv-home.webp', alt: 'Glass Home on the TV: mountain wallpaper, clock and a frosted app dock' },
    portrait: { type: 'row', shape: 'screens', bg: '#101317', srcs: ['/media/tv-home.webp', '/media/tv-apps.webp'], alt: 'Glass Home on the TV: the home screen and the app drawer' },
    gallery: [
      { type: 'image', src: '/media/tv-panel.webp', alt: 'Wallpaper panel with change timings', frame: 'tv' },
      { type: 'image', src: '/media/tv-apps.webp', alt: 'All apps sheet over a waterfall wallpaper', frame: 'tv' },
    ],
    story: {
      decisions: [
        {
          title: 'Designed for the sofa',
          body: 'Everything is sized for a 1280×720 screen read from three metres away, and driven by a remote’s arrow keys alone.',
        },
        {
          title: 'Only what a TV chip can afford',
          body: 'I sorted every effect by cost on a weak GPU. Move and fade are cheap; live blur and per-frame shaders are not. The glass uses images blurred in advance.',
        },
        {
          title: 'Focus you can see across the room',
          body: 'The chosen tile springs up and gets a white ring. You always know where the remote is pointing.',
        },
        {
          title: 'One dock, not rows of rows',
          body: 'A single frosted dock: five app tiles plus All apps. Everything else lives in a full-screen glass sheet.',
        },
        {
          title: 'No Android Studio',
          body: 'A script compiles, signs and installs straight onto the TV — no Gradle, no Android Studio.',
        },
      ],
      media: { type: 'image', src: '/media/tv-focus.webp', alt: 'Glass Home with “Jump back in” above the dock and the focus ring on the YouTube tile', frame: 'tv' },
      beforeAfter: {
        before: TODO('What did your TV’s home screen look like before Glass Home, and what bothered you about it? A screenshot would help.'),
        after: 'A calm glass home: one big photo, a frosted dock, a clock — readable from the sofa.',
      },
      outcomes: [
        'Installed and running every day on my own TV.',
        'About 4,200 lines of plain Java.',
      ],
    },
  },
  {
    slug: 'byperraz',
    zoom: ['Draft', 'approve'],
    title: 'byperraz engine',
    kind: 'Content studio for my Instagram',
    year: '2026',
    role: 'Design and build',
    summary: 'A laptop studio that plans, writes and renders design-tip carousels — nothing posts until I approve.',
    brief: 'I run @byperraz, design and front-end tips on Instagram. Three good carousels a day by hand was never going to last. I built a studio that does the heavy lifting and leaves the final call to me.',
    did: [
      'A 30-day plan across teardowns, palettes, type and open-source tools',
      'Writes each carousel, renders 4:5 slides from an HTML template, captions and alt text included',
      'A dashboard to preview everything; nothing posts until Approve & Post',
      'Stages at 13:00 and 18:00 and sends a Windows notification',
    ],
    stack: 'Python, Flask, Playwright, Gemini',
    result: '18 post kits produced so far, each through the approval step.',
    link: { label: 'See @byperraz', href: 'https://instagram.com/byperraz' },
    tone: 'paper',
    cover: { type: 'row', shape: 'slide', bg: '#141518', srcs: ['/media/by-1.webp', '/media/by-2.webp', '/media/by-3.webp'], alt: 'Three byperraz carousel slides about UI colour palettes' },
    portrait: { type: 'image', src: '/media/by-1.webp', alt: 'A byperraz carousel slide about UI colour palettes' },
    gallery: [
      { type: 'image', src: '/media/by-2.webp', alt: 'A byperraz carousel slide' },
      { type: 'image', src: '/media/by-3.webp', alt: 'A byperraz carousel slide' },
    ],
    story: {
      decisions: [
        {
          title: 'Nothing posts without me',
          body: 'The engine starts in preview. It plans, writes and renders — a post leaves only when I click Approve & Post.',
        },
        {
          title: 'Ready when I am',
          body: 'At 13:00 and 18:00 it stages the next post and sends a Windows notification. If the laptop slept, it still stages — up to six hours late.',
        },
        {
          title: 'Runs on this laptop',
          body: 'The core loop needs no cloud. Rendering slides works with no internet at all.',
        },
        {
          title: 'One shape for every caption',
          body: 'Hook, then call to action, then three to five tags. Every slide gets its own alt text.',
        },
      ],
      media: { type: 'image', src: '/media/stack-by.webp', alt: 'Three byperraz slides from the “One Job Per Color” palette post' },
      beforeAfter: {
        before: 'Every carousel by hand — never going to last at three good posts a day.',
        after: 'A 30-day plan, slides, captions and alt text prepared for me. The final call stays mine.',
      },
      outcomes: [
        '18 post kits produced so far, each through the approval step.',
        TODO('How has @byperraz grown since the engine started (followers, reach, saves)?'),
      ],
    },
  },
]
