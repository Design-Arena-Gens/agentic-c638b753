## Trade Mirror Agent

This project provides an agentic dashboard that monitors MoxyAI trade signals and mirrors them into your personal trading stack (MetaTrader bridge, TradingView webhook, or a custom REST gateway).

### Key Features

- Polls MoxyAI for new trading signals and mirrors them with matching parameters.
- REST integration layer for your execution venue with API-key authentication.
- Live dashboard with toggleable mirroring, manual sync, and trade log.
- Optional webhook notifications for mirrored and failed trades.

### Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables by copying `.env.example` to `.env.local` and filling in your credentials.

3. Start the development server:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to access the dashboard.

4. Trigger a manual sync from the UI or via the API:

   ```bash
   curl -X POST http://localhost:3000/api/sync
   ```

### Deployment

The app is optimized for Vercel. Once your environment variables are configured in the Vercel dashboard, deploy by running:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-c638b753
```

After deployment completes, verify with:

```bash
curl https://agentic-c638b753.vercel.app
```
