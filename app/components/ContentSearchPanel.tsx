'use client'

import Image from 'next/image'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 450

type SearchType = 'all' | 'movie' | 'tv'

export type SearchResultItem = {
  id: number
  title: string
  mediaType: 'movie' | 'tv'
  overview: string
  posterPath: string | null
  voteAverage: number
  releaseDate: string
}

type ContentSearchPanelProps = {
  onAddToWatchlist: (item: SearchResultItem) => void
  onAddToWatched: (item: SearchResultItem) => void
  watchlistKeys: string[]
  watchedKeys: string[]
}

export default function ContentSearchPanel({
  onAddToWatchlist,
  onAddToWatched,
  watchlistKeys,
  watchedKeys,
}: ContentSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('all')
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [searchMessage, setSearchMessage] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const cacheRef = useRef(new Map<string, SearchResultItem[]>())

  const executeSearch = useCallback(async (rawQuery: string, type: SearchType) => {
    const normalizedQuery = rawQuery.trim()

    if (!normalizedQuery) {
      abortRef.current?.abort()
      setSearchResults([])
      setSearchMessage('')
      return
    }

    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort()
      setSearchResults([])
      setSearchMessage(`Daha iyi sonuc icin en az ${MIN_QUERY_LENGTH} karakter yaz.`)
      return
    }

    const cacheKey = `${type}:${normalizedQuery.toLocaleLowerCase('tr-TR')}`
    const cached = cacheRef.current.get(cacheKey)

    if (cached) {
      setSearchResults(cached)
      setSearchMessage(cached.length === 0 ? 'Sonuc bulunamadi. Farkli bir ad deneyebilirsin.' : '')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsSearching(true)
    setSearchMessage('')

    try {
      const url = new URL('/api/search', window.location.origin)
      url.searchParams.set('query', normalizedQuery)
      url.searchParams.set('type', type)

      const response = await fetch(url.toString(), { signal: controller.signal })
      const payload = (await response.json()) as { message?: string; results?: SearchResultItem[] }

      if (!response.ok) {
        setSearchResults([])
        setSearchMessage(payload.message ?? 'Arama sirasinda bir hata olustu.')
        return
      }

      const results = payload.results ?? []
      cacheRef.current.set(cacheKey, results)
      setSearchResults(results)
      setSearchMessage(results.length === 0 ? 'Sonuc bulunamadi. Farkli bir ad deneyebilirsin.' : '')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      setSearchResults([])
      setSearchMessage('Sunucuya ulasilamadi. Lutfen tekrar dene.')
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false)
      }
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void executeSearch(query, searchType)
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [query, searchType, executeSearch])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void executeSearch(query, searchType)
  }

  return (
    <>
      <form onSubmit={handleSearch} className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchType('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${searchType === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
              }`}
          >
            Hepsi
          </button>
          <button
            type="button"
            onClick={() => setSearchType('movie')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${searchType === 'movie'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
              }`}
          >
            Film
          </button>
          <button
            type="button"
            onClick={() => setSearchType('tv')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${searchType === 'tv'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
              }`}
          >
            Dizi
          </button>
        </div>

        <div className="flex w-full items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Film veya dizi ara..."
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSearching ? 'Araniyor...' : 'Simdi ara'}
          </button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Yazdikca otomatik arama yapilir. Istersen butonla da aninda aratabilirsin.
        </p>
      </form>

      {searchMessage ? (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {searchMessage}
        </p>
      ) : null}

      {searchResults.length > 0 ? (
        <section className="w-full">
          <h2 className="mb-3 text-xl font-semibold text-zinc-800 dark:text-zinc-100">Arama Sonuclari</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((item) => {
              const posterUrl = item.posterPath ? `https://image.tmdb.org/t/p/w342${item.posterPath}` : null
              const watchlistKey = `${item.mediaType}-${item.id}`
              const isInWatchlist = watchlistKeys.includes(watchlistKey)
              const isInWatched = watchedKeys.includes(watchlistKey)

              return (
                <article
                  key={`${item.mediaType}-${item.id}`}
                  className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-xl focus-within:-translate-y-1 focus-within:scale-[1.03] focus-within:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="h-64 w-full bg-zinc-200 dark:bg-zinc-800">
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        alt={`${item.title} afisi`}
                        width={342}
                        height={513}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        Afis yok
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.title}
                    </h3>
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {item.mediaType === 'movie' ? 'Film' : 'Dizi'}
                      {item.releaseDate ? ` • ${item.releaseDate.slice(0, 4)}` : ''}
                      {item.voteAverage > 0 ? ` • ${item.voteAverage.toFixed(1)}/10` : ''}
                    </p>
                    <p className="line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {item.overview || 'Aciklama bulunamadi.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => onAddToWatchlist(item)}
                      disabled={isInWatchlist}
                      aria-label={isInWatchlist ? `${item.title} listede` : `${item.title} izleneceklere ekle`}
                      title={isInWatchlist ? 'Listede' : 'Izleneceklere ekle'}
                      className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
                    >
                      {isInWatchlist ? '✓' : '+'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToWatched(item)}
                      disabled={isInWatched}
                      aria-label={isInWatched ? `${item.title} izlediklerinde` : `${item.title} izlediklerine ekle`}
                      className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
                    >
                      {isInWatched ? 'Izlendi' : 'Izledim'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}
    </>
  )
}
