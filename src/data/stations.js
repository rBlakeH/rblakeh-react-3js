// Copy is verbatim from the approved design handoff (.claude/v2) and from
// Blake's resume. Do not paraphrase, re-order or "tighten" any string here.
//
// dir: +1 = scene enters from the right, card sits left. -1 mirrors it.

export const STATION_LENGTH_VH = 300; // 180–520 in the prototype; 300 is the default
export const FINALE_LENGTH_VH = 240;

export const stations = [
  {
    id: 'boulder',
    label: '01 Boulder',
    jumpLabel: 'Boulder',
    dir: 1,
    cardWidth: 'min(392px, 82vw)',
    eyebrow: 'Boulder, Colorado · Education',
    title: 'University of Colorado Boulder',
    subtitle: 'B.S. Computer Science · College of Engineering',
    dates: '2017 — May 2021',
    bullets: [
      'Algorithms, AI, data science and computer graphics, with electives in VR and game development.',
      'Research assistant at the ATLAS Institute Thing Lab — VR scene reconstruction from 3D scanning.',
      'Intern at Longs Peak Advisory: ~15 Python/Flask automations behind a drag-and-drop portal on AWS EC2.',
    ],
    tags: ['Python', 'Flask', 'OpenGL', 'VR'],
  },
  {
    id: 'longs',
    label: '02 Longs Peak',
    jumpLabel: 'Longs Peak',
    dir: -1,
    cardWidth: 'min(400px, 82vw)',
    eyebrow: 'Longmont, Colorado · Internship',
    title: 'Longs Peak Advisory',
    subtitle: 'Software Engineer Intern',
    dates: 'Jan 2020 — Feb 2021',
    bullets: [
      'Built a suite of ~15 Python/Flask automations behind a drag-and-drop web portal hosted on AWS EC2, transforming client Excel submissions into downstream system formats with pandas and eliminating hours of manual reformatting per run.',
      'Extended the portal to trigger UiPath RPA jobs on demand, and authored supporting technical documentation in LaTeX.',
    ],
    tags: ['Python', 'Flask', 'pandas', 'AWS EC2', 'UiPath', 'LaTeX'],
  },
  {
    id: 'desert',
    label: '03 Albuquerque',
    jumpLabel: 'Albuquerque',
    dir: -1,
    cardWidth: 'min(400px, 82vw)',
    eyebrow: 'Albuquerque, New Mexico',
    title: 'iTeam Consulting',
    subtitle: 'Junior Software Engineer',
    dates: 'Feb 2021 — Apr 2022',
    bullets: [
      'Built and maintained a large ASP.NET Core and Blazor construction loan servicing platform for banking clients — builder draw distributions, loan tracking, provider management.',
      'Implemented multi-field fuzzy search across client, company and free-text fields, replacing rigid exact-match filtering.',
      "Migrated a tribal client's oil tracking app from a REST-backed legacy system to React + Apollo GraphQL, cutting per-page requests from thousands to single digits.",
    ],
    tags: ['ASP.NET Core', 'Blazor', 'C#', 'React', 'GraphQL'],
  },
  {
    id: 'yard',
    label: '04 Intermodal yard',
    jumpLabel: 'Fort Worth',
    dir: 1,
    cardWidth: 'min(420px, 82vw)',
    eyebrow: 'Fort Worth, Texas · Intermodal',
    title: 'BNSF Railway — Intermodal Analytics',
    subtitle: 'Associate Software Engineer',
    dates: 'Jul 2022 — Nov 2024',
    bullets: [
      '2023 Employee of the Year for the rollout of Load Planning Optimization (LPO), an intermodal yard optimization system — and co-inventor on the resulting patent application.',
      'Owned the Databricks + PySpark ETL layer behind LPO, joining GPS, equipment and track-assignment data for the optimization models; scaled across 12 facilities.',
      'Wrote a graph traversal audit of the yard routable network that surfaced routing defects producing paths a mile outside facility boundaries — ~20 miles of hostler travel saved per train.',
      'Converted from the management trainee program to full-time engineering in 6 months against an 18-month track.',
    ],
    tags: ['Databricks', 'PySpark', 'ETL', 'React', 'Power BI'],
  },
  {
    id: 'inspection',
    label: '05 Track measurement',
    jumpLabel: 'Main line',
    dir: -1,
    cardWidth: 'min(420px, 82vw)',
    eyebrow: 'Current role · Edge / IoT platform',
    title: 'Software Engineer II — BNSF Railway',
    subtitle: 'Edge inspection platform · day-to-day technical lead',
    dates: 'Nov 2024 — Present',
    bullets: [
      'Own the Python microservice layer of a train-mounted edge inspection system — a rolling data center of servers, cameras and frame grabbers capturing track-defect imagery at track speed.',
      'Rebuilt GPS telemetry as a containerized FastAPI service on OpenShift/OKD via an agentic Claude Code workflow, retiring a Raspberry Pi + GPSD single point of failure.',
      'Cut GPS-to-track location latency from ~550 ms to under 20 ms by collapsing two round trips into one .NET GIS endpoint and multiplexing connections with HTTPX.',
      'Technical lead: runs standup, grooms the backlog, onboarded 4 engineers, and has run 50+ system design and DS&A interviews this year.',
    ],
    tags: ['FastAPI', 'OpenShift / OKD', 'mTLS', 'RabbitMQ', 'Azure', 'Claude Code'],
  },
];

export const hero = {
  route: 'Boulder → Albuquerque → Fort Worth',
  name: 'Blake Hampton',
  role: 'Backend & distributed systems engineer',
  prompt: 'All aboard! Scroll down to start the trip',
  promptSub: 'Boulder to BNSF',
};

export const finale = {
  label: '06 End of track',
  eyebrow: 'Terminal · route summary',
  heading: 'Thanks for riding the line.',
  paragraph:
    '~5 years building containerized microservices, event-driven pipelines and edge/IoT applications in production industrial environments — Python and C#/.NET on Kubernetes-based platforms, owned from hardware provisioning through cloud integration.',
  credits: [
    'US 2026/0152218 A1 · patent pending',
    '2023 BNSF Employee of the Year',
    'B.S. CS, CU Boulder',
  ],
  board: {
    title: 'Station directory',
    region: 'Dallas–Fort Worth',
    headers: { line: 'Line', address: 'Address', platform: 'Plat.' },
    rows: [
      {
        line: 'EMAIL',
        address: 'rblakeham@gmail.com',
        platform: '1',
        platformColor: '#eaa48b',
        href: 'mailto:rblakeham@gmail.com',
      },
      {
        line: 'LINKEDIN',
        address: 'in/blake-hampton',
        platform: '2',
        platformColor: '#c9c5bc',
        href: 'https://www.linkedin.com/in/blake-hampton-b2847a192/',
        external: true,
      },
      {
        line: 'GITHUB',
        address: 'github.com/rBlakeH',
        platform: '3',
        platformColor: '#c9c5bc',
        href: 'https://github.com/rBlakeH',
      },
      {
        line: 'HOME',
        address: 'Dallas–Fort Worth, TX',
        platform: '4',
        platformColor: '#8fd3a8',
      },
    ],
  },
};
