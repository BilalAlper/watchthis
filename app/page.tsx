export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center bg-zinc-50 dark:bg-black font-sans">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-8 py-4 bg-white dark:bg-zinc-900 shadow-sm">
        <span className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50">WatchThis</span>
        {/* Gelecekte Auth/Profil eklenebilir */}
      </nav>

      {/* Ana içerik */}
      <main className="flex flex-col w-full max-w-2xl flex-1 items-center px-4 py-8 gap-8">
        {/* Arama Barı */}
        <div className="w-full flex items-center gap-2">
          <input
            type="text"
            placeholder="Film veya dizi ara..."
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-zinc-50 dark:border-zinc-700"
          />
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Ara</button>
        </div>

        {/* İzlenecekler Listesi */}
        <section className="w-full">
          <h2 className="text-xl font-semibold mb-2 text-zinc-800 dark:text-zinc-100">To be watch</h2>
          <div className="flex flex-wrap gap-4">
            {/* Örnek kartlar */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 w-48 flex flex-col items-center">
              <div className="w-24 h-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
              <span className="font-medium text-zinc-900 dark:text-zinc-50">Interstellar</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Sci-Fi</span>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 w-48 flex flex-col items-center">
              <div className="w-24 h-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
              <span className="font-medium text-zinc-900 dark:text-zinc-50">Dark</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Thriller</span>
            </div>
            {/* ...daha fazla kart eklenebilir */}
          </div>
        </section>
      </main>
    </div>
  );
}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
