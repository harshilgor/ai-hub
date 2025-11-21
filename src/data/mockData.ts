export interface Startup {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string[];
  fundingRound: string;
  amount: string;
  date: string;
  leadInvestor: string;
  investors: string[];
  website?: string;
  batch?: string;
  founders?: string[];
  teamSize?: number;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  date: string;
  summary: string;
  tags: string[];
  relatedStartups: string[];
  citations: number;
  link: string;
}

export interface Investor {
  id: string;
  name: string;
  logo: string;
  deals: number;
  totalInvested: string;
}

export const aiCategories = [
  'LLMs',
  'Computer Vision',
  'Robotics',
  'Healthcare AI',
  'Infrastructure',
  'Security',
  'Voice/Audio',
  'Agents',
  'Finance',
  'Education',
  'Creative Tools',
];

export const mockStartups: Startup[] = [
  {
    id: '1',
    name: 'NeuralMed',
    logo: '🏥',
    description: 'AI-powered diagnostic platform for early disease detection using multimodal medical imaging',
    category: ['Healthcare AI', 'Computer Vision'],
    fundingRound: 'Series A',
    amount: '$15M',
    date: '2 days ago',
    leadInvestor: 'Sequoia Capital',
    investors: ['Sequoia Capital', 'a16z', 'Y Combinator', 'General Catalyst'],
    website: 'https://neuralmed.ai',
    batch: 'W24',
    founders: ['Dr. Sarah Chen', 'Michael Rodriguez'],
    teamSize: 23,
  },
  {
    id: '2',
    name: 'CodeWeaver AI',
    logo: '💻',
    description: 'Autonomous coding agent that writes, tests, and deploys production-ready code',
    category: ['Agents', 'Infrastructure'],
    fundingRound: 'Seed',
    amount: '$8M',
    date: '5 days ago',
    leadInvestor: 'Andreessen Horowitz',
    investors: ['Andreessen Horowitz', 'Khosla Ventures', 'OpenAI Startup Fund'],
    website: 'https://codeweaver.ai',
    batch: 'S23',
    founders: ['Alex Kim', 'Jordan Lee'],
    teamSize: 12,
  },
  {
    id: '3',
    name: 'VisionGuard',
    logo: '🔒',
    description: 'Real-time threat detection and prevention using advanced computer vision AI',
    category: ['Security', 'Computer Vision'],
    fundingRound: 'Series B',
    amount: '$35M',
    date: '1 week ago',
    leadInvestor: 'Greylock Partners',
    investors: ['Greylock Partners', 'Accel', 'Index Ventures', 'Bessemer'],
    website: 'https://visionguard.ai',
    founders: ['Emma Watson', 'David Park'],
    teamSize: 45,
  },
  {
    id: '4',
    name: 'VoiceFlow',
    logo: '🎤',
    description: 'Natural voice cloning and generation platform for content creators and enterprises',
    category: ['Voice/Audio', 'Creative Tools'],
    fundingRound: 'Series A',
    amount: '$22M',
    date: '3 days ago',
    leadInvestor: 'Lightspeed Venture',
    investors: ['Lightspeed Venture', 'Spark Capital', 'First Round Capital'],
    website: 'https://voiceflow.ai',
    batch: 'W23',
    founders: ['Lisa Johnson', 'Ryan Martinez'],
    teamSize: 18,
  },
  {
    id: '5',
    name: 'RoboChef',
    logo: '🤖',
    description: 'Autonomous kitchen robots powered by AI for commercial food preparation',
    category: ['Robotics'],
    fundingRound: 'Series C',
    amount: '$80M',
    date: '2 weeks ago',
    leadInvestor: 'SoftBank Vision',
    investors: ['SoftBank Vision', 'Toyota AI Ventures', 'GV'],
    website: 'https://robochef.ai',
    founders: ['James Chen', 'Maria Garcia'],
    teamSize: 120,
  },
  {
    id: '6',
    name: 'FinanceGPT',
    logo: '💰',
    description: 'AI-powered financial analysis and portfolio management for institutional investors',
    category: ['Finance', 'LLMs'],
    fundingRound: 'Seed',
    amount: '$12M',
    date: '4 days ago',
    leadInvestor: 'Benchmark',
    investors: ['Benchmark', 'Ribbit Capital', 'QED Investors'],
    website: 'https://financegpt.ai',
    batch: 'S24',
    founders: ['Robert Chang', 'Sophia Williams'],
    teamSize: 15,
  },
  {
    id: '7',
    name: 'LearnAI',
    logo: '📚',
    description: 'Personalized AI tutoring platform adapting to each student\'s learning style',
    category: ['Education', 'Agents'],
    fundingRound: 'Series A',
    amount: '$18M',
    date: '1 week ago',
    leadInvestor: 'GSV Ventures',
    investors: ['GSV Ventures', 'Reach Capital', 'Owl Ventures'],
    website: 'https://learnai.com',
    batch: 'W24',
    founders: ['Kevin Patel', 'Anna Schmidt'],
    teamSize: 28,
  },
  {
    id: '8',
    name: 'PixelForge',
    logo: '🎨',
    description: 'Next-gen image and video generation AI for creative professionals',
    category: ['Creative Tools', 'Computer Vision'],
    fundingRound: 'Series B',
    amount: '$45M',
    date: '3 days ago',
    leadInvestor: 'Thrive Capital',
    investors: ['Thrive Capital', 'Tiger Global', 'Coatue'],
    website: 'https://pixelforge.ai',
    founders: ['Maya Anderson', 'Chris Taylor'],
    teamSize: 52,
  },
];

