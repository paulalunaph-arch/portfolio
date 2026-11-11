const imagePattern = /\.(jpe?g|png|webp|tiff?)$/i

export function isImageFile(file: File) {
  return file.type.startsWith("image/") || imagePattern.test(file.name)
}

export function filesFromList(list: FileList | null) {
  return Array.from(list ?? []).filter(isImageFile)
}

function readEntries(reader: FileSystemDirectoryReader) {
  return new Promise<FileSystemEntry[]>((resolve, reject) => {
    const all: FileSystemEntry[] = []

    const read = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all)
          return
        }

        all.push(...batch)
        read()
      }, reject)
    }

    read()
  })
}

function fileFromEntry(entry: FileSystemFileEntry) {
  return new Promise<File>((resolve, reject) => {
    entry.file(resolve, reject)
  })
}

async function collectEntry(entry: FileSystemEntry, files: File[]) {
  if (entry.isFile) {
    files.push(await fileFromEntry(entry as FileSystemFileEntry))
    return
  }

  if (!entry.isDirectory) {
    return
  }

  const children = await readEntries((entry as FileSystemDirectoryEntry).createReader())

  for (const child of children) {
    await collectEntry(child, files)
  }
}

export async function filesFromDrop(data: DataTransfer) {
  const entries = Array.from(data.items)
    .map((item) => item.webkitGetAsEntry())
    .filter((entry): entry is FileSystemEntry => Boolean(entry))

  if (entries.length === 0) {
    return filesFromList(data.files)
  }

  const files: File[] = []

  for (const entry of entries) {
    await collectEntry(entry, files)
  }

  return files.filter(isImageFile)
}
