"use client"

import { useEffect, useRef } from "react"

const dirtySources = new Set<symbol>()
const leaveMessage = "Hay cambios sin guardar. Si salís de esta página, se pierden."
let listening = false

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (dirtySources.size === 0) {
    return
  }

  event.preventDefault()
  event.returnValue = leaveMessage
}

function onClick(event: MouseEvent) {
  if (dirtySources.size === 0 || event.defaultPrevented) {
    return
  }

  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }

  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const anchor = target.closest("a")

  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return
  }

  const href = anchor.getAttribute("href")

  if (!href || href.startsWith("#")) {
    return
  }

  const next = new URL(anchor.href, window.location.href)
  const current = new URL(window.location.href)

  if (next.origin === current.origin && next.pathname === current.pathname && next.search === current.search) {
    return
  }

  if (!window.confirm(leaveMessage)) {
    event.preventDefault()
    event.stopPropagation()
  }
}

function onPopState() {
  if (dirtySources.size === 0) {
    return
  }

  if (!window.confirm(leaveMessage)) {
    history.go(1)
  }
}

function ensureLeaveWarning() {
  if (listening || typeof window === "undefined") {
    return
  }

  listening = true
  window.addEventListener("beforeunload", onBeforeUnload)
  window.addEventListener("popstate", onPopState)
  document.addEventListener("click", onClick, true)
}

export function useUnsavedChanges(dirty: boolean) {
  const id = useRef(Symbol("unsaved"))

  useEffect(() => {
    ensureLeaveWarning()
    const key = id.current

    if (dirty) {
      dirtySources.add(key)
    } else {
      dirtySources.delete(key)
    }

    return () => {
      dirtySources.delete(key)
    }
  }, [dirty])
}
