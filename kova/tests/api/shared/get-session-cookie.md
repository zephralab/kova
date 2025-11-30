# Getting Your Session Cookie

## For Testing API Endpoints

API endpoints require authentication via Supabase session cookies.

## Steps

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Sign in to the application:**
   - Navigate to http://localhost:3000
   - Sign in with your credentials

3. **Open Browser DevTools:**
   - Press `F12` or right-click → Inspect
   - Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)

4. **Find the cookie:**
   - Navigate to: **Cookies** → **http://localhost:3000**
   - Look for: `sb-access-token`
   - Copy the **Value** column

5. **Use in tests:**
   - **REST Client**: Update `@sessionCookie` variable
   - **Bash scripts**: Replace `<your-session-cookie>` placeholder

## Cookie Expiration

Session cookies expire after a period of inactivity. If you get 401 errors:
1. Sign in again
2. Get a fresh cookie
3. Update your test files

## Security Note

⚠️ Never commit files with real session cookies to version control!
