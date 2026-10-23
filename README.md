# My Fitness Tracker

Personal log for body metrics, training sessions, and daily food intake. Calorie targets are calculated in code from the stored profile.

## Run locally

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run db:seed
npm run dev
```

On Windows PowerShell, copy the example env file with `Copy-Item .env.example .env`, then set `DATABASE_URL` to your Postgres database. `.env` stays out of git.

Open [http://localhost:3000](http://localhost:3000).
