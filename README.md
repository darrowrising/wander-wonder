# Wander Wonder

Family adventure app. First slice: shared license-plate hunt on a trip.

## Stack

React, Vite, TypeScript, Tailwind, shadcn-style UI, Firebase Auth + Firestore.

This machine’s Bun (1.0.x) is too old for current Vite, so local scripts use npm. Switch to Bun when it’s updated.

## Run

```bash
cp .env.example .env.development
# fill Firebase keys (test project values live in the old license-plate-game repo)
npm install
npm run dev   # http://localhost:7024
```

## Firebase console (one-time)

On `license-plate-game-test` (local) and `license-game-prod` (production):

1. Enable **Google** and **Email/Password** sign-in.
2. Add `localhost` (test) and the Vercel domain (prod) to **Authentication → Settings → Authorized domains**.
3. For Google, create an OAuth **Web** client and add:
   - Test origin: `http://localhost:7024`
   - Prod origin: `https://YOUR-APP.vercel.app`
   - Redirect: `https://PROJECT.firebaseapp.com/__/auth/handler`
4. Deploy rules: `npm run deploy:rules:test` or `npm run deploy:rules:prod`.

## Production

Uses Firebase project `license-game-prod`. Vite bakes `VITE_FIREBASE_*` in at **build** time, so they must be set on Vercel, not only in `.env.production` on your laptop.

```bash
npx vercel login
npx vercel link          # create or join project wander-wonder
npm run setup:vercel-env
npx vercel --prod
```

After the first deploy, copy the `*.vercel.app` URL and add it in three places:

1. Firebase **Authentication → Settings → Authorized domains** (`license-game-prod`)
2. Google Cloud **OAuth Web client → Authorized JavaScript origins** (`https://YOUR-APP.vercel.app`)
3. Same client **Authorized redirect URIs**: `https://license-game-prod.firebaseapp.com/__/auth/handler`

Enable Google + Email/Password on `license-game-prod` the same way as test (save the public-facing name and support email, create a Web OAuth client if Google says `deleted_client`).

Firestore rules: `npm run deploy:rules:prod` (requires `npx firebase login` once).

Preview prod Firebase locally: `npm run dev:prod` (port 7024).

## First slice

- Sign in (Google or email)
- Create a trip → share the join code
- Family plate grid (50 US states; Canada/Mexico extra). Anyone can undo.
- Text timeline of finds
- Import old license-plate games as past trips (plates attributed to you)

Product name is in `src/config/product.ts`.
