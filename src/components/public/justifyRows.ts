export type JustifiedItem<T> = {
  item: T
  aspect: number
}

export type JustifiedRow<T> = {
  items: JustifiedItem<T>[]
  height: number
  fill: boolean
}

function aspectOf(photo: { width: number; height: number }) {
  if (photo.width <= 0 || photo.height <= 0) {
    return 1
  }

  return photo.width / photo.height
}

function heightFor(items: JustifiedItem<unknown>[], containerWidth: number, gap: number) {
  const sum = items.reduce((total, entry) => total + entry.aspect, 0)
  const gaps = gap * Math.max(0, items.length - 1)

  return (containerWidth - gaps) / Math.max(sum, 0.01)
}

export function rowGap(width: number) {
  return width >= 1024 ? 22 : 14
}

export function rowTarget(width: number) {
  if (width < 1024) {
    return Math.round(Math.min(340, Math.max(240, width * 0.4)))
  }

  return Math.round(Math.min(420, Math.max(300, width * 0.3)))
}

export function justifyRows<T extends { width: number; height: number }>(
  photos: T[],
  containerWidth: number,
  targetHeight: number,
  gap: number,
): JustifiedRow<T>[] {
  if (containerWidth <= 0 || photos.length === 0) {
    return []
  }

  if (containerWidth < 640) {
    return photos.map((photo) => {
      const aspect = aspectOf(photo)

      return {
        items: [{ item: photo, aspect }],
        height: containerWidth / aspect,
        fill: true,
      }
    })
  }

  const rows: JustifiedRow<T>[] = []
  let row: JustifiedItem<T>[] = []
  const comfortable = targetHeight * 1.35

  const commit = (items: JustifiedItem<T>[], fill: boolean) => {
    const filled = heightFor(items, containerWidth, gap)
    rows.push({
      items,
      height: fill ? filled : Math.min(targetHeight, filled),
      fill,
    })
  }

  for (const photo of photos) {
    const next: JustifiedItem<T>[] = [...row, { item: photo, aspect: aspectOf(photo) }]
    const nextHeight = heightFor(next, containerWidth, gap)

    if (row.length >= 2) {
      const currentHeight = heightFor(row, containerWidth, gap)

      if (currentHeight <= comfortable && nextHeight < targetHeight * 0.92) {
        commit(row, true)
        row = [{ item: photo, aspect: aspectOf(photo) }]
        continue
      }
    }

    row = next

    if (nextHeight <= targetHeight && row.length >= 2) {
      commit(row, true)
      row = []
    }
  }

  if (row.length > 0) {
    const filled = heightFor(row, containerWidth, gap)
    const loneLandscape = row.length === 1 && row[0].aspect >= 1
    const limit = loneLandscape ? targetHeight * 1.85 : comfortable
    commit(row, filled <= limit)
  }

  return rows
}
