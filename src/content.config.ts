import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const ipas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ipas' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    stage: z.string(),
    stageOrder: z.number(),
    courseId: z.string(),
    summary: z.string(),
  }),
});

export const collections = { ipas };
