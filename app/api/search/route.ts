import type { NextRequest } from 'next/server'

const tmdbBaseUrl = 'https://api.themoviedb.org/3'

type SearchType = 'all' | 'movie' | 'tv'

type TmdbResult = {
  id: number
  media_type?: string
  title?: string
  name?: string
  overview?: string
  poster_path?: string | null
  vote_average?: number
  release_date?: string
  first_air_date?: string
}

function pickEndpoint(type: SearchType) {
  if (type === 'movie') {
    return 'search/movie'
  }

  if (type === 'tv') {
    return 'search/tv'
  }

  return 'search/multi'
}

function normalizeType(type: string | null): SearchType {
  if (type === 'movie' || type === 'tv' || type === 'all') {
    return type
  }

  return 'all'
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() ?? ''
  const type = normalizeType(request.nextUrl.searchParams.get('type'))

  if (!query) {
    return Response.json(
      {
        message: 'Arama metni bos olamaz.',
      },
      { status: 400 },
    )
  }

  const bearerToken = process.env.TMDB_BEARER_TOKEN

  if (!bearerToken) {
    return Response.json(
      {
        message: 'TMDB_BEARER_TOKEN tanimli degil. .env.local dosyasina ekleyin.',
      },
      { status: 500 },
    )
  }

  const endpoint = pickEndpoint(type)
  const url = new URL(`${tmdbBaseUrl}/${endpoint}`)

  url.searchParams.set('query', query)
  url.searchParams.set('include_adult', 'false')
  url.searchParams.set('language', 'tr-TR')
  url.searchParams.set('page', '1')

  const tmdbResponse = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!tmdbResponse.ok) {
    return Response.json(
      {
        message: 'TMDB servisine ulasilamadi.',
      },
      { status: tmdbResponse.status },
    )
  }

  const payload = (await tmdbResponse.json()) as { results?: TmdbResult[] }
  const results = (payload.results ?? [])
    .filter((item) => {
      const mediaType = item.media_type ?? type
      return mediaType === 'movie' || mediaType === 'tv'
    })
    .map((item) => {
      const mediaType = item.media_type === 'tv' ? 'tv' : item.media_type === 'movie' ? 'movie' : type
      const normalizedType = mediaType === 'tv' ? 'tv' : 'movie'
      const title = item.title ?? item.name ?? 'Isimsiz'
      const releaseDate = item.release_date ?? item.first_air_date ?? ''

      return {
        id: item.id,
        title,
        mediaType: normalizedType,
        overview: item.overview ?? '',
        posterPath: item.poster_path ?? null,
        voteAverage: item.vote_average ?? 0,
        releaseDate,
      }
    })

  return Response.json({ results })
}
