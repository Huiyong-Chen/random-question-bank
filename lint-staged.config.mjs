const config = {
  '*.{js,jsx,ts,tsx,mjs,mts}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,css,scss}': ['prettier --write'],
}

export default config

