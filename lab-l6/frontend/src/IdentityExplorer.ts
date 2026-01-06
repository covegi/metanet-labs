import { IdentityClient, type DisplayableIdentity } from '@bsv/sdk'

const identityClient = new IdentityClient()

/**
 * Resolves a DisplayableIdentity by identity key.
 *
 * @param identityKey The identity key to resolve
 * @returns A DisplayableIdentity object if resolution succeeds
 */
export async function resolveIdentityByKey(identityKey: string): Promise<DisplayableIdentity | null> {
  console.log('[resolveIdentityByKey] Looking up identity key:', identityKey)

  try {
    const results = await identityClient.resolveByIdentityKey({ identityKey })
    console.log('[resolveIdentityByKey] Results:', results)
    return results.length > 0 ? results[0] : null
  } catch (err) {
    console.error('[resolveIdentityByKey] Failed to resolve by key:', err)
    return null
  }
}

/**
 * Searches for DisplayableIdentities based on a partial name/email/username/etc.
 *
 * @param searchTerm The attribute term to match against any identity fields
 * @returns An array of DisplayableIdentity matches
 */
export async function searchIdentities(searchTerm: string): Promise<DisplayableIdentity[]> {
  console.log('[searchIdentities] Searching with term:', searchTerm)

  try {
    const results = await identityClient.resolveByAttributes({ attributes: { any: searchTerm } })
    console.log('[searchIdentities] Raw results:', results)

    const lowercaseTerm = searchTerm.toLowerCase()

    const filtered = results.filter(res =>
      res.name?.toLowerCase().includes(lowercaseTerm)
      // || res.username?.toLowerCase().includes(lowercaseTerm)
      // || res.email?.toLowerCase().includes(lowercaseTerm)
    )
    const unique = Array.from(
      new Map(filtered.map(r => [r.identityKey, r])).values()
    )

    console.log('[searchIdentities] Filtered results:', unique)
    // TODO: Enhance search to filter on name, username, and email
    // - Filter results to match lowercaseTerm against res.name, res.username, and res.email
    // - Handle optional fields using ?. and .filter(Boolean) to exclude undefined/null
    // - Use .some() to check if any field includes lowercaseTerm
    // - Maintain deduplication by identityKey in the unique array
    return unique
  } catch (err) {
    console.error('[searchIdentities] Failed to search identities:', err)
    return []
  }
}