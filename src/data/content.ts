// All editable site content lives here.

import type { Mode } from '../scripts/hero-scene';

export const site = {
  name: 'Amanda Wu',
  year: 2026,
  nav: [
    { label: 'Work', href: '#work' },
    { label: 'Writing', href: '#writing' },
    { label: 'About', href: '#about' },
  ],
};

// Social links used in the About section, mobile menu and footer
export const social = {
  email: 'amanda.lokman.ng@gmail.com',
  linkedin: 'https://www.linkedin.com/in/amandawudesign/',
  instagram: 'https://www.instagram.com/amandawu.art/',
};

export const about = {
  paragraphs: [
    "I'm a product design leader with 7 years in fintech. My work ranges from 0-to-1 product strategy to growing products at scale.",
    'I solve complex real-world problems, design experiences that move business metrics, and build high-performing teams that deliver outcomes.',
  ],
  stats: [
    { value: '15+', label: 'Years shaping products & brands' },
    { value: '2x', label: 'Scaling teams from 3 to 6+' },
    { value: '2M+', label: 'Funding secured towards design vision' },
    { value: 'Global', label: 'Trusted by teams from multiple regions' },
  ],
};

export type CaseStudy = {
  title: string;
  tags: { label: string; primary?: boolean }[];
  image?: string; // put files in /public/images and reference as '/images/xyz.jpg'
  visual?: 'bank-portal' | 'ai-onboarding' | 'pos-capital'; // animated illustration shown instead of an image
  imageAlt: string;
  lede: string;
  metrics: { value: string; label: string }[];
  href?: string;
};

// One case per hero word, in the same order: strategize, design, build.
export const caseStudies: CaseStudy[] = [
  {
    title: 'Turning a zero-to-one vision into a funded roadmap.',
    tags: [{ label: 'Strategize', primary: true }, { label: 'Zero → One' }],
    visual: 'bank-portal',
    imageAlt: 'Animated concept of a digital banking portal on desktop and mobile',
    lede: 'I led a team of 4 designers to craft an executive-ready platform strategy for a new digital bank, grounded in user research, open banking and AI-driven personalization.',
    metrics: [
      { value: '$2M+', label: 'Funding secured for a multi-year roadmap' },
      { value: '0 → 1', label: 'Digital banking platform strategy' },
    ],
  },
  {
    title: 'Designing onboarding that turns interest into customers.',
    tags: [{ label: 'Design', primary: true }, { label: 'Growth' }],
    visual: 'ai-onboarding',
    imageAlt: 'Animated concept of an AI guide helping a first-time investor open an account',
    lede: 'I led a team of 2 designers to redesign EasyTrade onboarding and its native mobile app, and set the experience strategy for Small Business Credit Card onboarding.',
    metrics: [
      { value: '+34%', label: 'Conversion within 2 weeks of launch' },
      { value: '94K', label: 'Projected new small business cards by 2027' },
    ],
  },
  {
    title: 'Building teams and workflows that ship at twice the pace.',
    tags: [{ label: 'Build', primary: true }, { label: 'Scale' }],
    visual: 'pos-capital',
    imageAlt: 'Animated concept of a restaurant POS with pay-at-table and capital insights',
    lede: 'As a design manager, I led designers across Payments & Capital, launching products like Pay-at-Table and bringing AI prototyping into how Product, Design and Engineering work.',
    metrics: [
      { value: '2x', label: 'Team productivity with AI workflows' },
      { value: '70%', label: 'Faster payments with Pay-at-Table' },
    ],
  },
];

export const substack = 'https://amandaxdesign.substack.com';

export type Post = {
  title: string;
  excerpt: string;
  date: string;
  /** Strategize / Design / Build label shown next to the date */
  theme: Mode;
  /** Cover: a public-domain abstract artwork (Wikimedia Commons), stored in /public/images/writing */
  image: string;
  art: { artist: string; title: string; year: string; source: string };
  href: string;
};

