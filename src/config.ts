import * as fs from 'fs';
import * as path from 'path';
import type { Config } from './types.js';

const DEFAULTS: Config = {
  namingConvention: ['pascal'],
};

// read config.json
function loadConfigFile(projectRoot: string): Partial<Config> {
  const configPath = path.join(projectRoot, 'config.json');

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // config.json doesn't exist
    return {};
  }
}

// read commandline
function loadCliArgs(): Partial<Config> {
  const args = process.argv.slice(3); // [2] PROJECT_ROOT, [3]arguments
  const config: Partial<Config> = {};

  const namingIndex = args.indexOf('--naming-convention');
  const namingValue = args[namingIndex + 1];
  if (namingIndex !== -1 && namingValue) {
    config.namingConvention = namingValue.split(',');
  }

  return config;
}

// priority: CLI > config.json > defaults
export function loadConfig(projectRoot: string): Config {
  const fileConfig = loadConfigFile(projectRoot);
  const cliConfig = loadCliArgs();

  return {
    ...DEFAULTS,
    ...fileConfig,
    ...cliConfig,
  };
}
