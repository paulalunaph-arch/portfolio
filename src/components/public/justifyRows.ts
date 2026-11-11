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
    return Math.round(Math.min(380, Math.max(220, width * 0.42)))
  }

  return Math.round(Math.min(680, Math.max(300, width * 0.32)))
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

  const groups: JustifiedItem<T>[][] = []
  let row: JustifiedItem<T>[] = []
  const comfortable = targetHeight * 1.45

  const close = () => {
    if (row.length > 0) {
      groups.push(row)
    }

    row = []
  }

  for (const photo of photos) {
    const entry = { item: photo, aspect: aspectOf(photo) }
    const next = [...row, entry]
    const nextHeight = heightFor(next, containerWidth, gap)

    if (row.length >= 2) {
      const currentHeight = heightFor(row, containerWidth, gap)

      if (currentHeight <= comfortable && nextHeight < targetHeight * 0.78) {
        close()
        row = [entry]
        continue
      }
    }

    row = next

    if (row.length >= 2 && nextHeight <= targetHeight) {
      close()
    }
  }

  if (row.length > 0) {
    groups.push(row)
  }

  if (groups.length >= 2) {
    const last = groups[groups.length - 1]
    const previous = groups[groups.length - 2]

    if (last.length === 1 && previous.length >= 3) {
      const moved = previous.pop()

      if (moved) {
        last.unshift(moved)
      }
    }
  }

  return groups.map((items) => ({
    items,
    height: heightFor(items, containerWidth, gap),
    fill: true,
  }))
}
