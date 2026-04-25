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

    const fetchPages = async (mediaType: 'movie' | 'tv') => {
      const endpoint = `discover/${mediaType}`
      
      const pages = [1, 2, 3] // Fetch 3 pages to get 60 items, so we can slice top 50
      
      const promises = pages.map(async (page) => {
        const url = new URL(`${tmdbBaseUrl}/${endpoint}`)
        url.searchParams.set('language', 'tr-TR')
        url.searchParams.set('page', page.toString())
        url.searchParams.set('without_original_language', 'hi,ta,te,kn,ml') // Filter out Indian movies
        
        if (genreIds) {
          url.searchParams.set('sort_by', 'popularity.desc')
          url.searchParams.set('with_genres', genreIds)
        } else {
          url.searchParams.set('sort_by', 'vote_average.desc')
          url.searchParams.set('vote_count.gte', '2000') // Ensure it only picks well-known top rated
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
      })
      
      await Promise.all(promises)
    }

    const fetches = []
    if (isMovie) fetches.push(fetchPages('movie'))
    if (isTv) fetches.push(fetchPages('tv'))
    
    await Promise.all(fetches)

    // Sort combined results by vote average (IMDB top style) or popularity
    results.sort((a, b) => {
      // If no genres, we strictly sort by rating (IMDB top style)
      if (!genreIds) {
        return (b.vote_average || 0) - (a.vote_average || 0)
      }
      // If genres are selected, sort by popularity as before
      return (b.vote_average || 0) - (a.vote_average || 0)
    })

    // Deduplicate by ID just in case
    const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values())

    const mappedResults = uniqueResults.slice(0, 50).map((item) => ({
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
