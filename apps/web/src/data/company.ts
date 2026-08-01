/**
 * Single source of truth for all site content, transcribed from the
 * Suburban Integrated Services Limited corporate profile brochure.
 * Edit here to change copy across the whole site.
 */

export const company = {
  name: 'Suburban Integrated Services Limited',
  shortName: 'Suburban Integrated Services',
  tagline: 'IT, Power & Energy Consulting',
  website: 'www.suburbanintegratedservices.com',
  emails: [
    'suburbanintegratedservices@gmail.com',
    'info@suburbanintegratedservices.com',
  ],
  phones: ['08034616962', '07064018707'],
  address:
    'House 9, Off Enyinda Ordu Street, Mbelekuru Anaka, Rivers State, Nigeria',
  intro:
    'Suburban Integrated Services Limited is a dynamic and innovative company registered in Nigeria with a strong focus on Information Technology (IT), Power Solutions, and General Consulting Services.',
} as const;

export const about = {
  paragraphs: [
    'Suburban Integrated Services Limited is a fully indigenous, technology-driven company with a strong focus on Information and Communication Technology (ICT), Renewable Energy Solutions, Electronic Security Systems, Manufacturing, General Trading, and Engineering Support Services.',
    'We specialize in providing tailored, technology-driven, and energy-efficient solutions for homes, offices, institutions, and rural communities.',
    'At Suburban Integrated Services Limited, we are committed to empowering clients through the deployment of smart technologies, renewable energy systems, and professional consulting that ensures sustainability, security, and operational excellence.',
    'Our multidisciplinary team delivers world-class services with a deep understanding of local challenges and global standards.',
  ],
  consultancy: {
    title: 'Consultancy and Project Management Services',
    body: 'Suburban Integrated Services Limited specializes in providing in-house consultancy and outsourced technical services to organizations across Nigeria and the West African sub-region. We deploy highly skilled consultants, project engineers, and client representatives to manage and support a wide range of projects.',
  },
  expertise: {
    title: 'Technical Expertise and Support',
    body: 'Our team consists of experienced professionals who play pivotal roles in the successful execution of technical projects both onsite and remotely. From urban offices to remote rural installations, we remain a reliable partner in delivering sustainable and scalable solutions.',
  },
} as const;

export const ceo = {
  name: 'Dominic Anyanwago',
  title: 'Chief Executive Officer / Managing Director',
  thankYou:
    'Thank you for trusting Suburban Integrated Services Limited.',
  statement: [
    'At Suburban Integrated Services Limited, we believe in the transformative power of technology, innovation, and sustainable infrastructure. From humble beginnings, our goal has always been clear: to create integrated solutions that empower individuals, businesses, and communities across Nigeria and Africa at large.',
    'We have strategically positioned ourselves in core sectors such as ICT, Renewable Energy, Security Systems, and Engineering Services, ensuring that every solution we provide aligns with international standards and is tailored to local needs.',
    'As we look to the future, we are more committed than ever to advancing innovation, fostering sustainability, and delivering value not just for today, but for generations to come.',
  ],
} as const;

export type Manager = {
  name: string;
  role: string;
  bio: string[];
};

export const management: Manager[] = [
  {
    name: 'Villa Ukima Aneamaga',
    role: 'Deputy Managing Director (DMD), HR & Finance',
    bio: [
      'Villa Ukima Aneamaga is a dynamic and results-driven professional, serving as Deputy Managing Director and Human Resources & Finance lead at Suburban Integrated Services Limited. With a solid academic foundation in Marketing from Abia State University, Uturu, and a flair for branding, digital strategy, and consumer engagement, Villa brings a unique blend of creativity and business acumen to the leadership team.',
      'Her professional journey reflects a strong passion for organizational development, people management, and financial sustainability. In her role as DMD HR & Finance, she oversees the company’s human capital strategy and financial operations, ensuring alignment with the organization’s goals of innovation, efficiency, and long-term growth.',
      'She is deeply committed to building strong teams, fostering a performance-driven culture, and driving impactful initiatives that enhance both employee wellbeing and corporate value.',
    ],
  },
  {
    name: 'Alex Nkem Obi',
    role: 'General Manager, Business Development',
    bio: [
      'Alex Nkem Obi is an accomplished engineer and business strategist with over 17 years of experience in the oil, gas, and energy sectors, spanning operations, health & safety, process engineering, and corporate development. He holds a Master’s degree in Management of Health, Safety, Environment & Quality Systems from the University of Pisa, Italy, a Certificate in Petroleum Production Engineering from ENI Enrico Mattei University, and a B.Eng. in Mechanical Engineering from the Federal University of Technology, Owerri.',
      'Alex’s career has included senior leadership roles at Oando Energy Resources, Eni Nigeria, and Eni Algeria, where he led HSEQ management systems, process safety operations, international audits, and large-scale project implementations. He has managed multi-million-dollar contracts, optimized operational budgets, and successfully driven ISO certification projects, including ISO 39001 and ISO 45001 transitions.',
      'Fluent in English, French, and Italian, Alex brings a global perspective, technical expertise, and a proven ability to build strategic partnerships. In his role as GM, Business Development at Suburban Integrated Services Limited, he leverages his extensive industry network, operational insight, and strategic vision to drive growth, expand market presence, and deliver sustainable value to clients and stakeholders.',
    ],
  },
];

