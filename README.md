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

## Local auth bypass (temporary)

For local scanning and development, there is a temporary auth bypass controlled by `DEV_AUTH_BYPASS=true` in `.env`.

Important:
- This is intended for local development only
- Remove it or set it to `false` once Google OAuth credentials are wired up
- After changing it, restart the dev server

## Google OAuth hookup checklist

When you're ready to switch from the dev bypass to real Google auth:

1. Create a Google OAuth web app credential
2. Add this callback URL:
   - `http://localhost:3000/api/auth/callback/google`
3. Fill in `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env`
4. Set `DEV_AUTH_BYPASS=false` (or remove it)
5. Restart the dev server
6. Verify `/login` → Google sign-in → dashboard redirect
7. Re-run `npm run scan`

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
