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
  /**
   * 关闭推理模型的「思考」阶段。
   *
   * 默认开启，因为本项目配置的 mimo-v2.5 是推理模型：不关的话它会先写两千多字的
   * 思维链再作答，一句话的改写要 26 秒 —— 挂在结算响应上完全不可用。
   * 关闭后实测 0.7~1.5 秒。
   *
   * 走 `chat_template_kwargs`（vLLM 系约定）。别的服务商可能不认这个字段，
   * 所以请求 400 时会自动摘掉它重试一次 —— 不认识就退回默认行为，不会因此报错。
   */
  OPENAI_DISABLE_THINKING: z
    .string()
    .optional()
    .transform((v) => (v ?? 'true') === 'true'),
  FRONTEND_ORIGIN: z.string().optional().transform((v) => v ?? 'http://localhost:5173'),
})

export const env = EnvSchema.parse(process.env)
