/**
 * AI Content Service - Generates detailed, natural language overviews using AI
 * Supports multiple providers: OpenAI, Anthropic, or fallback to templates
 */

import axios from 'axios';

/**
 * Generate detailed technology overview using AI
 */
export async function generateAITechnologyOverview(technology, techData, evidence, keyInsights, whatToBuild) {
  // Check if AI API is configured
  const aiProvider = process.env.AI_PROVIDER || 'none'; // 'openai', 'anthropic', 'none'
  const apiKey = process.env.AI_API_KEY;
  
  if (aiProvider === 'none' || !apiKey) {
    // Fallback to template-based generation
    return generateTemplateOverview(technology, techData, evidence, keyInsights, whatToBuild);
  }
  
  try {
    // Prepare context data
    const context = {
      technology: technology,
      paperCount: techData.count,
      recentPapers: techData.recentCount,
      growthRate: techData.growthRate,
      topPapers: techData.papers.slice(0, 5).map(p => ({
        title: p.title,
        citations: p.citations,
        venue: p.venue
      })),
      companies: evidence.commercial.length,
      patents: evidence.patents.length,
      keyInsights: keyInsights,
      opportunities: whatToBuild
    };
    
    if (aiProvider === 'openai') {
      return await generateWithOpenAI(context);
    } else if (aiProvider === 'anthropic') {
      return await generateWithAnthropic(context);
    }
  } catch (error) {
    console.error('AI generation failed, falling back to template:', error.message);
    return generateTemplateOverview(technology, techData, evidence, keyInsights, whatToBuild);
  }
}

/**
 * Generate with OpenAI
 */
