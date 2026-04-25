'use client'

import { useMemo, useSyncExternalStore } from 'react'
import ProfileCreateForm, { type CreatedProfile } from './ProfileCreateForm'

const storageKey = 'watchthis-current-profile'
const profileChangeEvent = 'watchthis-profile-change'

function readCurrentProfileSnapshot() {
  return window.localStorage.getItem(storageKey)
}

function subscribeToProfileChanges(onStoreChange: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === storageKey) {
      onStoreChange()
    }
  }

  window.addEventListener('storage', handleStorageChange)
  window.addEventListener(profileChangeEvent, onStoreChange)

  return () => {
    window.removeEventListener('storage', handleStorageChange)
    window.removeEventListener(profileChangeEvent, onStoreChange)
  }
}

export default function WatchThisApp() {
  const profileSnapshot = useSyncExternalStore(
    subscribeToProfileChanges,
    readCurrentProfileSnapshot,
    () => null,
  )
  const profile = useMemo(() => {
    if (!profileSnapshot) {
      return null
    }

    try {
      return JSON.parse(profileSnapshot) as CreatedProfile
    } catch {
      window.localStorage.removeItem(storageKey)
      return null
    }
  }, [profileSnapshot])

  const handleProfileCreated = (createdProfile: CreatedProfile) => {
    window.localStorage.setItem(storageKey, JSON.stringify(createdProfile))
    window.dispatchEvent(new Event(profileChangeEvent))
  }

  const handleProfileReset = () => {
    window.localStorage.removeItem(storageKey)
    window.dispatchEvent(new Event(profileChangeEvent))
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
        <nav className="w-full border-b border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
            <span className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
              WatchThis
            </span>
          </div>
        </nav>

        <main className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-5xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_380px]">
          <section className="max-w-2xl">
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              Kisisel izleme alani
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
              Once hesabini olustur, sonra WatchThis senin olsun.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Oneriler, izleme listesi ve arama deneyimi kullaniciya gore sekillenecek. Bu yuzden uygulamaya girmeden
              once temel profil bilgilerini aliyoruz.
            </p>
          </section>

          <section className="w-full">
            <ProfileCreateForm onProfileCreated={handleProfileCreated} />
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <nav className="w-full border-b border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <span className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
            WatchThis
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-zinc-700 dark:text-zinc-200 sm:inline">
              {profile.username}
            </span>
            <button
              type="button"
              onClick={handleProfileReset}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Profil degistir
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8">
        <section>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Hos geldin, {profile.username}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Sana gore izleme listesi
          </h1>
        </section>

        <div className="flex w-full items-center gap-2">
          <input
            type="text"
            placeholder="Film veya dizi ara..."
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700">
            Ara
          </button>
        </div>

        <section className="w-full">
          <h2 className="mb-3 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
            To be watch
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex w-48 flex-col items-center rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
              <div className="mb-2 h-32 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
              <span className="font-medium text-zinc-900 dark:text-zinc-50">Interstellar</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Sci-Fi</span>
            </div>
            <div className="flex w-48 flex-col items-center rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
              <div className="mb-2 h-32 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
              <span className="font-medium text-zinc-900 dark:text-zinc-50">Dark</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Thriller</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
