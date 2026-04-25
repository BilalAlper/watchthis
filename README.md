This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Firebase Authentication Setup

This project uses Firebase Authentication (Email/Password) for sign-up and login.

1. Create a Firebase project from [Firebase Console](https://console.firebase.google.com/).
2. In **Authentication > Sign-in method**, enable **Email/Password**.
3. In **Project settings > General > Your apps**, create a Web app and copy config values.
4. Add a `.env.local` file in project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

5. Restart the dev server after editing environment variables.

## Free Movie and TV Search API (TMDB)

This project includes a search endpoint for movies and TV shows using TMDB's free tier.

1. Create a TMDB account at [The Movie Database](https://www.themoviedb.org/).
2. Go to account settings and create an API Read Access Token (v4 auth).
3. Add the token to `.env.local`:

```bash
TMDB_BEARER_TOKEN=...
```

4. Restart the dev server.
5. Search from the app UI after logging in.

The app uses a server-side route handler (`app/api/search/route.ts`) so the token is not exposed to the browser.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
