const colors = [
  '#fe9aaa',
  '#fea741',
  '#d19d3a',
  '#f7f58c',
  '#c1fc40',
  '#2dfe50',
  '#34feaf',
  '#65ffea',
  '#90c7fc',
  '#5c86e1',
  '#97abfb',
  '#d975e2',
  '#e55ca2',
  '#fe3e40',
  '#f76f23',
  '#9f7752',
  '#fff054',
  '#8dff79',
  '#42c52e',
  '#11c2b2',
  '#28e9fd',
  '#1aa6eb',
  '#5c86e1',
  '#8e74e2',
  '#ba81c7',
  '#fe41d1',
  '#e26f64',
  '#fea67e',
  '#d6b27f',
  '#eeffb7',
  '#d6e6a6',
  '#bfd383',
  '#a4c99a',
  '#d9fde5',
  '#d2f3f9',
  '#c2c9e6',
  '#d3c4e5',
  '#b5a1e4',
  '#b3b3b3',
  '#cb9b96',
  '#bb8862',
  '#9f8a75',
  '#c3be78',
  '#a9c12f',
  '#84b45d',
  '#93c7c0',
  '#a5bbc9',
  '#8facc5',
  '#8d9ccd',
  '#ae9fbb',
  '#c6a9c4',
  '#bf7a9c',
  '#838383',
  '#b53637',
  '#ae5437',
  '#775345',
  '#dec633',
  '#899b31',
  '#57a53f',
  '#139f91',
  '#256686',
  '#1a3096',
  '#3155a4',
  '#6751ae',
  '#a752af',
  '#ce3571',
  '#3f3f3f',
]

/**
 * Return a new array with the colors randomized (Fisher–Yates).
 * Does not mutate the original `colors` array.
 */
export const getRandomizedColors = () => {
  const result = colors.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export const getRandomizedLightColors = () => {
  return colors.filter((hex) => {
    const classification = classifyBackground(hex)
    return (
      classification.verdict === 'either' || classification.verdict === 'black'
    )
  })
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}
function srgbToLinear(value: number) {
  const v = value / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const R = srgbToLinear(r)
  const G = srgbToLinear(g)
  const B = srgbToLinear(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}
const BLACK_LUMINANCE = 0
const WHITE_LUMINANCE = 1
function contrastRatio(bgLum: number, textLum: number) {
  const lighter = Math.max(bgLum, textLum)
  const darker = Math.min(bgLum, textLum)
  return (lighter + 0.05) / (darker + 0.05)
}
const MIN_CONTRAST = 4.5
function classifyBackground(hex: string) {
  const rgb = hexToRgb(hex)
  const bgLum = luminance(rgb)

  const contrastWithBlack = contrastRatio(bgLum, BLACK_LUMINANCE)
  const contrastWithWhite = contrastRatio(bgLum, WHITE_LUMINANCE)

  return {
    hex,
    contrastWithBlack: contrastWithBlack.toFixed(2),
    contrastWithWhite: contrastWithWhite.toFixed(2),
    blackOK: contrastWithBlack >= 4.5,
    whiteOK: contrastWithWhite >= 4.5,
    verdict:
      contrastWithBlack >= 4.5 && contrastWithWhite >= 4.5
        ? 'either'
        : contrastWithBlack >= 4.5
        ? 'black'
        : contrastWithWhite >= 4.5
        ? 'white'
        : 'neither',
  }
}
export default colors
