'use client'

import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'

export type AuthActionResult =
  | {
    ok: true
  }
  | {
    ok: false
    message: string
  }

export type SignUpPayload = {
  username: string
  email: string
  password: string
}

export type LoginPayload = {
  email: string
  password: string
}

type ProfileFormState = {
  username: string
  email: string
  password: string
  confirmPassword: string
}

const initialFormState: ProfileFormState = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
}

type AuthMode = 'signup' | 'login'

type ProfileCreateFormProps = {
  onSignUp: (payload: SignUpPayload) => Promise<AuthActionResult>
  onLogin: (payload: LoginPayload) => Promise<AuthActionResult>
  isBusy: boolean
}

export default function ProfileCreateForm({ onSignUp, onLogin, isBusy }: ProfileCreateFormProps) {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [form, setForm] = useState(initialFormState)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'error' | 'success'>('error')

  const submitLabel = useMemo(() => {
    return mode === 'signup' ? 'Hesap olustur' : 'Giris yap'
  }, [mode])

  const helperText = useMemo(() => {
    return mode === 'signup'
      ? 'WatchThis onerilerini sana gore hazirlayabilmek icin once hesabini olusturalim.'
      : 'Hesabin varsa mail ve sifrenle giris yapabilirsin.'
  }, [mode])

  const updateField =
    (field: keyof ProfileFormState) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        setForm((current) => ({
          ...current,
          [field]: event.target.value,
        }))
        setMessage('')
      }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (mode === 'signup' && form.password !== form.confirmPassword) {
      setMessage('Sifreler ayni degil.')
      setMessageTone('error')
      return
    }

    const email = form.email.trim()
    const password = form.password

    const result =
      mode === 'signup'
        ? await onSignUp({
          username: form.username.trim(),
          email,
          password,
        })
        : await onLogin({
          email,
          password,
        })

    if (!result.ok) {
      setMessage(result.message)
      setMessageTone('error')
      return
    }

    setMessage(mode === 'signup' ? 'Hesap olusturuldu. Giris yapiliyor...' : 'Giris basarili.')
    setMessageTone('success')

    setForm((current) => ({
      ...current,
      password: '',
      confirmPassword: '',
    }))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Kimlik dogrulama</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          {mode === 'signup' ? 'Hesap olustur' : 'Hesabina giris yap'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {helperText}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => {
            setMode('signup')
            setMessage('')
          }}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === 'signup'
              ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-zinc-50'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'
            }`}
        >
          Hesap olustur
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('login')
            setMessage('')
          }}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === 'login'
              ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-zinc-50'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'
            }`}
        >
          Giris yap
        </button>
      </div>

      <div className="grid gap-4">
        {mode === 'signup' ? (
          <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Kullanici adi
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={updateField('username')}
              placeholder="ornek: cinefan"
              minLength={3}
              autoComplete="username"
              required
              className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Mail
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={updateField('email')}
            placeholder="ornek@mail.com"
            autoComplete="email"
            required
            className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Sifre
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={updateField('password')}
            placeholder={mode === 'signup' ? 'En az 8 karakter' : 'Sifren'}
            minLength={8}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </label>

        {mode === 'signup' ? (
          <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Sifre tekrar
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              placeholder="Sifreni tekrar gir"
              minLength={8}
              autoComplete="new-password"
              required
              className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </label>
        ) : null}
      </div>

      {message ? (
        <p
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${messageTone === 'error'
              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
            }`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isBusy}
        className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
      >
        {isBusy ? 'Isleniyor...' : submitLabel}
      </button>
    </form>
  )
}
