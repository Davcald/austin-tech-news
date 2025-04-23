import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, '../src/content/blog');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const generateArticle = async () => {
  const prompt = `You are a tech journalist writing about the Austin, Texas technology scene. Write an engaging, factual article about recent tech developments, startups, or tech culture in Austin. Include a title, date, and article content. Format the response in markdown.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct', // You can try others like "google/gemma-7b-it"
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const json = await response.json();

  if (!json.choices || !json.choices[0]?.message?.content) {
    throw new Error('No content returned from OpenRouter');
  }

  return json.choices[0].message.content;
};

const saveArticle = async (content) => {
  const titleMatch = content.match(/^#\s+(.+)/m);
  if (!titleMatch) throw new Error('No title found in article');

  const title = titleMatch[1];
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const date = new Date().toISOString().split('T')[0];
  const fileName = `${date}-${slug}.md`;

  const articleWithFrontmatter = `---
title: "${title}"
pubDate: ${date}
---

${content}`;

  await fs.writeFile(path.join(ARTICLES_DIR, fileName), articleWithFrontmatter);
};

const main = async () => {
  try {
    for (let i = 0; i < 2; i++) {
      const article = await generateArticle();
      await saveArticle(article);
      console.log(`✅ Article ${i + 1} saved.`);
    }
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

main();
