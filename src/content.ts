// Everything a visitor reads lives here.

export const site = {
  name: 'Perraz',
  fullName: 'Perraz Badhniwalla',
  role: 'Product designer & front-end developer, with a finance degree',
  pitch: 'I design products, build them myself, and know their worth.',
  intro: 'I’m an MBA Tech student in Mumbai, studying computer engineering and finance. This year I shipped five products, from a campus app to a TV home screen.',
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
  proof: {
    title: 'Five products. Designed, coded and shipped by one person.',
    points: [
      { label: 'Design and code', body: 'Every product here, I designed and built end to end. No templates, no hand-off.' },
      { label: 'Finance', body: 'Corporate finance intern at SOTC: MIS, reconciliation and about 120 forex approvals a day.' },
      { label: 'Engineering', body: 'At Hitachi Systems I load-tested a banking app and built its monitoring in Java.' },
      { label: 'Discipline', body: 'Represented India at the Karate World Championship. Practice is the whole method.' },
    ],
  },
  now: 'Now building Aegis, a research desk for Indian markets where my finance and engineering sides meet. More soon.',
  teaser: {
    title: 'Aegis',
    label: 'In the works',
    line: 'A research desk for Indian markets that I’m building on my own laptop. Careful with data, strict with risk, and patient before it ever trades.',
    hints: ['Indian markets', 'Research first', 'Risk rules built in', 'Runs locally'],
  },
  manifesto: ['I want such ideas.', '…and I build them.'],
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
  link?: { label: string; href: string }
  tone: 'clay' | 'ink' | 'pine' | 'night' | 'paper' | 'ember'
  cover: Media
  /** A tall version of the cover for phones held upright */
  portrait?: Media
  gallery: Media[]
}

export const projects: Project[] = [
  {
    slug: 'cube',
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
  },
  {
    slug: 'nextup',
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
  },
  {
    slug: 'folio',
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
  },
  {
    slug: 'glass-home',
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
  },
  {
    slug: 'byperraz',
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
  },
]
