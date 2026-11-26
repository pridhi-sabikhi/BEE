const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const COMMAND_PROMPTS = {
  summarize: 'Summarize the following text concisely:',
  fix_grammar: 'Fix the grammar and spelling in the following text, returning only the corrected text:',
  translate: 'Translate the following text to English (if already English, translate to Spanish):',
  explain: 'Explain the following text in simple terms:',
  expand: 'Expand on the following text with more detail and depth:',
  make_shorter: 'Make the following text shorter while keeping the key meaning:',
};

const DOCUMENT_TEMPLATES = {
  'meeting-notes': {
    title: 'Meeting Notes',
    sections: [
      'Meeting details',
      'Attendees',
      'Main agenda',
      'Discussion notes',
      'Important highlights',
      'Decisions',
      'Action items',
      'Next steps',
    ],
  },
  'product-specs': {
    title: 'Product Specs',
    sections: [
      'Product overview',
      'What is the product?',
      'Problem statement',
      'Target users',
      'Product benefits',
      'Key features',
      'Requirements',
      'Success metrics',
      'Dependencies and risks',
    ],
  },
  'project-proposal': {
    title: 'Project Proposal',
    sections: [
      'Executive summary',
      'Problem statement',
      'Goals and objectives',
      'Proposed solution',
      'Scope and deliverables',
      'Timeline and milestones',
      'Team and responsibilities',
      'Budget and resources',
      'Risks and mitigations',
      'Success metrics',
      'Approval',
    ],
  },
};

const parseTemplateResponse = (responseText, expectedSections) => {
  let text = responseText.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  const parsed = JSON.parse(text);
  const document = parsed.type === 'doc' ? parsed : parsed.doc;
  if (document?.type !== 'doc' || !Array.isArray(document.content)) {
    throw new Error('Gemini returned an invalid document template');
  }

  const headings = new Set(
    document.content
      .filter((node) => node?.type === 'heading' && Array.isArray(node.content))
      .map((node) => node.content.map((part) => part.text || '').join('').trim())
  );
  if (!expectedSections.every((section) => headings.has(section))) {
    throw new Error('Gemini returned an incomplete document template');
  }

  return document;
};

exports.runCommand = async (req, res) => {
  try {
    const { selectedText, command } = req.body;

    if (!selectedText || !command) {
      return res.status(400).json({ message: 'selectedText and command are required' });
    }

    const prompt = COMMAND_PROMPTS[command];
    if (!prompt) {
      return res.status(400).json({ message: 'Invalid command' });
    }

    const result = await model.generateContent(
      `You are a helpful writing assistant.\n\n${prompt}\n\n${selectedText}`
    );

    const response = result.response.text();
    res.json({ result: response });
  } catch (err) {
    console.error('AI command error:', err.message);
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return res.status(429).json({ message: 'AI rate limit reached. Please wait a minute and try again.' });
    }
    res.status(500).json({ message: 'AI processing failed: ' + err.message });
  }
};

exports.generateTemplate = async (req, res) => {
  try {
    const template = DOCUMENT_TEMPLATES[req.body?.template];
    if (!template) {
      return res.status(400).json({ message: 'Invalid document template' });
    }

    const sections = template.sections
      .map((section) => `- ${section}`)
      .join('\n');
    const result = await model.generateContent(
      `Create a fill-in document template titled "${template.title}" as valid TipTap JSON.
Return one JSON object whose root has "type": "doc" and a "content" array. Do not wrap the document in a "doc" property. Use heading nodes with attrs.level and paragraph nodes containing short bracketed prompts that tell the user what details to add. Do not invent project facts or fill in actual answers. Include every section below as a heading, using the exact heading text and in the same order:
${sections}
Use one concise placeholder paragraph under each section. Return no markdown fences or explanation.`
    );

    const content = parseTemplateResponse(result.response.text(), template.sections);
    res.json({ title: template.title, content });
  } catch (err) {
    console.error('AI template generation error:', err.message);
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return res.status(429).json({ message: 'AI rate limit reached. Please wait a minute and try again.' });
    }
    res.status(500).json({ message: 'AI template generation failed. Please try again.' });
  }
};

exports.generateOutline = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const result = await model.generateContent(
      `You are a helpful writing assistant. Generate a document outline as valid TipTap JSON. The JSON should have type "doc" at root with content array containing heading and paragraph nodes. Use heading nodes with attrs.level for H1/H2/H3 and paragraph nodes with text content for descriptions.\n\nGenerate a detailed document outline for the topic: "${topic}". Return ONLY valid JSON in TipTap format, no markdown code fences, no explanation.`
    );

    let text = result.response.text().trim();
    // Strip code fences if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(text);
    res.json({ result: parsed });
  } catch (err) {
    console.error('AI outline error:', err.message);
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return res.status(429).json({ message: 'AI rate limit reached. Please wait a minute and try again.' });
    }
    res.status(500).json({ message: 'AI outline generation failed' });
  }
};