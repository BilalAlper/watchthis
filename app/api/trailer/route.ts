import type { NextRequest } from 'next/server'

const tmdbBaseUrl = 'https://api.themoviedb.org/3'

type TmdbVideo = {
  id: string
  iso_639_1: string
  iso_3166_1: string
  name: string
  key: string
  site: string
  size: number
  type: string
  official: boolean
  published_at: string
}

async function fetchVideos(id: string, type: string, lang: string, token: string) {
  const url = new URL(`${tmdbBaseUrl}/${type}/${id}/videos`)
  url.searchParams.set('language', lang)
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = (await res.json()) as { results?: TmdbVideo[] }
  return data.results ?? []
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const type = request.nextUrl.searchParams.get('type')

  if (!id || (type !== 'movie' && type !== 'tv')) {
    return Response.json(
      { message: 'Gecersiz parametreler.' },
      { status: 400 },
    )
  }

  const bearerToken = process.env.TMDB_BEARER_TOKEN

  if (!bearerToken) {
    return Response.json(
      { message: 'TMDB_BEARER_TOKEN tanimli degil.' },
      { status: 500 },
    )
  }

  let videos = await fetchVideos(id, type, 'tr-TR', bearerToken)
  if (videos.length === 0) {
    videos = await fetchVideos(id, type, 'en-US', bearerToken)
  }

  const youtubeVideos = videos.filter((v) => v.site === 'YouTube' && v.type === 'Trailer')
  
  if (youtubeVideos.length === 0) {
    const teasers = videos.filter((v) => v.site === 'YouTube' && v.type === 'Teaser')
    if (teasers.length === 0) {
      return Response.json({ trailerKey: null })
    }
    youtubeVideos.push(...teasers)
  }

  const trTrailer = youtubeVideos.find((v) => v.iso_639_1 === 'tr')
  const enTrailer = youtubeVideos.find((v) => v.iso_639_1 === 'en' && v.official) || youtubeVideos.find((v) => v.iso_639_1 === 'en')
  
  const selectedTrailer = trTrailer || enTrailer || youtubeVideos[0]

  return Response.json({ trailerKey: selectedTrailer?.key ?? null })
}
