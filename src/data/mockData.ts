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
  fundingRationale?: string;
  technologyTrend?: string;
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

export interface IndustryInsight {
  id: string;
  title: string;
  description: string;
  event: string;
  explanation: string;
  date: string;
  relatedCompanies: string[];
  relatedInvestors: string[];
  relatedPapers: string[];
  relatedNews: string[];
  connections: {
    type: 'paper' | 'news' | 'insider' | 'company' | 'investor';
    id: string;
    label: string;
    description: string;
  }[];
  category: string;
  impact: 'high' | 'medium' | 'low';
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  link: string;
  relatedCompanies: string[];
  relatedInvestors: string[];
}

export interface TechnologyTrend {
  id: string;
  name: string;
  description: string;
  growthRate: number;
  fundingAmount: string;
  dealCount: number;
  keyPlayers: string[];
  researchPapers: string[];
  whyHot: string;
  nextBigThing: boolean;
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
    fundingRationale: 'Breakthrough in multimodal medical imaging with 95% accuracy in early disease detection. Recent research papers show significant improvements in parameter-efficient fine-tuning, making this technology scalable. Healthcare AI sector seeing 45% growth with massive hospital adoption.',
    technologyTrend: 'Multimodal Healthcare AI',
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
    fundingRationale: 'AI agents category experiencing 52% growth. Recent ICML paper on autonomous code generation with RL shows breakthrough potential. a16z betting heavily on agent infrastructure as the next platform shift.',
    technologyTrend: 'Autonomous AI Agents',
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
    fundingRationale: 'Real-time anomaly detection breakthrough with <50ms latency. CVPR 2025 paper validates approach. Security AI market expanding rapidly with enterprise demand for real-time threat detection.',
    technologyTrend: 'Real-Time Computer Vision',
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
    fundingRationale: 'Voice AI market exploding with content creator demand. Multimodal models enabling realistic voice synthesis. Creative tools sector seeing massive adoption from media companies.',
    technologyTrend: 'Voice Synthesis & Cloning',
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
    fundingRationale: 'Robotics sector seeing 200% demand increase in commercial automation. SoftBank doubling down on humanoid and commercial robots. Series C indicates strong product-market fit and scaling opportunity.',
    technologyTrend: 'Commercial Robotics & Automation',
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
    fundingRationale: 'LLM applications in finance showing strong ROI. Recent research on financial reasoning with LLMs demonstrates superior performance. Fintech AI sector growing 32% with institutional adoption.',
    technologyTrend: 'Financial LLMs & AI Trading',
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
    fundingRationale: 'AI agents for personalized education showing 3x better learning outcomes. EdTech sector embracing AI tutors. Research on adaptive learning systems validates approach.',
    technologyTrend: 'AI-Powered Personalized Education',
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
    fundingRationale: 'Multimodal generation models advancing rapidly. Recent papers on chain-of-thought reasoning improving quality. Creative professionals adopting AI tools at unprecedented rate.',
    technologyTrend: 'Multimodal Content Generation',
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
  {
    id: '5',
    title: 'Efficient AI Inference Architectures: 10x Improvements in Model Efficiency',
    authors: ['Zhang, Li, et al.'],
    venue: 'NeurIPS 2025',
    date: '1 week ago',
    summary: 'Novel architecture designs achieving 10x efficiency improvements in AI model inference, reducing computational requirements and energy consumption.',
    tags: ['Infrastructure', 'Efficiency', 'Inference'],
    relatedStartups: [],
    citations: 124,
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

export const industryInsights: IndustryInsight[] = [
  {
    id: '1',
    title: 'Michael Burry\'s Nvidia Short',
    event: 'Michael Burry (Scion Asset Management) disclosed a significant short position against Nvidia',
    description: 'The "Big Short" investor is betting against the AI chip giant, citing valuation concerns and potential market saturation.',
    explanation: 'Burry\'s move comes as Nvidia trades at 40x revenue. Research papers suggest AI chip demand may plateau as models become more efficient. Founders Fund\'s subsequent exit suggests smart money is rotating out of pure-play AI infrastructure.',
    date: '3 days ago',
    relatedCompanies: ['Nvidia'],
    relatedInvestors: ['Scion Asset Management', 'Founders Fund'],
    relatedPapers: ['5'],
    relatedNews: ['1', '2'],
    connections: [
      {
        type: 'investor',
        id: 'founders-fund',
        label: 'Founders Fund',
        description: 'Dropped all Nvidia shares following Burry\'s disclosure',
      },
      {
        type: 'paper',
        id: '5',
        label: 'Efficient AI Inference Architectures',
        description: 'Research showing 10x efficiency improvements in model inference',
      },
      {
        type: 'news',
        id: '1',
        label: 'Nvidia Valuation Concerns',
        description: 'Analysts question sustainability of current valuation',
      },
    ],
    category: 'Semiconductors',
    impact: 'high',
  },
  {
    id: '2',
    title: 'Founders Fund Exits Nvidia',
    event: 'Peter Thiel\'s Founders Fund sold all Nvidia positions worth $200M',
    description: 'The prominent VC fund completely exited its Nvidia holdings, signaling a shift in AI infrastructure investment strategy.',
    explanation: 'This follows Michael Burry\'s short position. Founders Fund is known for early AI bets but may be rotating into application-layer companies. Insider sources suggest they\'re doubling down on AI agents and vertical AI solutions.',
    date: '1 day ago',
    relatedCompanies: ['Nvidia'],
    relatedInvestors: ['Founders Fund'],
    relatedPapers: ['5'],
    relatedNews: ['2'],
    connections: [
      {
        type: 'insider',
        id: 'ff-strategy',
        label: 'Founders Fund Strategy Shift',
        description: 'Moving from infrastructure to application-layer AI investments',
      },
      {
        type: 'company',
        id: '2',
        label: 'CodeWeaver AI',
        description: 'Agent infrastructure company - likely target for Founders Fund',
      },
    ],
    category: 'Investment Strategy',
    impact: 'high',
  },
  {
    id: '3',
    title: 'Multimodal AI Breakthrough',
    event: 'New research paper shows 95% accuracy in medical imaging with multimodal models',
    description: 'Combining visual and textual reasoning in medical diagnosis achieves unprecedented accuracy.',
    explanation: 'This breakthrough validates the approach taken by companies like NeuralMed. The research connects to recent funding in healthcare AI, showing why investors are bullish on multimodal applications.',
    date: '2 days ago',
    relatedCompanies: ['1'],
    relatedInvestors: ['Sequoia Capital'],
    relatedPapers: ['1', '2'],
    relatedNews: ['3'],
    connections: [
      {
        type: 'paper',
        id: '1',
        label: 'Multimodal Chain-of-Thought Reasoning',
        description: 'Key research enabling the breakthrough',
      },
      {
        type: 'company',
        id: '1',
        label: 'NeuralMed',
        description: 'Startup leveraging this research for medical diagnostics',
      },
    ],
    category: 'Healthcare AI',
    impact: 'high',
  },
];

export const newsItems: NewsItem[] = [
  {
    id: '1',
    title: 'Nvidia Valuation Concerns Mount as AI Chip Demand Slows',
    source: 'TechCrunch',
    date: '4 days ago',
    summary: 'Analysts question whether Nvidia can maintain its current valuation as AI model efficiency improvements reduce chip demand.',
    link: 'https://techcrunch.com/nvidia-valuation',
    relatedCompanies: ['Nvidia'],
    relatedInvestors: ['Scion Asset Management'],
  },
  {
    id: '2',
    title: 'Founders Fund Exits Nvidia: What It Means for AI Investing',
    source: 'The Information',
    date: '1 day ago',
    summary: 'Peter Thiel\'s fund sold all Nvidia positions, signaling a shift from infrastructure to application-layer AI investments.',
    link: 'https://theinformation.com/founders-fund-nvidia',
    relatedCompanies: ['Nvidia'],
    relatedInvestors: ['Founders Fund'],
  },
  {
    id: '3',
    title: 'Multimodal AI Shows Promise in Medical Diagnosis',
    source: 'Nature Medicine',
    date: '2 days ago',
    summary: 'New research demonstrates 95% accuracy in medical imaging diagnosis using multimodal AI models.',
    link: 'https://nature.com/multimodal-medical-ai',
    relatedCompanies: ['1'],
    relatedInvestors: ['Sequoia Capital'],
  },
];

export const technologyTrends: TechnologyTrend[] = [
  {
    id: '1',
    name: 'Autonomous AI Agents',
    description: 'AI systems that can autonomously plan, execute, and iterate on complex tasks',
    growthRate: 52,
    fundingAmount: '$2.1B',
    dealCount: 35,
    keyPlayers: ['CodeWeaver AI', 'Anthropic', 'OpenAI'],
    researchPapers: ['3'],
    whyHot: 'Recent ICML paper on RL-based code generation shows breakthrough potential. Investors see agents as the next platform shift after LLMs.',
    nextBigThing: true,
  },
  {
    id: '2',
    name: 'Multimodal Healthcare AI',
    description: 'Combining visual, textual, and clinical data for superior medical diagnosis',
    growthRate: 45,
    fundingAmount: '$1.8B',
    dealCount: 28,
    keyPlayers: ['NeuralMed', 'PathAI', 'Tempus'],
    researchPapers: ['1', '2'],
    whyHot: '95% accuracy breakthrough in medical imaging. Massive hospital adoption driving 45% sector growth.',
    nextBigThing: true,
  },
  {
    id: '3',
    name: 'Real-Time Computer Vision',
    description: 'Ultra-low latency vision systems for security, autonomous vehicles, and robotics',
    growthRate: 38,
    fundingAmount: '$1.2B',
    dealCount: 22,
    keyPlayers: ['VisionGuard', 'Scale AI', 'Waymo'],
    researchPapers: ['4'],
    whyHot: 'CVPR 2025 paper shows <50ms latency achievable. Enterprise demand for real-time threat detection exploding.',
    nextBigThing: false,
  },
  {
    id: '4',
    name: 'Voice Synthesis & Cloning',
    description: 'Natural voice generation and cloning for content creation and enterprise applications',
    growthRate: 42,
    fundingAmount: '$850M',
    dealCount: 18,
    keyPlayers: ['VoiceFlow', 'ElevenLabs', 'Descript'],
    researchPapers: ['1'],
    whyHot: 'Multimodal models enabling realistic voice synthesis. Content creator demand driving rapid adoption.',
    nextBigThing: false,
  },
];

export const investorActivity: {
  investor: string;
  action: string;
  target: string;
  date: string;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
}[] = [
  {
    investor: 'Founders Fund',
    action: 'Exited all positions',
    target: 'Nvidia',
    date: '1 day ago',
    reasoning: 'Rotating from infrastructure to application-layer AI. Betting on agents and vertical AI solutions.',
    impact: 'high',
  },
  {
    investor: 'Andreessen Horowitz',
    action: 'Led $8M seed round',
    target: 'CodeWeaver AI',
    date: '5 days ago',
    reasoning: 'Doubling down on agent infrastructure. Recent research validates autonomous code generation approach.',
    impact: 'high',
  },
  {
    investor: 'Sequoia Capital',
    action: 'Led $15M Series A',
    target: 'NeuralMed',
    date: '2 days ago',
    reasoning: 'Multimodal healthcare AI showing 95% accuracy. Massive market opportunity in medical diagnostics.',
    impact: 'high',
  },
  {
    investor: 'SoftBank Vision',
    action: 'Led $80M Series C',
    target: 'RoboChef',
    date: '2 weeks ago',
    reasoning: 'Commercial robotics seeing 200% demand increase. Strong product-market fit in food service automation.',
    impact: 'medium',
  },
];

