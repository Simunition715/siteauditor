# Quick Setup Guide

## Installation Steps

1. **Install root dependencies:**

   ```bash
   npm install
   ```

2. **Install client dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

## Running the Application

### Development (Recommended)

Run both server and client:

```bash
npm run dev
```

- Server will run on: http://localhost:3001
- Client will run on: http://localhost:5173

### Separate Processes

If you prefer to run them separately:

**Terminal 1 - Server:**

```bash
npm run dev:server
```

**Terminal 2 - Client:**

```bash
cd client
npm run dev
```

## First Run

1. Open http://localhost:5173 in your browser
2. Enter any website URL (e.g., https://example.com)
3. Wait 30-60 seconds for the audit to complete
4. Review your comprehensive report!

## Troubleshooting

### Chrome/Chromium Issues

If you encounter Chrome-related errors:

- Make sure Chrome or Chromium is installed on your system
- On Linux, you may need to install additional dependencies
- The app uses `chrome-launcher` which should handle Chrome automatically

### Port Already in Use

If port 3001 or 5173 is already in use:

- Change the port in `server/index.js` (PORT variable)
- Change the port in `client/vite.config.js` (server.port)

### Slow Audits

- Audits typically take 30-60 seconds
- Complex sites may take longer
- Check your internet connection if audits are timing out
