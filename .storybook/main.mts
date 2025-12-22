import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import type { StorybookConfig } from '@storybook/react-vite'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const aliasFromSrc = (segment: string) => resolve(rootDir, 'src', segment)

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  core: { disableTelemetry: true },
  viteFinal: async (config) => {
    config.resolve ??= {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@components': aliasFromSrc('components'),
      '@hooks': aliasFromSrc('hooks'),
      '@pages': aliasFromSrc('pages'),
      '@services': aliasFromSrc('services'),
      '@/types': aliasFromSrc('types'),
      '@utils': aliasFromSrc('utils'),
      '@i18n': aliasFromSrc('i18n'),
    }
    return config
  },
}

export default config

