'use client'

import { useState } from 'react'

export type CreatedProfile = {
  username: string
  email: string
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

type ProfileCreateFormProps = {
  onProfileCreated: (profile: CreatedProfile) => void
}

export default function ProfileCreateForm({ onProfileCreated }: ProfileCreateFormProps) {
  const [form, setForm] = useState(initialFormState)
  const [message, setMessage] = useState('')

  const updateField =
    (field: keyof ProfileFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
      setMessage('')
    }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (form.password !== form.confirmPassword) {
      setMessage('Sifreler ayni degil.')
      return
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    }

    console.log('Profile create payload:', payload)
    onProfileCreated({
      username: payload.username,
      email: payload.email,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Profil</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Hesap olustur
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          WatchThis onerilerini sana gore hazirlayabilmek icin once kimin kullandigini bilelim.
        </p>
      </div>

      <div className="grid gap-4">
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
            placeholder="En az 8 karakter"
            minLength={8}
            autoComplete="new-password"
            required
            className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </label>

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
      </div>

      {message ? (
        <p className="mt-4 rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
      >
        Profil olustur
      </button>
    </form>
  )
}