async function generateWithOpenAI(context) {
  // Generate summary first
  const summaryPrompt = `Write a 2-3 sentence summary explaining why ${context.technology} is emerging as the next big technology. Include: ${context.paperCount} research papers, ${context.recentPapers} in last 6 months, ${context.growthRate}% growth rate. Make it engaging and informative.`;

  // Generate VERY DETAILED full read sections (for daily limit of 20)
  const fullReadPrompt = `You are a senior technology analyst writing a comprehensive, in-depth overview of ${context.technology}. This is for a premium audience that wants deep insights.

CONTEXT:
- Research Papers: ${context.paperCount} total, ${context.recentPapers} published in last 6 months
- Growth Rate: ${context.growthRate}%
- Top Papers: ${context.topPapers.map(p => `"${p.title}" (${p.citations} citations, ${p.venue})`).join('; ')}
- Commercial Activity: ${context.companies} news articles, ${context.patents} patents
- Key Insights: ${context.keyInsights.map(i => i.description).join('; ')}
- Opportunities: ${context.opportunities.map(o => `${o.title}: ${o.description}`).join('; ')}

Write a VERY DETAILED, comprehensive overview with these sections. Each section should be 4-6 sentences with specific examples, data points, and actionable insights. Return ONLY valid JSON in this exact format:
{
  "sections": [
    {
      "heading": "What is it?",
      "content": "Provide a comprehensive explanation of ${context.technology}, its core concepts, fundamental principles, and why it matters in the current technological landscape. Include specific examples and use cases. (4-6 detailed sentences)"
    },
    {
      "heading": "Research Foundation",
      "content": "Deep dive into the research landscape, discussing key papers, major breakthroughs, influential researchers, and the evolution of the field. Reference specific papers and their contributions. (4-6 detailed sentences)"
    },
    {
      "heading": "Why Now?",
      "content": "Explain in detail why this technology is emerging now. Discuss enabling factors, market conditions, technological prerequisites, and what has changed recently that makes this the right time. Include specific trends and drivers. (4-6 detailed sentences)"
    },
    {
      "heading": "Commercial Landscape",
      "content": "Provide a comprehensive analysis of market interest, funding activity, patent landscape, major players, startups, and commercial applications. Include specific companies, funding amounts, and market opportunities. (4-6 detailed sentences)"
    },
    {
      "heading": "Technical Deep Dive",
      "content": "Explain the technical architecture, key algorithms, implementation challenges, and what makes this technology technically interesting or innovative. Include specific technical details. (4-6 detailed sentences)"
    },
    {
      "heading": "Market Opportunities",
      "content": "Identify and analyze specific market opportunities, use cases, industries that will be disrupted, and potential business models. Be specific about which sectors and applications. (4-6 detailed sentences)"
    },
    {
      "heading": "What to Build Next",
      "content": "Provide specific, actionable recommendations for products, applications, tools, or services that should be built. Include concrete ideas with market potential and technical feasibility. (4-6 detailed sentences)"
    },
    {
      "heading": "Risks and Challenges",
      "content": "Discuss potential risks, technical challenges, adoption barriers, and what could prevent this technology from succeeding. Be honest and balanced. (4-6 detailed sentences)"
    },
    {
      "heading": "Future Outlook",
      "content": "Predict where this technology is heading in the next 1-3 years. Discuss likely developments, potential breakthroughs, and how the landscape might evolve. (4-6 detailed sentences)"
    }
  ]
}

Make it extremely informative, engaging, and actionable. Write in a professional but accessible tone. Include specific data points, examples, and concrete details. Return ONLY the JSON object, no other text.`;

  try {
    // Generate summary
    const summaryResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technology analyst who writes clear, insightful summaries.'
          },
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const summary = summaryResponse.data.choices[0].message.content;
    
    // Generate full read
    const fullReadResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technology analyst. Always return valid JSON with the sections array.'
          },
          {
            role: 'user',
            content: fullReadPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000, // Increased for much more detailed reads
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const fullReadContent = fullReadResponse.data.choices[0].message.content;
    let fullRead;
    
    try {
      const parsed = JSON.parse(fullReadContent);
      fullRead = parsed.sections || [];
    } catch (e) {
      // If JSON parsing fails, try to extract sections from text
      fullRead = parseSectionsFromText(fullReadContent);
    }
    
    return {
      summary,
      fullRead,
      generatedBy: 'OpenAI',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    };
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Parse sections from text if JSON parsing fails
 */
function parseSectionsFromText(text) {
  const sections = [];
  const headings = ['What is it?', 'Research Foundation', 'Why Now?', 'Commercial Landscape', 'What to Build Next'];
  
  headings.forEach(heading => {
    const regex = new RegExp(`${heading}[\\s\\S]*?(?=${headings.find(h => h !== heading)}|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      const content = match[0].replace(new RegExp(heading, 'i'), '').trim();
      if (content.length > 50) {
        sections.push({ heading, content });
      }
    }
  });
  
  return sections.length > 0 ? sections : [
    { heading: 'Overview', content: text.substring(0, 500) }
  ];
}

/**
 * Generate with Anthropic
 */
async function generateWithAnthropic(context) {
  // Generate summary
  const summaryPrompt = `Write a 2-3 sentence summary explaining why ${context.technology} is emerging as the next big technology. Include: ${context.paperCount} research papers, ${context.recentPapers} in last 6 months, ${context.growthRate}% growth rate.`;

  // Generate VERY DETAILED full read (matching OpenAI version)
  const fullReadPrompt = `You are a senior technology analyst writing a comprehensive, in-depth overview of ${context.technology}. This is for a premium audience that wants deep insights.

CONTEXT:
- Research Papers: ${context.paperCount} total, ${context.recentPapers} published in last 6 months
- Growth Rate: ${context.growthRate}%
- Top Papers: ${context.topPapers.map(p => `"${p.title}" (${p.citations} citations, ${p.venue})`).join('; ')}
- Commercial Activity: ${context.companies} news articles, ${context.patents} patents
- Key Insights: ${context.keyInsights.map(i => i.description).join('; ')}
- Opportunities: ${context.opportunities.map(o => `${o.title}: ${o.description}`).join('; ')}

Write a VERY DETAILED, comprehensive overview with these sections. Each section should be 4-6 sentences with specific examples, data points, and actionable insights. Return ONLY valid JSON in this exact format:
{
  "sections": [
    {
      "heading": "What is it?",
      "content": "Provide a comprehensive explanation of ${context.technology}, its core concepts, fundamental principles, and why it matters in the current technological landscape. Include specific examples and use cases. (4-6 detailed sentences)"
    },
    {
      "heading": "Research Foundation",
      "content": "Deep dive into the research landscape, discussing key papers, major breakthroughs, influential researchers, and the evolution of the field. Reference specific papers and their contributions. (4-6 detailed sentences)"
    },
    {
      "heading": "Why Now?",
      "content": "Explain in detail why this technology is emerging now. Discuss enabling factors, market conditions, technological prerequisites, and what has changed recently that makes this the right time. Include specific trends and drivers. (4-6 detailed sentences)"
    },
    {
      "heading": "Commercial Landscape",
      "content": "Provide a comprehensive analysis of market interest, funding activity, patent landscape, major players, startups, and commercial applications. Include specific companies, funding amounts, and market opportunities. (4-6 detailed sentences)"
    },
    {
      "heading": "Technical Deep Dive",
      "content": "Explain the technical architecture, key algorithms, implementation challenges, and what makes this technology technically interesting or innovative. Include specific technical details. (4-6 detailed sentences)"
    },
    {
      "heading": "Market Opportunities",
      "content": "Identify and analyze specific market opportunities, use cases, industries that will be disrupted, and potential business models. Be specific about which sectors and applications. (4-6 detailed sentences)"
    },
    {
      "heading": "What to Build Next",
      "content": "Provide specific, actionable recommendations for products, applications, tools, or services that should be built. Include concrete ideas with market potential and technical feasibility. (4-6 detailed sentences)"
    },
    {
      "heading": "Risks and Challenges",
      "content": "Discuss potential risks, technical challenges, adoption barriers, and what could prevent this technology from succeeding. Be honest and balanced. (4-6 detailed sentences)"
    },
    {
      "heading": "Future Outlook",
      "content": "Predict where this technology is heading in the next 1-3 years. Discuss likely developments, potential breakthroughs, and how the landscape might evolve. (4-6 detailed sentences)"
    }
  ]
}

Make it extremely informative, engaging, and actionable. Write in a professional but accessible tone. Include specific data points, examples, and concrete details. Return ONLY the JSON object, no other text.`;

  try {
    // Generate summary
    const summaryResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: summaryPrompt
          }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.AI_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    const summary = summaryResponse.data.content[0].text;
    
    // Generate full read
    const fullReadResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 4000, // Increased for much more detailed reads
        messages: [
          {
            role: 'user',
            content: fullReadPrompt
          }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.AI_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    const fullReadContent = fullReadResponse.data.content[0].text;
    let fullRead;
    
    try {
      // Try to extract JSON from response
      const jsonMatch = fullReadContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        fullRead = parsed.sections || [];
      } else {
        fullRead = parseSectionsFromText(fullReadContent);
      }
    } catch (e) {
      fullRead = parseSectionsFromText(fullReadContent);
    }
    
    return {
      summary,
      fullRead,
      generatedBy: 'Anthropic',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
    };
  } catch (error) {
    console.error('Anthropic API error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fallback template-based generation (VERY DETAILED - matching AI format)
 */
function generateTemplateOverview(technology, techData, evidence, keyInsights, whatToBuild) {
  const sections = [];
  
  // 1. What is it? - Comprehensive introduction
  sections.push({
    heading: 'What is it?',
    content: `${technology} represents a significant technological advancement that is rapidly gaining traction in both research and commercial communities. With ${techData.count} research papers published and ${techData.recentCount} papers in the last 6 months alone, this technology is experiencing explosive growth at a rate of ${Math.round(techData.growthRate)}%. The field spans ${techData.categories.length} major categories including ${techData.categories.slice(0, 3).join(', ')}, and has been published in prestigious venues including ${techData.venues.slice(0, 3).join(', ')}. This technology addresses critical challenges in modern computing and has the potential to transform how we approach complex problems. The combination of strong academic validation, rapid research acceleration, and growing commercial interest positions ${technology} as a key technology for the next decade.`
  });
  
  // 2. Research Foundation - Deep dive
  if (techData.papers.length > 0) {
    const topPaper = techData.papers.sort((a, b) => (b.citations || 0) - (a.citations || 0))[0];
    const highCitationCount = techData.papers.filter(p => (p.citations || 0) > 50).length;
    const avgCitations = Math.round(techData.papers.reduce((sum, p) => sum + (p.citations || 0), 0) / techData.papers.length);
    
    sections.push({
      heading: 'Research Foundation',
      content: `The technology is built on a solid foundation of ${techData.count} research papers, with ${highCitationCount} papers receiving 50+ citations, indicating strong academic validation and influence. The most influential work, "${topPaper.title?.substring(0, 120)}${topPaper.title?.length > 120 ? '...' : ''}", has been cited ${topPaper.citations || 0} times and was published in ${topPaper.venue || 'a leading venue'}. The average citation count of ${avgCitations} per paper demonstrates consistent research quality. The recent acceleration—with ${Math.round(techData.growthRate)}% of all papers published in the last 6 months—demonstrates that the field is rapidly evolving and attracting significant research attention from top institutions worldwide. Research spans multiple domains including ${techData.categories.slice(0, 4).join(', ')}, showing broad applicability and interdisciplinary interest.`
    });
  }
  
  // 3. Why Now? - Detailed timing analysis
  if (keyInsights.length > 0) {
    const insightsText = keyInsights.map(insight => insight.description).join(' Additionally, ');
    sections.push({
      heading: 'Why Now?',
      content: `${insightsText} This convergence of factors—strong research momentum, commercial interest, and technical breakthroughs—creates a unique window of opportunity for this technology to become mainstream. The timing is particularly favorable due to recent advances in related technologies, increased computational resources, and growing market demand. The ${Math.round(techData.growthRate)}% growth rate in research publications indicates that we're at an inflection point where theoretical research is transitioning into practical applications. Market conditions, investor sentiment, and technological maturity have aligned to create an optimal environment for this technology to flourish.`
    });
  }
  
  // 4. Commercial Landscape - Comprehensive market analysis
  const fundingCount = evidence.commercial.filter(n => {
    const title = (n.title || '').toLowerCase();
    return title.includes('funding') || title.includes('raise');
  }).length;
  
  sections.push({
    heading: 'Commercial Landscape',
    content: `The commercial ecosystem is rapidly developing with ${evidence.commercial.length} news articles and announcements covering this technology, including ${fundingCount} funding rounds indicating strong investor confidence. Additionally, ${evidence.patents.length} patents have been filed, showing that companies are actively protecting intellectual property and preparing for commercial deployment. This combination of research validation, investor interest, and IP protection suggests the technology is moving from research to real-world applications. Major technology companies, startups, and research institutions are all investing significant resources, creating a competitive but healthy ecosystem. The patent landscape shows active innovation across multiple application domains, suggesting broad commercial potential.`
  });
  
  // 5. Technical Deep Dive
  sections.push({
    heading: 'Technical Deep Dive',
    content: `From a technical perspective, ${technology} leverages cutting-edge algorithms and architectures that enable new capabilities previously thought impossible. The technology builds upon foundational research in ${techData.categories.slice(0, 2).join(' and ')}, combining insights from multiple disciplines to create novel solutions. Key technical innovations include improved efficiency, scalability, and performance metrics that address critical limitations of previous approaches. The average citation count of ${Math.round(techData.papers.reduce((sum, p) => sum + (p.citations || 0), 0) / techData.papers.length)} per paper indicates that the research community recognizes the technical contributions. Implementation challenges are being actively addressed through ongoing research, with recent papers focusing on practical deployment considerations.`
  });
  
  // 6. Market Opportunities
  sections.push({
    heading: 'Market Opportunities',
    content: `The market opportunities for ${technology} span multiple industries and use cases. With ${techData.count} research papers exploring various applications, the technology has demonstrated potential in ${techData.categories.slice(0, 3).join(', ')}, and other domains. The ${evidence.commercial.length} commercial announcements indicate active market development, with companies identifying specific use cases and business models. The combination of strong research validation and growing commercial interest suggests significant market potential. Early adopters are already exploring applications, and the patent activity shows that companies are positioning themselves for market leadership. The technology addresses real market needs, with clear value propositions for both enterprise and consumer applications.`
  });
  
  // 7. What to Build Next - Detailed opportunities
  if (whatToBuild.length > 0) {
    const opportunitiesText = whatToBuild.map(opp => 
      `${opp.title}: ${opp.description} ${opp.action}`
    ).join(' Another opportunity is ');
    
    sections.push({
      heading: 'What to Build Next',
      content: `Based on the research landscape and market gaps, there are several high-opportunity areas to focus on: ${opportunitiesText}. These opportunities represent areas where research is strong but commercial solutions are limited, creating a clear path for innovation and market entry. Entrepreneurs and developers should prioritize solutions that leverage the latest research breakthroughs while addressing real market needs. The combination of strong technical foundation and market demand creates ideal conditions for building successful products. Specific focus areas include tools that make the technology more accessible, applications that demonstrate clear ROI, and platforms that enable broader adoption.`
    });
  }
  
  // 8. Risks and Challenges
  sections.push({
    heading: 'Risks and Challenges',
    content: `While the technology shows great promise, there are several risks and challenges to consider. Technical challenges include scalability concerns, integration complexity, and the need for specialized expertise. Market risks include competition from established solutions, adoption barriers, and the need for significant investment in infrastructure. Regulatory and ethical considerations may also impact deployment timelines. However, the strong research momentum and commercial interest suggest that these challenges are being actively addressed. The ${techData.recentCount} recent papers indicate ongoing work to overcome technical limitations, and the ${evidence.commercial.length} commercial announcements show that companies are finding ways to address market challenges.`
  });
  
  // 9. Future Outlook
  sections.push({
    heading: 'Future Outlook',
    content: `Looking ahead, ${technology} is positioned for significant growth over the next 1-3 years. The ${Math.round(techData.growthRate)}% growth rate in research publications suggests continued acceleration, with new breakthroughs likely to emerge. Commercial adoption is expected to increase as the technology matures and becomes more accessible. The combination of strong research foundation, commercial interest, and market opportunities creates a positive outlook. We can expect to see major product launches, increased funding, and broader industry adoption. The technology is likely to become a standard tool in its domain, with applications spanning multiple industries. Key developments to watch include major platform releases, strategic partnerships, and breakthrough research that unlocks new capabilities.`
  });
  
  // Companies working on it
  const companies = extractCompaniesFromEvidence(evidence);
  if (companies.length > 0) {
    sections.push({
      heading: 'Key Players',
      content: `Major companies and research institutions are actively working on ${technology}. Organizations like ${companies.slice(0, 5).join(', ')}${companies.length > 5 ? `, and ${companies.length - 5} others` : ''} are investing in research and development, indicating broad industry recognition of the technology's potential. This diverse ecosystem of players suggests healthy competition and multiple paths to market success.`
    });
  }
  
  const summary = `${technology} is emerging as a critical technology with ${techData.count} research papers, ${techData.recentCount} published in the last 6 months (${Math.round(techData.growthRate)}% growth rate), and growing commercial interest from ${evidence.commercial.length} news articles and ${evidence.patents.length} patents. The field is experiencing rapid acceleration, with key breakthroughs in ${techData.categories.slice(0, 2).join(' and ')} applications.`;
  
  return {
    summary,
    fullRead: sections,
    generatedBy: 'Template',
    model: 'template-based'
  };
}

/**
 * Extract companies from evidence
 */
function extractCompaniesFromEvidence(evidence) {
  const companies = new Set();
  
  evidence.commercial.forEach(news => {
    const title = news.title || '';
    const patterns = [
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:raises|announces|launches|secures)/i,
      /(?:from|by|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i
    ];
    
    patterns.forEach(pattern => {
      const match = title.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        if (company.length > 2 && company.length < 50) {
          companies.add(company);
        }
      }
    });
  });
  
  evidence.patents.forEach(patent => {
    if (patent.assignee && patent.assignee !== 'Unknown') {
      companies.add(patent.assignee);
    }
  });
  
  return Array.from(companies);
}