export const mission =
  'To provide cutting-edge, customer-focused services in home automation, electrical power solution, renewable energy, security systems, and technical training, thereby transforming lives and enhancing productivity across Nigeria and beyond.';

export const vision =
  'To be the leading provider of integrated IT, power, and automation solutions in Nigeria, known for innovation, reliability, and service excellence.';

export type CoreValue = { title: string; description: string };

export const coreValues: CoreValue[] = [
  { title: 'Innovation', description: 'Embracing new technologies and creative solutions.' },
  { title: 'Integrity', description: 'Conducting all operations with transparency and honesty.' },
  { title: 'Excellence', description: 'Consistently delivering top-quality services and support.' },
  { title: 'Sustainability', description: 'Promoting eco-friendly and energy-efficient solutions.' },
  { title: 'Customer Satisfaction', description: "Ensuring every client's needs is met and exceeded." },
  { title: 'Empowerment', description: 'Through training, capacity building, and knowledge sharing.' },
];

export type WhyPoint = { title: string; description: string };

export const whyChooseUs: WhyPoint[] = [
  { title: 'Comprehensive Expertise', description: 'We combine knowledge across IT, energy, and infrastructure.' },
  { title: 'Tailored Solutions', description: 'Every project is designed to meet specific environmental needs.' },
  { title: 'After-Sales Support', description: 'We ensure long-term satisfaction through consistent support and maintenance.' },
  { title: 'Qualified Professionals', description: 'Our team consists of certified technicians, engineers, and consultants.' },
  { title: 'Community Impact', description: 'We go beyond business to impact lives through empowerment and training.' },
];

export type Service = {
  slug: string;
  title: string;
  summary: string;
  items: string[];
  image: string;
  imageAlt: string;
};

export const services: Service[] = [
  {
    slug: 'smart-home-building-automation',
    title: 'Smart Home & Building Automation',
    summary:
      'We design and install fully integrated smart systems that increase convenience, security, and energy efficiency in residential and commercial environments.',
    items: [
      'Smart Lighting Control Systems',
      'Access Control & Biometric Security Systems',
      'CCTV Installation with Remote Viewing Capabilities',
      'Video Door Bells & Smart Lock Systems',
      'Intercom and Communication Systems',
    ],
    image: '/images/products/smart-lock-keypad-glass-door.jpg',
    imageAlt: 'Smart keypad door lock installed on a modern glass door',
  },
  {
    slug: 'power-solutions-renewable-energy',
    title: 'Power Solutions & Renewable Energy',
    summary:
      'With a strong focus on sustainability and alternative energy, we deliver efficient power systems tailored to client needs.',
    items: [
      'Inverter Systems Installation & Maintenance',
      'Solar Power Solutions for Homes & Offices',
      'Solar Borehole Installations for water access in rural and urban areas',
      'Solar Street Lighting Systems for public and private lighting needs',
      'Rural Electrification Projects to extend power to under-served areas',
    ],
    image: '/images/projects/solar-inverter-installation.jpg',
    imageAlt: 'Hybrid solar inverter and lithium battery installation by Suburban Integrated Services',
  },
  {
    slug: 'professional-training-capacity-building',
    title: 'Professional Training & Capacity Building',
    summary: 'To support technological adoption and enhance local capacity.',
    items: [
      'Health, Safety and Environment (HSE) Training',
      'Technical Training in Smart Home Setup, Solar Installation, and Equipment Maintenance',
      'Community Sensitization & Empowerment Workshops',
      'Customized Corporate Training for Organizations',
    ],
    image: '/images/training/hse-training-session.jpg',
    imageAlt: 'HSE lock-out/tag-out training session delivered by Suburban Integrated Services',
  },
  {
    slug: 'it-general-consulting',
    title: 'IT & General Consulting',
    summary:
      'With a strong focus on sustainability and innovation, we deliver efficient consulting services tailored to client needs.',
    items: [
      'Needs Assessment and Project Design',
      'Procurement and Installation Consulting',
      'Maintenance Plans and Lifecycle Support',
      'Technical Support Services',
    ],
    image: '/images/projects/structured-cabling-rack.jpg',
    imageAlt: 'Structured cabling and network rack installation',
  },
];

export type Project = {
  title: string;
  client: string;
  year: string;
};

