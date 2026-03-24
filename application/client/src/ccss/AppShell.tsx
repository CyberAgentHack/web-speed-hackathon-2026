import { useState } from 'react'

export function AppShell() {
  const [_authModalOpen, _setAuthModalOpen] = useState(false)
  const [_newPostModalOpen, _setNewPostModalOpen] = useState(false)

  return (
    <div className="relative z-0 flex justify-center font-sans">
      <input id="ccss:app-shell:app-shell:auth-modal-open" className="ccss-state-input" type="checkbox" />
      <input id="ccss:app-shell:app-shell:new-post-modal-open" className="ccss-state-input" type="checkbox" />
      <div className="bg-cax-surface text-cax-text flex min-h-screen max-w-full">
        <div className="relative z-10">
          <nav className="border-cax-border bg-cax-surface fixed right-0 bottom-0 left-0 z-10 h-12 border-t lg:relative lg:h-full lg:w-48 lg:border-t-0 lg:border-r">
          </nav>
        </div>
        <main className="relative z-0 w-screen max-w-screen-sm min-w-0 shrink pb-12 lg:pb-0">
        </main>
      </div>
    </div>
  )
}
