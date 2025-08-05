import "./ActionMenu.css"

interface ActionMenuProps {
  onClose: () => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onHistory: () => void
  onExport: (name: string) => void
  onImport: () => void
  canUndo: boolean
  canRedo: boolean
}

interface ActionMenuElement extends HTMLDivElement {
  cleanup: () => void
}

export function ActionMenu({
  onClose,
  onUndo,
  onRedo,
  onClear,
  onHistory,
  onExport,
  onImport,
  canUndo,
  canRedo,
}: ActionMenuProps): ActionMenuElement {
  const container = document.createElement("div") as ActionMenuElement
  container.className = "action-menu"

  // Prevent clicks on the menu from bubbling to the overlay
  container.addEventListener("click", (e) => {
    e.stopPropagation()
  })

  const menuItems = [
    { label: "Undo", action: onUndo, disabled: !canUndo },
    { label: "Redo", action: onRedo, disabled: !canRedo },
    { label: "Clear Canvas", action: onClear, disabled: false },
    { label: "History", action: onHistory, disabled: false },
    { label: "Import Image", action: onImport, disabled: false },
    {
      label: "Export Drawing",
      action: () => {
        const title = prompt("What would you like to name the image?", "My Drawing")
        if (title) {
          const filename = title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
          onExport(`${filename || "drawing"}.png`)
        }
      },
      disabled: false,
    },
  ]

  menuItems.forEach((item) => {
    const menuItem = document.createElement("button")
    menuItem.className = `menu-item ${item.disabled ? "disabled" : ""}`
    menuItem.textContent = item.label
    menuItem.disabled = item.disabled
    menuItem.onclick = () => {
      if (!item.disabled) {
        item.action()
        onClose()
      }
    }
    container.appendChild(menuItem)
  })

  // Add cleanup function
  container.cleanup = () => {
    // No event listeners to clean up for this component
  }

  return container
}
