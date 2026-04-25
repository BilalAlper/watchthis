'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import ProfileCreateForm, {
  type AuthActionResult,
  type LoginPayload,
  type SignUpPayload,
} from './ProfileCreateForm'
import { auth, isFirebaseConfigured } from '@/lib/firebase'

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

export default function WatchThisApp() {
  const [profile, setProfile] = useState<User | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(!auth)
  const [isBusy, setIsBusy] = useState(false)

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

  const profileName = useMemo(() => {
    return profile?.displayName || profile?.email || 'Kullanici'
  }, [profile])

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

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <nav className="w-full border-b border-zinc-200 bg-white px-6 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <span className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">
            WatchThis
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-zinc-700 dark:text-zinc-200 sm:inline">
              {profileName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              Cikis yap
            </button>
          </div>
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
