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
    'Outside class I ship my own apps. I design them, write the code and keep going until they feel right. Before all of this I represented India at the Karate World Championship, which is where I learned to practise the same move a thousand times.',
  ],
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
    zoom: ['Campus', 'life'],
    title: 'CUBE',
    kind: 'College companion app',
    year: '2026',
    role: 'Design and build',
    summary: 'Your whole college day in one free app: timetable, attendance, grades, notes, maps and chat.',
    brief: 'A student’s day is scattered across a timetable photo, an attendance sheet, a grades portal and a group chat that stops working when campus Wi-Fi blocks it. CUBE puts all of it in one place. It grew out of Attendly, my first version.',
    did: [
      'Scan your timetable once and it becomes your schedule',
      'Mark classes with a swipe and see the hours you can still miss',
      'A grades calculator that tells you the marks you need, on any GPA scale',
      'A study notebook that answers questions about your notes and PDFs',
      'Campus map, reminders, and a nearby chat that works with no internet',
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
        { title: 'Grow the first version, don’t start over', body: 'Attendly already handled the timetable, attendance, grades, notes and exam quizzes, offline. CUBE kept all of that and added the two things a campus day was still missing: a map to find your room and a chat with classmates.' },
        { title: 'A chat that doesn’t need the internet', body: 'Our group chat stops working the moment campus Wi-Fi blocks it, so CUBE’s nearby chat talks to classmates around you with no connection at all.' },
        { title: 'Scan once, never type a timetable', body: 'Copying a timetable by hand is where students give up. You scan it once and it becomes your schedule.' },
        { title: 'Any grading scale', body: 'Colleges grade on 4, on 10 or their own way, so SGPA and CGPA work on any of them.' },
        TODO('What did you try or reject while designing CUBE (layouts, navigation, the swipe to mark)? One or two real choices and why.'),
      ],
      media: { type: 'image', src: '/media/stack-cube.webp', alt: 'CUBE after class: grades and SGPA, the study notebook, calendar reminders and the nearby chat' },
      beforeAfter: {
        before: 'Attendly: timetable, attendance, grades, notes and exam quizzes in one free app that works offline.',
        after: 'CUBE: everything Attendly did, plus a campus map and a nearby chat that works with no internet.',
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
    zoom: ['Saved', 'done'],
    title: 'Nextup',
    kind: 'Web app and Chrome extension',
    year: '2026',
    role: 'Design and build',
    summary: 'Turn what you save into what you do: every saved post gets one next action.',
    brief: 'I save posts, links and screenshots to do later, then never open them again. Nextup reads each save, gives it one clear next action, and builds a short list for the week.',
    did: [
      'Save by link, screenshot or the Chrome extension',
      'One next action per save, with a This week, Later and Done flow and Undo everywhere',
      'Free and Pro plans with UPI payments approved from an admin panel',
      '7 styles, 12 palettes checked for contrast, 11 ambient backgrounds',
      'Planned through a debate between seven AI agents, then built from an approved design',
    ],
    stack: 'Next.js, TypeScript, Chrome extension (Manifest V3), SQLite and Postgres',
    result: 'Extension packaged for the Chrome Web Store; tests run on both SQLite and Postgres.',
    tone: 'ember',
    cover: { type: 'image', src: '/media/nextup-card.webp', alt: 'Nextup: turn what you save into what you do' },
    portrait: { type: 'image', src: '/media/nextup-poster.webp', alt: 'Nextup: get the next step' },
    gallery: [{ type: 'video', src: '/media/nextup.mp4', poster: '/media/nextup-poster.webp', alt: 'Nextup reel: you saved it, then forgot it' }],
    story: {
      decisions: [
        { title: 'One next action, not another list', body: 'A list of saved posts is the problem, not the fix. Each save gets exactly one next action, and the week gets a short list: This week, Later, Archive, Done.' },
        { title: 'Argued out before it was built', body: 'Seven AI agents debated the product in a “war room”, each with a vote, and the plan that came out of it was built from a design preview I approved first.' },
        { title: 'Payments a person can trust', body: 'Pro is paid by UPI: you enter the 12-digit reference, I approve it by hand in the admin panel, and Pro switches on only then. It lasts 31 or 366 days and never renews by itself.' },
        { title: 'Contrast checked by a script', body: 'All 12 palettes are tested against WCAG contrast by a script, so a style can be playful without becoming unreadable.' },
        { title: 'Undo instead of “Are you sure?”', body: 'Done and Delete both have Undo, so a slip never loses anything.' },
      ],
      media: { type: 'image', src: '/media/stack-nextup.webp', alt: 'Nextup: saved items, each with one next action and a tag' },
      beforeAfter: {
        before: 'An earlier version priced Pro at $6 a month through a recurring payment link.',
        after: 'Pro at Rs 199 a month or Rs 1,799 a year, paid by UPI and approved by hand, with no automatic renewal.',
        gap: TODO('Why did you move from the $6 payment link to UPI with manual approval? One line in your words.'),
      },
      outcomes: [
        'The Chrome extension is packaged and ready for the Chrome Web Store.',
        'The database tests run twice: on SQLite and on a real Postgres engine.',
        TODO('Is Nextup live for users yet, or published on the Chrome Web Store? Any numbers?'),
      ],
    },
  },
  {
    slug: 'folio',
    zoom: ['Read', 'daily'],
    title: 'Folio',
    kind: 'Reading companion',
    year: '2026',
    role: 'Design and build',
    summary: 'A calm reading app with a focus room, a sound mixer and a sprout that grows as you read.',
    brief: 'Reading apps either track you like a fitness app or do nothing at all. Folio is quiet: it asks for a few pages a day and gives you a room to read them in.',
    did: [
      'A Today page in one editorial column',
      'A focus room with a 25, 45 or open timer and a full-screen focus mode',
      'A sound mixer with 9 generated channels, 6 presets and your own saved mixes',
      'Sproutling, a live SVG character that breathes, blinks, reads with you and grows from Seed to Grove',
      'Installable and works offline',
    ],
    stack: 'HTML, CSS and JavaScript, Web Audio, service worker',
    result: 'About 400 KB first load with no layout shift; passed a 64-screenshot review on phone and desktop, day and night.',
    tone: 'pine',
    cover: { type: 'row', shape: 'phone', bg: '#e6e7df', srcs: ['/media/folio-today.webp', '/media/folio-room.webp', '/media/folio-shelf.webp'], alt: 'Folio on a phone: Today page, focus room with Sproutling, and the shelf' },
    portrait: { type: 'row', shape: 'phone', bg: '#e6e7df', srcs: ['/media/folio-today.webp', '/media/folio-room.webp'], alt: 'Folio on a phone: Today page and the focus room' },
    gallery: [{ type: 'image', src: '/media/folio-card.webp', alt: 'Folio: read a little every day', frame: 'browser' }],
    story: {
      decisions: [
        { title: 'Four directions, then one', body: 'I previewed four design directions at phone size, each with its own layouts, sound presets, icons and a live Sproutling, then chose Clothbound.' },
        { title: 'One system instead of five', body: 'The app had grown five competing UI styles. One Clothbound system with a Day and a Night theme replaced them all, set in Literata and Hanken Grotesk.' },
        { title: 'Decoration out', body: 'Tilt and spotlight effects, rainbow gradients, Three.js, GSAP and confetti all came out. A reading app should be quiet.' },
        { title: 'Glass only where it floats', body: 'Glass sits on the floating chrome, the dock, sheets and player, and never on anything you read.' },
        { title: 'Real icons', body: 'A custom line icon set replaced every emoji that was standing in for an icon.' },
      ],
      media: { type: 'image', src: '/media/folio-notes.webp', alt: 'Folio’s focus room: Sproutling reading in glasses above a 25-minute timer', frame: 'phone' },
      beforeAfter: {
        before: 'Five competing UI styles, emoji for icons, and decoration everywhere, all in a single 6,106-line HTML file.',
        after: 'One Clothbound system, Day and Night, with custom line icons and a calm editorial Today page.',
        gap: TODO('A screenshot of Folio before the Clothbound redesign, to show next to the new one.'),
      },
      outcomes: [
        'A second design review found 24 issues; 23 were fixed before shipping.',
        'Installable, and it keeps working offline.',
      ],
    },
  },
  {
    slug: 'glass-home',
    zoom: ['Calm', 'TV'],
    title: 'Glass Home',
    kind: 'Android TV home screen',
    year: '2026',
    role: 'Design and build',
    summary: 'A glass home screen for my Android TV, built for a remote and a slow chip.',
    brief: 'I wanted a calmer home screen for my TV: a big photo, a few apps and nothing else, readable from across the room and still fast on a weak TV processor.',
    did: [
      'Rotating nature wallpapers with a frosted dock of apps',
      'Focus that lifts with a soft ring, designed for a remote’s arrow keys',
      'A glass All apps sheet: hold OK to add an app to the dock',
      'Wallpaper, clock, night and profile panels, plus music controls',
      'Only cheap effects (moving, fading, pre-blurred images) so it stays smooth',
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
        { title: 'Designed for the sofa', body: 'Everything is sized for a 1280×720 screen read from three metres away, and driven by a remote’s arrow keys alone.' },
        { title: 'Only effects a TV chip can afford', body: 'I sorted every effect by its cost on a weak GPU. Moving and fading things, and still images, are cheap; live blur and per-frame shaders are not. So the glass uses images blurred in advance.' },
        { title: 'Focus you can see across a room', body: 'The chosen tile springs up and gets a white ring, so you always know where the remote is.' },
        { title: 'One dock, not rows of rows', body: 'A single frosted dock: five app tiles plus All apps, and a full-screen glass sheet for everything else.' },
        { title: 'No Android Studio', body: 'A script compiles, signs and installs the app straight onto the TV, without Gradle or Android Studio.' },
      ],
      media: { type: 'image', src: '/media/tv-focus.webp', alt: 'Glass Home with “Jump back in” above the dock and the focus ring on the YouTube tile', frame: 'tv' },
      beforeAfter: {
        before: TODO('What did your TV’s home screen look like before Glass Home, and what bothered you about it? A screenshot would help.'),
        after: 'A calm glass home: one big photo, a frosted dock, and a clock, readable from the sofa.',
      },
      outcomes: [
        'Installed and running every day on my own TV.',
        'About 4,200 lines of plain Java.',
      ],
    },
  },
  {
    slug: 'byperraz',
    zoom: ['Ideas', 'posts'],
    title: 'byperraz engine',
    kind: 'Content studio for my Instagram',
    year: '2026',
    role: 'Design and build',
    summary: 'A small studio on my laptop that plans, writes and renders design-tip carousels.',
    brief: 'I run @byperraz, an Instagram page of design and front-end tips. Making three good carousels a day by hand was not going to last, so I built a tool that does the heavy lifting and leaves the final call to me.',
    did: [
      'A 30-day plan of topics across teardowns, palettes, type and open-source tools',
      'Writes each carousel, renders 4:5 slides from an HTML template, and writes captions and alt text',
      'A dashboard to preview everything; nothing posts until I click Approve',
      'Stages posts at 13:00 and 18:00 and sends a Windows notification',
    ],
    stack: 'Python, Flask, Playwright, Gemini',
    result: '18 post kits produced so far, published through the approval step.',
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
        { title: 'Nothing posts without me', body: 'The engine starts in preview mode. It plans, writes and renders, but a post goes out only when I click Approve & Post.' },
        { title: 'Ready when I am', body: 'At 13:00 and 18:00 it stages the next post and sends a Windows notification; if the laptop was asleep it still stages it, up to six hours late.' },
        { title: 'Runs on my laptop', body: 'The core loop needs no cloud, and rendering the slides works with no internet at all.' },
        { title: 'Rules for every caption', body: 'Each caption is shaped the same way, a hook, then the call to action, then three to five tags, and every slide gets its own alt text.' },
      ],
      media: { type: 'image', src: '/media/stack-by.webp', alt: 'Three byperraz slides from the “One Job Per Color” palette post' },
      beforeAfter: {
        before: 'Every carousel made by hand, which was never going to last at three good posts a day.',
        after: 'A 30-day plan, slides, captions and alt text prepared for me, with the final call still mine.',
      },
      outcomes: [
        '18 post kits produced so far, each through the approval step.',
        TODO('How has @byperraz grown since the engine started (followers, reach, saves)?'),
      ],
    },
  },
]
