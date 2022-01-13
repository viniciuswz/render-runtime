export const preset = 'ts-jest'
export const transform = {
  '^.+\\.tsx?$': 'babel-jest',
}

export const transformIgnorePatterns = [
  '[/\\\\]node_modules[/\\\\](?!lodash-es/).+\\.js$',
]
