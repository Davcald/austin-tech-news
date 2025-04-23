import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ARTICLES_DIR = path.join(__dirname, '../src/content/blog');

async function generateArticle() {
  const response = await openai.chat.completions.create({
    model: "o4-mini",
    messages: [
      {
        role: "system",
        content: "You are a tech journalist writing about the Austin, Texas technology scene. Write an engaging, factual article about recent tech developments, startups, or tech culture in Austin. Include a title, date, and article content. Format the response in markdown."
      },
      {
        role: "user",
        content: "Generate a tech article about Austin."
      }
    ],
    temperature: 0.7,
  });

  const article = response.choices[0].message.content;
  return article;
}

async function saveArticle(content) {
  const titleMatch = content.match(/^#\s+(.+)/m);
  if (!titleMatch) throw new Error('No title found in article');
  
  const title = titleMatch[1];
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const date = new Date().toISOString().split('T')[0];
  const fileName = `${date}-${slug}.md`;
  
  // Add frontmatter
  const articleWithFrontmatter = `---
title: "${title}"
pubDate: ${date}
---

${content}`;

  await fs.writeFile(
    path.join(ARTICLES_DIR, fileName),
    articleWithFrontmatter
  );
}

async function main() {
  try {
    // Generate two articles
    for (let i = 0; i < 2; i++) {
      const article = await generateArticle();
      await saveArticle(article);
      console.log(`Article ${i + 1} generated successfully`);
    }
  } catch (error) {
    console.error('Error generating articles:', error);
    process.exit(1);
  }
}

main(); 
