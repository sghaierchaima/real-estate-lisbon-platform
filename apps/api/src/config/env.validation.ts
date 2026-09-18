export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const requiredVariables = [
    'DATABASE_URL',
    'JWT_SECRET',
  ] as const;

  for (const key of requiredVariables) {
    const value = config[key];

    if (
      typeof value !== 'string' ||
      value.trim().length === 0
    ) {
      throw new Error(
        `Missing required environment variable: ${key}`,
      );
    }
  }

  const jwtSecret = config.JWT_SECRET as string;

  if (jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET must contain at least 32 characters.',
    );
  }

  return config;
}