'use client'

import Image from 'next/image'
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { get, ref, set } from 'firebase/database'
import ProfileCreateForm, {
  type AuthActionResult,
  type LoginPayload,
  type SignUpPayload,
} from './ProfileCreateForm'
import ContentSearchPanel, { type SearchResultItem } from './ContentSearchPanel'
import { auth, db, isFirebaseConfigured } from '@/lib/firebase'

type MoviePreferences = {
  genres: string[]
  formats: string[]
  moods: string[]
  notes: string
}

type WatchlistItem = {
  id: string
  sourceId: number
  title: string
  mediaType: 'movie' | 'tv'
  overview: string
  posterPath: string | null
  voteAverage: number
  releaseDate: string
}

const genreOptions = ['Aksiyon', 'Bilim kurgu', 'Komedi', 'Dram', 'Korku', 'Romantik', 'Animasyon', 'Belgesel']
const formatOptions = ['Film', 'Dizi', 'Mini dizi', 'Anime']
const moodOptions = ['Rahat ve eglenceli', 'Dusundurucu', 'Heyecanli', 'Duygusal', 'Karanlik ve gerilimli']
const PREFERENCES_LOAD_TIMEOUT_MS = 8000
const PREFERENCES_SAVE_TIMEOUT_MS = 8000

function getPreferenceStorageKey(userId: string) {
  return `watchthis:onboarding:${userId}`
}

function getWatchlistStorageKey(userId: string) {
  return `watchthis:watchlist:${userId}`
}

function readStoredWatchlist(userId: string): WatchlistItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  const storedValue = window.localStorage.getItem(getWatchlistStorageKey(userId))
  if (!storedValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<WatchlistItem>[]

    return Array.isArray(parsedValue)
      ? parsedValue
        .filter((item) => typeof item.title === 'string' && item.title.trim().length > 0)
        .map((item) => ({
          id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
          sourceId: typeof item.sourceId === 'number' ? item.sourceId : 0,
          title: item.title?.trim() ?? '',
          mediaType: item.mediaType === 'tv' ? 'tv' : 'movie',
          overview: typeof item.overview === 'string' ? item.overview : '',
          posterPath: typeof item.posterPath === 'string' ? item.posterPath : null,
          voteAverage: typeof item.voteAverage === 'number' ? item.voteAverage : 0,
          releaseDate: typeof item.releaseDate === 'string' ? item.releaseDate : '',
        }))
      : []
  } catch {
    return []
  }
}

function getPreferenceDatabasePath(userId: string) {
  return `users/${userId}/preferences`
}

function getWatchlistDatabasePath(userId: string) {
  return `users/${userId}/watchlist`
}

function normalizePreferences(preferences: Partial<MoviePreferences> | null | undefined): MoviePreferences {
  return {
    genres: Array.isArray(preferences?.genres) ? preferences.genres : [],
    formats: Array.isArray(preferences?.formats) ? preferences.formats : ['Film'],
    moods: Array.isArray(preferences?.moods) ? preferences.moods : [],
    notes: typeof preferences?.notes === 'string' ? preferences.notes : '',
  }
}

function readStoredPreferences(userId: string): MoviePreferences | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedValue = window.localStorage.getItem(getPreferenceStorageKey(userId))
  if (!storedValue || storedValue === 'complete') {
    return null
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<MoviePreferences>

    return normalizePreferences(parsedValue)
  } catch {
    return null
  }
}

function isFirstAuthSession(user: User) {
  const createdAt = user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : 0
  const signedInAt = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).getTime() : 0

  if (!createdAt || !signedInAt) {
    return false
  }

  return Math.abs(createdAt - signedInAt) < 10000
}