export const projects: Project[] = [
  { title: 'Revamping of 215v low voltage line & switch gear', client: 'Stella Maris College', year: '2023' },
  { title: 'Purchase & installation of 10kva inverter & solar panels', client: 'Telogas Nig Ltd', year: '2023' },
  { title: 'Installation of 3.5kva inverter / solar panel & safety protection', client: 'Telogas Nig Ltd', year: '2023/24' },
  { title: 'Purchase, design & installation of digital telephone system', client: 'Private sector client', year: '—' },
  { title: 'Design, purchase & installation of CCTV & 5kva inverter for power backup', client: 'Private sector client', year: '2023' },
  { title: 'Design, purchase & installation of 16 nos. of CCTV cameras', client: 'Stella Maris College', year: '2023' },
  { title: 'Design, purchase & installation of double 3.5kva inverter / solar panel', client: 'Stella Maris College', year: '2024' },
  { title: 'Installation of digital transmission radio (PTP)', client: 'NLNG site project', year: '2024' },
  { title: 'Coordinated HSE Training for MoPPU Umuahia', client: 'Abia State', year: '2025' },
  { title: 'Design and installation of fire alarm system', client: 'Private sector client', year: '2024' },
  { title: 'Design & networking of CBT (Computer Based Test) Centre, including switches, routers & internet vouchers', client: 'Private sector client', year: '2024' },
  { title: 'Design & installation of access control / attendance machine', client: 'SwanCrest Engineering', year: '2025' },
  { title: 'Perimeter electric fence installation', client: 'Private sector', year: '2025' },
  { title: 'Designing of 45,000 / 32,000 / 20,000 litre steel water storage tanks', client: 'MoPPU Umuahia', year: '2025' },
  { title: 'Recharging of fire extinguisher bottles', client: 'MoPPU Umuahia', year: '2025' },
  { title: 'Design, purchase & installation of 5kva inverter / solar panels', client: 'Stella Maris College', year: '2025' },
];

export type GalleryPhoto = {
  src: string;
  alt: string;
  caption: string;
};

/** Real photos from delivered projects and training engagements. */
export const projectGallery: GalleryPhoto[] = [
  {
    src: '/images/projects/rooftop-solar-array.jpg',
    alt: 'Rooftop solar panel array on a commercial building',
    caption: 'Rooftop solar array installation',
  },
  {
    src: '/images/projects/solar-inverter-installation.jpg',
    alt: 'Wall-mounted charge controllers, hybrid inverter, and lithium battery towers',
    caption: 'Hybrid solar inverter & lithium battery installation',
  },
  {
    src: '/images/projects/inverter-bank-installation.jpg',
    alt: 'Bank of inverters and battery cabinets in a power room',
    caption: 'Multi-inverter power bank build-out',
  },
  {
    src: '/images/projects/inverter-battery-room.jpg',
    alt: 'Inverter wall units with floor-standing battery cabinets during commissioning',
    caption: 'Inverter & battery bank commissioning',
  },
  {
    src: '/images/projects/structured-cabling-rack.jpg',
    alt: 'Structured cabling patch panels and network switches in server racks',
    caption: 'Structured cabling & network infrastructure',
  },
  {
    src: '/images/projects/av-equipment-installation.jpg',
    alt: 'Technicians assembling audio-visual and electronic equipment on site',
    caption: 'On-site AV & electronics installation for an oil & gas client',
  },
  {
    src: '/images/projects/computer-training-lab.jpg',
    alt: 'Computer-based test centre with rows of networked workstations',
    caption: 'CBT centre design & networking',
  },
  {
    src: '/images/training/hse-training-session.jpg',
    alt: 'HSE trainer presenting hazardous energy sources for lock-out/tag-out',
    caption: 'HSE lock-out/tag-out training session',
  },
  {
    src: '/images/training/corporate-training-workshop.jpg',
    alt: 'Facilitator addressing participants at a corporate training workshop',
    caption: 'Corporate HSE training workshop',
  },
  {
    src: '/images/training/hse-training-participants.jpg',
    alt: 'Engineers taking notes during an HSE capacity-building workshop',
    caption: 'Capacity-building workshop for ministry engineers',
  },
  {
    src: '/images/team/installation-team.jpg',
    alt: 'Suburban installation team in safety vests in front of a completed inverter bank',
    caption: 'Our installation team on a completed power project',
  },
];

export const clients: string[] = [
  'Stella Maris College',
  'Telos Gas Plant',
  'Telogas Nig Ltd',
  'Cloud Exchange',
  'CISAN',
  'Eni',
  'MoPPU Umuahia',
  'NLNG',
  'SwanCrest Engineering',
];

/** Client logo image files (extracted from the corporate profile). */
export const clientLogos: string[] = Array.from(
  { length: 11 },
  (_, i) => `/clients/client-${String(i + 1).padStart(2, '0')}.jpg`,
);

export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/projects', label: 'Projects' },
  { href: '/contact', label: 'Contact' },
];
