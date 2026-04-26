import { parse } from 'ultramatter'

import { REKA_COMPONENTS_DOCS_BASE_URL } from './constants'

export const parseComponentNameFromFilename = (filename: string) =>
  filename
    .replace('.md', '')
    .split('-')
    .map(w => w.charAt(0).toLocaleUpperCase() + w.slice(1))
    .join(' ')

export const getComponentUrlFromFilename = (filename: string) => {
  const slug = filename.replace('.md', '')

  return REKA_COMPONENTS_DOCS_BASE_URL + `/${slug}`
}

export const parseComponentMetaFromGhJson = (json: object) => {
  const base64 = (json as Record<string, any>).content
  const base64WithoutNewLines = base64.replaceAll('\\n', '')
  const markdown = Buffer.from(base64WithoutNewLines, 'base64').toString()
  const { frontmatter } = parse(markdown)

  const anatomy = parseAnatomyBlock(markdown)
  const features = parseFeatures(markdown)
  const description = frontmatter?.description ?? 'No description'
  return {
    description,
    anatomy,
    features,
  }
}

export function parseAnatomyBlock(markdown: string) {
  const markdownNewLines = markdown.split(/\r?\n/)
  let inside = false
  let startingAnatomy = false
  const contents: string[] = []
  for (let i = 0; i < markdownNewLines.length; i++) {
    const chunk = markdownNewLines[i]
    if (!chunk) continue

    if (chunk.includes('# Anatomy')) {
      startingAnatomy = true
      continue
    }

    if (startingAnatomy && chunk.includes('<template>')) {
      inside = true
      contents.push(chunk)
      continue
    }

    if (inside && chunk.includes('</template>')) {
      contents.push(chunk)
      break
    }

    if (inside) {
      contents.push(chunk)
      continue
    }
  }

  return contents.join('\n')
}

export function parseFeatures(markdown: string) {
  const markdownNewLines = markdown.split(/\r?\n/)

  let inside = false
  let contents: string[] = []
  for (let i = 0; i < markdownNewLines.length; i++) {
    const chunk = markdownNewLines[i]
    if (!chunk) continue

    if (chunk.includes(':features="[')) {
      // case for 1 or 2 features
      if (chunk.endsWith(']"') || chunk.endsWith('>')) {
        const split = chunk.split(/:features="\[(.*?)\]"/)
        const featuresString = removeHtmlTags(split[1]?.replaceAll("'", '').replaceAll('"', ''))
        if (!featuresString) break

        contents = featuresString.split(',')
        break
      }

      inside = true
      continue
    }

    if (inside && chunk.includes(']')) {
      break
    }

    if (inside) {
      contents.push(removeHtmlTags(chunk.trim().replaceAll("'", '').replaceAll(',', '')))
      continue
    }
  }

  function removeHtmlTags(string: string) {
    return string.replaceAll(/<.+?>/g, '')
  }

  return contents
}
