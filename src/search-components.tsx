import { ActionPanel, Action, List } from '@raycast/api'

import { ComponentDetails } from './component-details'
import { useRekaComponents } from './hooks/use-reka-components'

export default function Command() {
  const { components } = useRekaComponents()

  return (
    <List searchBarPlaceholder="Search components..." isShowingDetail>
      {components?.map(component => (
        <List.Item
          key={component.name}
          title={component.name}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={component.docsUrl} />
              <Action.CopyToClipboard content={component.docsUrl} />
            </ActionPanel>
          }
          detail={<ComponentDetails component={component} />}
        />
      ))}
    </List>
  )
}
