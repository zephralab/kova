# Supabase Authentication Setup Guide

This guide will walk you through configuring email/password authentication, redirect URLs, and email templates in your Supabase project.

## Prerequisites

- A Supabase project created
- Database schema already set up
- Access to your Supabase dashboard

## Step 1: Enable Email/Password Authentication

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers** in the left sidebar
4. Find **Email** in the list of providers
5. Click on **Email** to expand the settings
6. Toggle **Enable Email provider** to ON
7. Configure the following settings:
   - **Confirm email**: Toggle ON if you want users to verify their email before signing in
   - **Secure email change**: Toggle ON to require email confirmation when changing email
   - **Double confirm email changes**: Toggle ON for additional security
8. Click **Save**

## Step 2: Set Up Auth Redirect URLs

Redirect URLs tell Supabase where to send users after authentication actions (sign in, sign up, password reset, etc.).

1. In your Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add your redirect URLs:

   ### Site URL
   - This is your main application URL
   - For local development: `http://localhost:3000`
   - For production: `https://yourdomain.com`

   ### Redirect URLs
   Add the following URLs (one per line):
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   https://yourdomain.com/auth/callback
   https://yourdomain.com/**
   ```

   **Note**: The `/**` wildcard allows any path under your domain. For production, you may want to be more specific.

3. Click **Save**

### Common Redirect URL Patterns

- `http://localhost:3000/auth/callback` - For Next.js auth callback handler
- `http://localhost:3000/dashboard` - Redirect to dashboard after login
- `http://localhost:3000/auth/reset-password` - For password reset flow

## Step 3: Configure Email Templates

Supabase sends automated emails for various authentication events. You can customize these templates.

1. In your Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Customize the following templates:

   ### Confirm signup
   - **Subject**: Welcome! Confirm your email
   - **Body**: Customize the confirmation email
   - Use `{{ .ConfirmationURL }}` for the confirmation link

   ### Magic Link
   - **Subject**: Your magic link
   - **Body**: Customize the magic link email
   - Use `{{ .ConfirmationURL }}` for the magic link

   ### Change Email Address
   - **Subject**: Confirm your new email
   - **Body**: Customize the email change confirmation
   - Use `{{ .ConfirmationURL }}` for the confirmation link

   ### Reset Password
   - **Subject**: Reset your password
   - **Body**: Customize the password reset email
   - Use `{{ .ConfirmationURL }}` for the reset link

   ### Email Change
   - **Subject**: Your email has been changed
   - **Body**: Notification email when email is changed

3. Click **Save** for each template

### Email Template Variables

You can use these variables in your email templates:

- `{{ .ConfirmationURL }}` - The confirmation/reset link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - The confirmation token (if needed)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Redirect URL after confirmation

### Example Email Template

```html
<h2>Welcome!</h2>
<p>Thanks for signing up. Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

## Step 4: Environment Variables

1. Create a `.env.local` file in the root of your project with the following content:
   ```env
   # Supabase Configuration
   # Get these values from your Supabase project settings: https://app.supabase.com/project/_/settings/api

   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Get your Supabase credentials:
   - Go to **Project Settings** → **API** in your Supabase Dashboard
   - Copy the **Project URL** and paste it as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the **anon/public** key and paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Update `.env.local` with your actual values

   **Important**: The `.env.local` file is already in `.gitignore`, so it won't be committed to version control.

## Step 5: Install Additional Dependencies

The required dependency `@supabase/ssr` has already been installed. This package is needed for Next.js App Router authentication support.

## Next Steps

After completing these steps, you can:

1. Create authentication pages (sign up, sign in, password reset)
2. Use the Supabase client utilities in `lib/supabase/`:
   - `lib/supabase/client.ts` - For client-side operations
   - `lib/supabase/server.ts` - For server-side operations
3. Set up middleware for protected routes (optional)

## Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the authentication flow:
   - Sign up with a new email
   - Check your email for the confirmation link
   - Sign in with your credentials
   - Test password reset functionality

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js with Supabase Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)

