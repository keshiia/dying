import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),
  ALLOW_TEACHER_SELF_REGISTER: z
    .string()
    .optional()
    .transform((v) => (v ?? 'true') === 'true'),
  OPENAI_API_KEY: z.string().optional().transform((v) => v ?? ''),
  OPENAI_MODEL: z.string().optional().transform((v) => v ?? 'deepseek-v4-flash'),
  OPENAI_BASE_URL: z.string().optional().transform((v) => v ?? ''),
  FRONTEND_ORIGIN: z.string().optional().transform((v) => v ?? 'http://localhost:5173'),
})

export const env = EnvSchema.parse(process.env)
