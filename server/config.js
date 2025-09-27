import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('4000'),
  COC_API_KEY: z.string().min(1, 'COC_API_KEY is required'),
  CLAN_TAG: z.string().min(1, 'CLAN_TAG is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  POLL_INTERVAL: z.string().default('60000'), // 1 minute in milliseconds
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return {
      ...env,
      PORT: parseInt(env.PORT, 10),
      POLL_INTERVAL: parseInt(env.POLL_INTERVAL, 10),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `${issue.path}: ${issue.message}`).join('\n');
      throw new Error(`Environment validation failed:\n${issues}`);
    }
    throw error;
  }
}