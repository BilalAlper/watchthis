import type { NextRequest } from 'next/server'

const tmdbBaseUrl = 'https://api.themoviedb.org/3'

const genreIdMap: Record<string, number> = {
  'Aksiyon': 28,
  'Bilim kurgu': 878,
  'Komedi': 35,
  'Dram': 18,
  'Korku': 27,
  'Romantik': 10749,
  'Animasyon': 16,
  'Belgesel': 99,
}

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

export async function POST(request: NextRequest) {
  const bearerToken = process.env.TMDB_BEARER_TOKEN

  if (!bearerToken) {
    return Response.json(
      { message: 'TMDB_BEARER_TOKEN tanimli degil. .env.local dosyasina ekleyin.' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { genres = [], formats = [] } = body

    // Map genres to TMDB IDs
    const genreIds = genres
      .map((g: string) => genreIdMap[g])
      .filter(Boolean)
      .join(',')

    const isTv = formats.includes('Dizi') || formats.includes('Mini dizi') || formats.includes('Anime')
    const isMovie = formats.includes('Film') || formats.length === 0

    const results: TmdbResult[] = []

    const fetchDiscover = async (endpoint: string, mediaType: 'movie' | 'tv') => {
      const url = new URL(`${tmdbBaseUrl}/${endpoint}`)
      url.searchParams.set('language', 'tr-TR')
      url.searchParams.set('sort_by', 'popularity.desc')
      url.searchParams.set('page', '1')
      if (genreIds) {
        url.searchParams.set('with_genres', genreIds)
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          accept: 'application/json',
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.results) {
          results.push(
            ...data.results.map((item: any) => ({
              ...item,
              media_type: mediaType,
            }))
          )
        }
      }
    }

    if (isMovie) {
      await fetchDiscover('discover/movie', 'movie')
    }
    
    if (isTv) {
      await fetchDiscover('discover/tv', 'tv')
    }

    // Sort combined results by popularity or vote average
    results.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))

    const mappedResults = results.slice(0, 20).map((item) => ({
      id: item.id,
      mediaType: item.media_type,
      title: item.title || item.name || '',
      overview: item.overview || '',
      posterPath: item.poster_path,
      voteAverage: item.vote_average || 0,
      releaseDate: item.release_date || item.first_air_date || '',
    }))

    return Response.json({ results: mappedResults })
  } catch (err) {
    return Response.json({ message: 'Sunucu hatasi' }, { status: 500 })
  }
}