export const mockPapers: Paper[] = [
  {
    id: '1',
    title: 'Multimodal Chain-of-Thought Reasoning in Language Models',
    authors: ['Wei et al.'],
    venue: 'arXiv',
    date: '2 days ago',
    summary: 'This paper introduces a novel approach to integrate visual and textual reasoning in large language models, significantly improving performance on complex multimodal tasks.',
    tags: ['LLMs', 'Multimodal', 'Reasoning'],
    relatedStartups: ['1', '8'],
    citations: 12,
    link: 'https://arxiv.org/abs/2023.xxxxx',
  },
  {
    id: '2',
    title: 'Efficient Fine-Tuning of Medical Vision Models',
    authors: ['Chen, Rodriguez, et al.'],
    venue: 'NeurIPS 2025',
    date: '1 week ago',
    summary: 'Novel parameter-efficient fine-tuning method for medical imaging models that achieves state-of-the-art results with 10x fewer parameters.',
    tags: ['Healthcare AI', 'Computer Vision', 'Transfer Learning'],
    relatedStartups: ['1'],
    citations: 45,
    link: 'https://arxiv.org/abs/2025.xxxxx',
  },
  {
    id: '3',
    title: 'Autonomous Code Generation with Reinforcement Learning',
    authors: ['Kim, Lee, Johnson'],
    venue: 'ICML 2025',
    date: '3 days ago',
    summary: 'A reinforcement learning framework that enables AI agents to write, test, and iteratively improve code with minimal human supervision.',
    tags: ['Agents', 'RL', 'Code Generation'],
    relatedStartups: ['2'],
    citations: 89,
    link: 'https://arxiv.org/abs/2025.xxxxx',
  },
  {
    id: '4',
    title: 'Real-Time Anomaly Detection in Video Streams',
    authors: ['Watson, Park, Zhang'],
    venue: 'CVPR 2025',
    date: '5 days ago',
    summary: 'Introduces a lightweight neural architecture for detecting anomalies in video streams with latency under 50ms, enabling real-time security applications.',
    tags: ['Computer Vision', 'Security', 'Real-Time'],
    relatedStartups: ['3'],
    citations: 67,
    link: 'https://arxiv.org/abs/2025.xxxxx',
  },
];

export const mockInvestors: Investor[] = [
  { id: '1', name: 'Sequoia Capital', logo: '🔷', deals: 23, totalInvested: '$450M' },
  { id: '2', name: 'Andreessen Horowitz', logo: '🔶', deals: 19, totalInvested: '$380M' },
  { id: '3', name: 'Y Combinator', logo: '🟠', deals: 45, totalInvested: '$120M' },
  { id: '4', name: 'Greylock Partners', logo: '⚫', deals: 15, totalInvested: '$320M' },
  { id: '5', name: 'Accel', logo: '🔵', deals: 18, totalInvested: '$290M' },
];

export const trendingCategories = [
  { name: 'Healthcare AI', growth: 45, dealCount: 28 },
  { name: 'LLMs', growth: 38, dealCount: 42 },
  { name: 'Agents', growth: 52, dealCount: 35 },
  { name: 'Computer Vision', growth: 28, dealCount: 31 },
  { name: 'Robotics', growth: 33, dealCount: 18 },
];

export const monthlyFundingData = [
  { month: 'Jan', amount: 2.3, deals: 45 },
  { month: 'Feb', amount: 2.8, deals: 52 },
  { month: 'Mar', amount: 3.2, deals: 58 },
  { month: 'Apr', amount: 2.9, deals: 48 },
  { month: 'May', amount: 3.8, deals: 67 },
  { month: 'Jun', amount: 4.2, deals: 72 },
  { month: 'Jul', amount: 3.9, deals: 65 },
  { month: 'Aug', amount: 4.5, deals: 78 },
  { month: 'Sep', amount: 5.1, deals: 82 },
  { month: 'Oct', amount: 4.8, deals: 75 },
  { month: 'Nov', amount: 5.4, deals: 88 },
  { month: 'Dec', amount: 6.2, deals: 95 },
];

export const categoryDistribution = [
  { name: 'LLMs', value: 28, color: '#3B82F6' },
  { name: 'Healthcare', value: 22, color: '#10B981' },
  { name: 'Computer Vision', value: 18, color: '#8B5CF6' },
  { name: 'Agents', value: 15, color: '#F59E0B' },
  { name: 'Robotics', value: 10, color: '#EF4444' },
  { name: 'Others', value: 7, color: '#6B7280' },
];

export const industryData = {
  healthcare: {
    totalFunding: '$2.4B',
    startupCount: 156,
    growthRate: '+45%',
    topInvestor: 'Sequoia Capital',
    insights: [
      'AI diagnostic tools seeing massive adoption in hospitals',
      'Drug discovery AI startups raised $800M this quarter',
      'Remote patient monitoring powered by AI growing 60% YoY',
    ],
    topStartups: mockStartups.filter(s => s.category.includes('Healthcare AI')),
  },
  finance: {
    totalFunding: '$1.8B',
    startupCount: 124,
    growthRate: '+32%',
    topInvestor: 'Ribbit Capital',
    insights: [
      'AI trading algorithms outperforming traditional models',
      'Fraud detection AI preventing $2B in losses annually',
      'Robo-advisors managing $50B in assets',
    ],
    topStartups: mockStartups.filter(s => s.category.includes('Finance')),
  },
  robotics: {
    totalFunding: '$3.2B',
    startupCount: 89,
    growthRate: '+38%',
    topInvestor: 'SoftBank Vision',
    insights: [
      'Warehouse automation robots seeing 200% demand increase',
      'Humanoid robots entering consumer market',
      'Surgical robots performing 10K+ procedures monthly',
    ],
    topStartups: mockStartups.filter(s => s.category.includes('Robotics')),
  },
};