function PreferenceQuestionsForm({
  profileName,
  initialPreferences,
  onCancel,
  onComplete,
  isSaving,
  saveError,
}: {
  profileName: string
  initialPreferences?: MoviePreferences | null
  onCancel?: () => void
  onComplete: (preferences: MoviePreferences) => Promise<void> | void
  isSaving?: boolean
  saveError?: string
}) {
  const [genres, setGenres] = useState<string[]>(initialPreferences?.genres ?? [])
  const [formats, setFormats] = useState<string[]>(initialPreferences?.formats ?? ['Film'])
  const [moods, setMoods] = useState<string[]>(initialPreferences?.moods ?? [])
  const [notes, setNotes] = useState(initialPreferences?.notes ?? '')
  const [message, setMessage] = useState('')

  const toggleOption = (
    value: string,
    setValues: Dispatch<SetStateAction<string[]>>,
  ) => {
    setValues((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
    setMessage('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (genres.length === 0) {
      setMessage('En az bir tur secmelisin.')
      return
    }

    if (moods.length === 0) {
      setMessage('En az bir izleme modu secmelisin.')
      return
    }

    await onComplete({
      genres,
      formats,
      moods,
      notes: notes.trim(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Ilk kurulum</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Izleme tercihlerin, {profileName}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Zevklerini istedigin zaman guncelleyebilirsin. Tercihlerin hesabina kaydedilir.
        </p>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Hangi tur filmleri seversin?
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {genreOptions.map((genre) => (
            <label
              key={genre}
              className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              <input
                type="checkbox"
                checked={genres.includes(genre)}
                onChange={() => toggleOption(genre, setGenres)}
                className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
              {genre}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5 grid gap-3">
        <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Daha cok ne izlersin?
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {formatOptions.map((format) => (
            <label
              key={format}
              className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              <input
                type="checkbox"
                checked={formats.includes(format)}
                onChange={() => toggleOption(format, setFormats)}
                className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
              {format}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5 grid gap-3">
        <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Genelde nasil bir sey ararsin?
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {moodOptions.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              <input
                type="checkbox"
                checked={moods.includes(option)}
                onChange={() => toggleOption(option, setMoods)}
                className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 grid gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Eklemek istedigin tercih var mi?
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ornek: cok uzun filmler olmasin, aileyle izlenebilir olsun..."
          rows={3}
          className="resize-none rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base font-normal text-zinc-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </label>

      {message ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
          {message}
        </p>
      ) : null}

      {saveError ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
          {saveError}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-lg bg-zinc-100 px-4 py-3 font-semibold text-zinc-800 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Vazgec
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          {isSaving ? 'Kaydediliyor...' : 'Tercihlerimi kaydet'}
        </button>
      </div>
    </form>
  )
}

function mapFirebaseAuthError(error: unknown) {
  const maybeErrorCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''

  switch (maybeErrorCode) {
    case 'auth/email-already-in-use':
      return 'Bu mail adresi zaten kullanimda.'
    case 'auth/invalid-email':
      return 'Mail adresi gecersiz gorunuyor.'
    case 'auth/weak-password':
      return 'Sifre cok zayif. Daha guclu bir sifre sec.'
    case 'auth/user-not-found':
      return 'Bu mail adresi ile kayitli bir hesap bulunamadi.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Mail veya sifre hatali.'
    case 'auth/too-many-requests':
      return 'Cok fazla deneme yapildi. Lutfen biraz sonra tekrar dene.'
    default:
      return 'Islem sirasinda bir hata olustu. Lutfen tekrar dene.'
  }
}

function AccountMenu({
  profileName,
  onProfile,
  onPreferences,
  onLogout,
}: {
  profileName: string
  onProfile: () => void
  onPreferences: () => void
  onLogout: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return
      }

      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const runMenuAction = (action: () => void) => {
    setIsOpen(false)
    action()
  }

  return (
    <div ref={menuRef} className="relative flex items-center gap-3">
      <span className="max-w-40 truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {profileName}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label="Hesap menusu"
        className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 transition hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        <span className="grid gap-1">
          <span className="block h-0.5 w-5 rounded bg-current" />
          <span className="block h-0.5 w-5 rounded bg-current" />
          <span className="block h-0.5 w-5 rounded bg-current" />
        </span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-10 mt-2 w-52 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{profileName}</p>
          </div>
          <button
            type="button"
            onClick={() => runMenuAction(onProfile)}
            className="w-full px-4 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Profilim
          </button>
          <button
            type="button"
            onClick={() => runMenuAction(onPreferences)}
            className="w-full px-4 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Tercihlerim
          </button>
          <button
            type="button"
            onClick={() => runMenuAction(onLogout)}
            className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            Cikis yap
          </button>
        </div>
      ) : null}
    </div>
  )
}

function TrailerModal({ trailerKey, onClose }: { trailerKey: string; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-black shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80"
          title="Kapat"
        >
          ✕
        </button>
        <iframe 
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`} 
          className="h-full w-full border-0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen 
        />
      </div>
    </div>
  )
}

function WatchlistPanel({
  items,
  onRemove,
  onPlayTrailer,
}: {
  items: WatchlistItem[]
  onRemove: (itemId: string) => void
  onPlayTrailer: (sourceId: number, mediaType: 'movie' | 'tv') => void
}) {
  return (
    <section className="w-full">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          Izlenecekler
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Arama sonuclarindan sectigin film ve diziler burada gorunur.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => {
            const posterUrl = item.posterPath ? `https://image.tmdb.org/t/p/w185${item.posterPath}` : null

            return (
              <div
                key={item.id}
                className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="h-24 w-16 shrink-0 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={`${item.title} afisi`}
                      width={185}
                      height={278}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                      Afis yok
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">{item.title}</p>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {item.mediaType === 'movie' ? 'Film' : 'Dizi'}
                    {item.releaseDate ? ` - ${item.releaseDate.slice(0, 4)}` : ''}
                    {item.voteAverage > 0 ? ` - ${item.voteAverage.toFixed(1)}/10` : ''}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                    {item.overview || 'Aciklama bulunamadi.'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => onPlayTrailer(item.sourceId, item.mediaType)}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                  >
                    Fragman
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    Sil
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Henuz izlenecek film veya dizi eklenmedi. Yukaridaki aramadan bir sonuc sec.
        </div>
      )}
    </section>
  )
}

function UserContentArea({ userId }: { userId: string }) {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>(() => readStoredWatchlist(userId))
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [isTrailerLoading, setIsTrailerLoading] = useState(false)
  const isInitialMount = useRef(true)
  const isHydrating = useRef(false)

  const handlePlayTrailer = async (sourceId: number, mediaType: 'movie' | 'tv') => {
    setIsTrailerLoading(true)
    try {
      const res = await fetch(`/api/trailer?id=${sourceId}&type=${mediaType}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.trailerKey) {
        setTrailerKey(data.trailerKey)
      } else {
        alert('Bu icerik icin fragman bulunamadi.')
      }
    } catch {
      alert('Fragman yuklenirken bir hata olustu.')
    } finally {
      setIsTrailerLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false
    const hydrateWatchlist = async () => {
      if (!db) return
      
      try {
        const watchlistRef = ref(db, getWatchlistDatabasePath(userId))
        const snapshot = await get(watchlistRef)
        
        if (isCancelled) return
        
        if (snapshot.exists()) {
          const data = snapshot.val() as Partial<WatchlistItem>[]
          if (Array.isArray(data)) {
            const parsed = data
              .filter((item) => typeof item.title === 'string' && item.title.trim().length > 0)
              .map((item): WatchlistItem => ({
                id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
                sourceId: typeof item.sourceId === 'number' ? item.sourceId : 0,
                title: item.title?.trim() ?? '',
                mediaType: item.mediaType === 'tv' ? 'tv' : 'movie',
                overview: typeof item.overview === 'string' ? item.overview : '',
                posterPath: typeof item.posterPath === 'string' ? item.posterPath : null,
                voteAverage: typeof item.voteAverage === 'number' ? item.voteAverage : 0,
                releaseDate: typeof item.releaseDate === 'string' ? item.releaseDate : '',
              }))
            
            isHydrating.current = true
            setWatchlistItems(parsed)
            window.localStorage.setItem(getWatchlistStorageKey(userId), JSON.stringify(parsed))
          }
        } else {
          const localItems = readStoredWatchlist(userId)
          if (localItems.length > 0) {
            set(watchlistRef, localItems).catch(console.error)
          }
        }
      } catch (err) {
        console.error('Watchlist could not be loaded from DB', err)
      }
    }
    
    void hydrateWatchlist()
    
    return () => {
      isCancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    if (isHydrating.current) {
      isHydrating.current = false
      return
    }

    window.localStorage.setItem(getWatchlistStorageKey(userId), JSON.stringify(watchlistItems))
    if (db) {
      const watchlistRef = ref(db, getWatchlistDatabasePath(userId))
      set(watchlistRef, watchlistItems).catch(console.error)
    }
  }, [watchlistItems, userId])

  const watchlistKeys = watchlistItems.map((item) => `${item.mediaType}-${item.sourceId}`)

  const addToWatchlist = (item: SearchResultItem) => {
    setWatchlistItems((current) => {
      const key = `${item.mediaType}-${item.id}`
      const alreadyExists = current.some((currentItem) => `${currentItem.mediaType}-${currentItem.sourceId}` === key)

      if (alreadyExists) {
        return current
      }

      return [
        ...current,
        {
          id: crypto.randomUUID(),
          sourceId: item.id,
          title: item.title,
          mediaType: item.mediaType,
          overview: item.overview,
          posterPath: item.posterPath,
          voteAverage: item.voteAverage,
          releaseDate: item.releaseDate,
        },
      ]
    })
  }

  const removeFromWatchlist = (itemId: string) => {
    setWatchlistItems((current) => current.filter((item) => item.id !== itemId))
  }

  return (
    <>
      {trailerKey && <TrailerModal trailerKey={trailerKey} onClose={() => setTrailerKey(null)} />}
      <ContentSearchPanel onAddToWatchlist={addToWatchlist} onPlayTrailer={handlePlayTrailer} watchlistKeys={watchlistKeys} />
      <WatchlistPanel items={watchlistItems} onRemove={removeFromWatchlist} onPlayTrailer={handlePlayTrailer} />
      {isTrailerLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-lg bg-white p-4 shadow-xl dark:bg-zinc-800">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">Fragman araniyor...</p>
          </div>
        </div>
      )}
    </>
  )
}

export default function WatchThisApp() {
  const [profile, setProfile] = useState<User | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(!auth)
  const [isBusy, setIsBusy] = useState(false)
  const [completedPreferenceUserIds, setCompletedPreferenceUserIds] = useState<string[]>([])
  const [isEditingPreferences, setIsEditingPreferences] = useState(false)
  const [savedPreferences, setSavedPreferences] = useState<MoviePreferences | null>(null)
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(false)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [preferencesSaveError, setPreferencesSaveError] = useState('')

  useEffect(() => {
    if (!auth) {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setProfile(nextUser)
      setIsAuthReady(true)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!profile) {
      return
    }

    let isCancelled = false

    const hydratePreferences = async () => {
      const localPreferences = readStoredPreferences(profile.uid)
      if (!isCancelled && localPreferences) {
        setSavedPreferences(localPreferences)
        setCompletedPreferenceUserIds((current) =>
          current.includes(profile.uid) ? current : [...current, profile.uid],
        )
      }

      if (!db) {
        setIsPreferencesLoading(false)
        return
      }

      setIsPreferencesLoading(true)

      try {
        const preferenceRef = ref(db, getPreferenceDatabasePath(profile.uid))
        let timeoutId: number | undefined
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => {
            reject(new Error('preferences-load-timeout'))
          }, PREFERENCES_LOAD_TIMEOUT_MS)
        })

        const snapshot = (await Promise.race([get(preferenceRef), timeoutPromise])) as Awaited<
          ReturnType<typeof get>
        >
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId)
        }

        if (isCancelled || !snapshot.exists()) {
          return
        }

        const normalizedPreferences = normalizePreferences(snapshot.val() as Partial<MoviePreferences>)
        setSavedPreferences(normalizedPreferences)
        window.localStorage.setItem(getPreferenceStorageKey(profile.uid), JSON.stringify(normalizedPreferences))
        setCompletedPreferenceUserIds((current) =>
          current.includes(profile.uid) ? current : [...current, profile.uid],
        )
      } catch {
        if (!isCancelled) {
          setPreferencesSaveError('Tercihler veritabanindan okunamadi. Yerel veri kullaniliyor.')
        }
      } finally {
        if (!isCancelled) {
          setIsPreferencesLoading(false)
        }
      }
    }

    void hydratePreferences()

    return () => {
      isCancelled = true
    }
  }, [profile])

  const handleSignUp = async ({ username, email, password }: SignUpPayload): Promise<AuthActionResult> => {
    if (!auth) {
      return {
        ok: false,
        message: 'Firebase ayarlari eksik. Once Firebase bilgilerini tanimlayin.',
      }
    }

    setIsBusy(true)

    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, password)
      if (credentials.user.displayName !== username) {
        await updateProfile(credentials.user, { displayName: username })
      }

      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: mapFirebaseAuthError(error),
      }
    } finally {
      setIsBusy(false)
    }
  }

  const handleLogin = async ({ email, password }: LoginPayload): Promise<AuthActionResult> => {
    if (!auth) {
      return {
        ok: false,
        message: 'Firebase ayarlari eksik. Once Firebase bilgilerini tanimlayin.',
      }
    }

    setIsBusy(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: mapFirebaseAuthError(error),
      }
    } finally {
      setIsBusy(false)
    }
  }

  const handleLogout = async () => {
    if (!auth) {
      return
    }

    try {
      await signOut(auth)
    } catch {
      // Sign-out errors are non-blocking for UI rendering.
    }
  }

  const handlePreferencesComplete = async (preferences: MoviePreferences) => {
    if (!profile) {
      return
    }

    setIsSavingPreferences(true)
    setPreferencesSaveError('')

    try {
      if (db) {
        const preferenceRef = ref(db, getPreferenceDatabasePath(profile.uid))
        let timeoutId: number | undefined
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => {
            reject(new Error('preferences-save-timeout'))
          }, PREFERENCES_SAVE_TIMEOUT_MS)
        })

        try {
          await Promise.race([
            set(preferenceRef, {
              ...preferences,
              updatedAt: Date.now(),
            }),
            timeoutPromise,
          ])
        } finally {
          if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId)
          }
        }
      }

      window.localStorage.setItem(getPreferenceStorageKey(profile.uid), JSON.stringify(preferences))
      setSavedPreferences(preferences)
      setCompletedPreferenceUserIds((current) =>
        current.includes(profile.uid) ? current : [...current, profile.uid],
      )
      setIsEditingPreferences(false)
    } catch {
      setPreferencesSaveError('Tercihler kaydedilemedi. Lutfen tekrar dene.')
    } finally {
      setIsSavingPreferences(false)
    }
  }

  const handleProfileMenu = () => {
    setIsEditingPreferences(false)
  }

  const handlePreferencesMenu = () => {
    setIsEditingPreferences(true)
  }

  const profileName = useMemo(() => {
    return profile?.displayName || profile?.email || 'Kullanici'
  }, [profile])

  const shouldAskPreferences = useMemo(() => {
    if (
      !profile ||
      isPreferencesLoading ||
      savedPreferences ||
      completedPreferenceUserIds.includes(profile.uid)
    ) {
      return false
    }

    return isFirstAuthSession(profile)
  }, [completedPreferenceUserIds, isPreferencesLoading, profile, savedPreferences])

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
        <nav className="w-full border-b border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
            <span className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
              WatchThis
            </span>
          </div>
        </nav>

        <main className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-3xl items-center gap-8 px-4 py-8">
          <section className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            <h1 className="text-2xl font-bold tracking-tight">Firebase ayari gerekli</h1>
            <p className="mt-3 text-sm leading-6">
              Giris sisteminin calismasi icin proje kokune bir .env.local dosyasi olusturup asagidaki
              degiskenleri tanimlamalisin.
            </p>
            <ul className="mt-4 list-disc space-y-1 pl-6 text-sm">
              <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
              <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
              <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
              <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
              <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
            </ul>
          </section>
        </main>
      </div>
    )
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
        <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Oturum kontrol ediliyor...</p>
        </main>
      </div>
    )
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
            <ProfileCreateForm onSignUp={handleSignUp} onLogin={handleLogin} isBusy={isBusy} />
          </section>
        </main>
      </div>
    )
  }

  if (shouldAskPreferences || isEditingPreferences) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
        <nav className="w-full border-b border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
            <span className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
              WatchThis
            </span>
            <AccountMenu
              profileName={profileName}
              onProfile={handleProfileMenu}
              onPreferences={handlePreferencesMenu}
              onLogout={handleLogout}
            />
          </div>
        </nav>

        <main className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-3xl items-center px-4 py-8">
          <PreferenceQuestionsForm
            profileName={profileName}
            initialPreferences={savedPreferences}
            onCancel={isEditingPreferences ? () => setIsEditingPreferences(false) : undefined}
            onComplete={handlePreferencesComplete}
            isSaving={isSavingPreferences}
            saveError={preferencesSaveError}
          />
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
          <AccountMenu
            profileName={profileName}
            onProfile={handleProfileMenu}
            onPreferences={handlePreferencesMenu}
            onLogout={handleLogout}
          />
        </div>
      </nav>

      <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8">
        <section>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Hos geldin, {profileName}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Sana gore izleme listesi
          </h1>
        </section>

        <UserContentArea key={profile.uid} userId={profile.uid} />
      </main>
    </div>
  )
}