// Articles from Substack, newest first. Each cover is a public-domain abstract artwork picked for its theme.
export const posts: Post[] = [
  {
    title: 'Design the AI Workflow Where Tools Can Contribute, Not Determine It',
    excerpt: 'I keep seeing posts on LinkedIn about how much people can do by just prompting AI.',
    date: '2026-05-13',
    theme: 'build',
    image: '/images/writing/moholy-nagy-a19.jpg',
    art: { artist: 'László Moholy-Nagy', title: 'A 19', year: '1927', source: 'https://commons.wikimedia.org/wiki/File:%27A_19,_1927%27_by_Laszlo_Moholy-Nagy.jpg' },
    href: `${substack}/p/design-the-ai-workflow-where-tools-can`,
  },
  {
    title: 'What I Learned About AI Safety From Building a Chatbot Guardrail for Youth Mental Health',
    excerpt:
      "This week I participated in the Mila AI hackathon, a week-long collaboration between Mila (Quebec's AI Institute), Bell Canada, Buzz HPC, and Kids Help Phone to build safer conversational AI systems for youth mental health.",
    date: '2026-03-25',
    theme: 'build',
    image: '/images/writing/af-klint-childhood.jpg',
    art: { artist: 'Hilma af Klint', title: 'The Ten Largest, No. 2, Childhood', year: '1907', source: 'https://commons.wikimedia.org/wiki/File:Hilma_af_Klint_-_The_Ten_Largest_No._2_-_Childhood_-_1907.jpg' },
    href: `${substack}/p/what-i-learned-about-ai-safety-from`,
  },
  {
    title: 'AI Is Your New Teammate. It Just Got Here.',
    excerpt: 'At the current stage, what drives the success of building products with AI?',
    date: '2026-03-12',
    theme: 'strategize',
    image: '/images/writing/malevich-dynamic-suprematism.jpg',
    art: { artist: 'Kazimir Malevich', title: 'Dynamic Suprematism', year: '1915–16', source: 'https://commons.wikimedia.org/wiki/File:Dynamic_Suprematism_(Malevich,_1916).jpg' },
    href: `${substack}/p/ai-is-your-new-teammate-it-just-got`,
  },
  {
    title: 'Is the Double Diamond Design Process Outdated in the Age of AI?',
    excerpt: 'The design process is facing its “waterfall to agile” moment.',
    date: '2026-02-05',
    theme: 'design',
    image: '/images/writing/van-doesburg-counter-composition-v.jpg',
    art: { artist: 'Theo van Doesburg', title: 'Counter-Composition V', year: '1924', source: 'https://commons.wikimedia.org/wiki/File:Theo_van_Doesburg_Counter-CompositionV_(1924).jpg' },
    href: `${substack}/p/is-the-double-diamond-design-process`,
  },
  {
    title: 'The Evolution of Design Work in the AI Era',
    excerpt:
      "Last week, I read Figma’s first AI model designer Barron Webster’s interview. As former head of design at Replit, Webster broke down how AI will fundamentally reshape designer roles in digital product development.",
    date: '2026-01-29',
    theme: 'design',
    image: '/images/writing/kandinsky-cossacks.jpg',
    art: { artist: 'Wassily Kandinsky', title: 'Cossacks', year: '1910–11', source: 'https://commons.wikimedia.org/wiki/File:Wassily_Kandinsky_Cossacks_or_Cosaques_1910%E2%80%931.jpg' },
    href: `${substack}/p/the-evolution-of-design-work-in-the`,
  },
  {
    title: 'Shaping the Future of Digital Service Through AI Policy',
    excerpt: 'Last week, I attended Mila’s AI Policy Conference, where my insights as a design expert in banking helped shape one of the presentations.',
    date: '2026-01-22',
    theme: 'strategize',
    image: '/images/writing/gris-bottle-of-rum.jpg',
    art: { artist: 'Juan Gris', title: 'Bottle of Rum and Newspaper', year: '1913–14', source: 'https://commons.wikimedia.org/wiki/File:Juan_Gris_(1887-1927)_-_Bottle_of_Rum_and_Newspaper_(La_Bouteille_de_rhum_et_le_journal)_-_T06808_-_Tate.jpg' },
    href: `${substack}/p/shaping-the-future-of-digital-service`,
  },
];
