import { getPreferenceValues } from '@raycast/api'
import { showFailureToast, useLocalStorage, usePromise } from '@raycast/utils'
import { useEffect, useMemo } from 'react'

import { REKA_COMPONENTS_GITHUB_URL } from '../constants'
import { parseComponentMetaFromGhJson } from '../utils'
import { Component } from './use-reka-components'

export interface ComponentMeta extends Component {
  description: string
  anatomy: string
  features: string[]
}

export function useRekaComponentMeta(component: Component) {
  const {
    setValue: setCachedComponentMeta,
    value: cachedComponentMeta,
    isLoading: isLocalStorageLoading,
  } = useLocalStorage<ComponentMeta>(`reka-ui-component-meta:${component.slug}`)
  const prefs = getPreferenceValues<Preferences>()

  const { isLoading: isPromiseLoading, revalidate } = usePromise(async () => {
    if (isLocalStorageLoading) return

    if (cachedComponentMeta) return cachedComponentMeta

    const res = await fetch(`${REKA_COMPONENTS_GITHUB_URL}/${component.slug}`, {
      headers: {
        ...(prefs.ghPat ? { Authorization: `Bearer ${prefs.ghPat}` } : {}),
        'X-GitHub-Api-Version': '2026-03-10',
      },
      cache: 'force-cache',
    })
    if (!res.ok) {
      await showFailureToast(res.statusText, {
        message: res.statusText,
        title: 'Failed to fetch component metadata',
      })
      return
    }

    const json = await res.json()

    const meta = parseComponentMetaFromGhJson(json)

    await setCachedComponentMeta({
      ...component,
      ...meta,
    })
  })

  useEffect(() => {
    if (!isLocalStorageLoading) revalidate()
  }, [isLocalStorageLoading, revalidate])

  const isLoading = useMemo(
    () => isPromiseLoading || isLocalStorageLoading,
    [isPromiseLoading, isLocalStorageLoading],
  )

  return {
    componentMeta: cachedComponentMeta,
    isLoading,
  }
}
