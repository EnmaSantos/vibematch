# VibeMatch Supabase Email Templates

These templates are styled to match the dark theme, warm off-white typography, and gold accent styling of **VibeMatch** (`#090b11` / `#fff8ee` / `#f0b44c`).

> [!IMPORTANT]
> **Password Reset / Confirm Sign-Up Redirection Warning:**
> If you click a Reset Password link and it takes you straight to the `/app` dashboard instead of the `/reset-password` page, it means **your redirect URLs are not whitelisted in Supabase**.
> By default, if the redirect URL is not whitelisted, Supabase ignores the request's redirect parameter and falls back to your project's default Site URL.
> 
> **How to fix this:**
> 1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
> 2. Navigate to **Authentication** -> **URL Configuration** -> **Redirect URLs**.
> 3. Add the following redirect wildcards (including the trailing asterisks):
>    - `http://localhost:3000/**`
>    - `https://vibematch-xi.vercel.app/**` (and any other Vercel domains you use)
> 4. Save your changes. Now clicking email links will correctly direct you to the `/reset-password` page!

To use these templates:
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** -> **Email Templates**.
3. Select each tab (Confirm signup, Reset password, etc.).
4. Paste the respective HTML code below into the template text area.

---

## 1. Confirm Sign Up (Email & OTP)

*   **Subject:** `Confirm your VibeMatch account 🎬`
*   **Body Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your VibeMatch account</title>
  <style type="text/css">
    body { background-color: #090b11; color: #fff8ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; width: 100%; }
    .wrapper { background-color: #090b11; padding: 40px 20px; }
    .container { background-color: #101722; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin: 0 auto; max-width: 500px; padding: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); }
    .logo-container { text-align: center; margin-bottom: 24px; }
    .logo-text { color: #fff8ee; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-decoration: none; display: inline-block; }
    .logo-icon { background-color: #f0b44c; color: #18100b; display: inline-block; width: 32px; height: 32px; line-height: 32px; border-radius: 8px; font-size: 16px; text-align: center; margin-right: 8px; font-weight: bold; vertical-align: middle; }
    .title { font-size: 24px; font-weight: 900; margin-top: 0; margin-bottom: 16px; color: #fff8ee; text-align: center; }
    .text { color: #c5cedc; font-size: 15px; line-height: 24px; margin-top: 0; margin-bottom: 24px; text-align: center; }
    .btn-container { text-align: center; margin-bottom: 24px; }
    .btn { background-color: #f0b44c; border: none; border-radius: 8px; color: #18100b !important; display: inline-block; font-size: 14px; font-weight: bold; padding: 14px 28px; text-decoration: none; }
    .otp-code { background-color: rgba(255, 255, 255, 0.04); border: 1px dashed rgba(240, 180, 76, 0.3); border-radius: 8px; color: #ffd98a; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px auto; padding: 16px; text-align: center; width: fit-content; }
    .divider { border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 24px 0; }
    .footer { color: #687386; font-size: 12px; line-height: 18px; text-align: center; }
    .link { color: #f0b44c; text-decoration: none; }
    .secondary-text { color: #8f9bad; font-size: 12px; line-height: 20px; word-break: break-all; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-container">
        <span class="logo-text">
          <span class="logo-icon">🎬</span>VibeMatch
        </span>
      </div>
      <h1 class="title">Welcome to the Party!</h1>
      <p class="text">Thanks for creating a VibeMatch account! Verify your email to start matching on movies and showtimes with your friends.</p>
      
      <!-- Primary confirmation button -->
      <div class="btn-container">
        <a href="{{ .ConfirmationURL }}" class="btn" target="_blank">Confirm Account</a>
      </div>

      <!-- Optional OTP (If you use code verification instead) -->
      {{ if .Token }}
      <p class="text" style="margin-bottom: 8px;">Or enter this confirmation code:</p>
      <div class="otp-code">{{ .Token }}</div>
      {{ end }}

      <div class="divider"></div>
      
      <p class="secondary-text">If the button above doesn't work, copy and paste this link into your browser:<br>
        <a href="{{ .ConfirmationURL }}" class="link">{{ .ConfirmationURL }}</a>
      </p>
      
      <div class="divider"></div>
      <div class="footer">
        You received this email because you signed up for VibeMatch.<br>
        If you did not request this, you can safely ignore this email.
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 2. Invite User

*   **Subject:** `Join the movie night on VibeMatch 🍿`
*   **Body Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to join VibeMatch</title>
  <style type="text/css">
    body { background-color: #090b11; color: #fff8ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; width: 100%; }
    .wrapper { background-color: #090b11; padding: 40px 20px; }
    .container { background-color: #101722; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin: 0 auto; max-width: 500px; padding: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); }
    .logo-container { text-align: center; margin-bottom: 24px; }
    .logo-text { color: #fff8ee; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-decoration: none; display: inline-block; }
    .logo-icon { background-color: #f0b44c; color: #18100b; display: inline-block; width: 32px; height: 32px; line-height: 32px; border-radius: 8px; font-size: 16px; text-align: center; margin-right: 8px; font-weight: bold; vertical-align: middle; }
    .title { font-size: 24px; font-weight: 900; margin-top: 0; margin-bottom: 16px; color: #fff8ee; text-align: center; }
    .text { color: #c5cedc; font-size: 15px; line-height: 24px; margin-top: 0; margin-bottom: 24px; text-align: center; }
    .btn-container { text-align: center; margin-bottom: 24px; }
    .btn { background-color: #f0b44c; border: none; border-radius: 8px; color: #18100b !important; display: inline-block; font-size: 14px; font-weight: bold; padding: 14px 28px; text-decoration: none; }
    .divider { border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 24px 0; }
    .footer { color: #687386; font-size: 12px; line-height: 18px; text-align: center; }
    .link { color: #f0b44c; text-decoration: none; }
    .secondary-text { color: #8f9bad; font-size: 12px; line-height: 20px; word-break: break-all; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-container">
        <span class="logo-text">
          <span class="logo-icon">🎬</span>VibeMatch
        </span>
      </div>
      <h1 class="title">You're Invited!</h1>
      <p class="text">A friend has invited you to join them on VibeMatch, a social movie-picking app designed to match you and your partner or friends on what to watch next.</p>
      
      <div class="btn-container">
        <a href="{{ .ConfirmationURL }}" class="btn" target="_blank">Accept Invitation</a>
      </div>

      <div class="divider"></div>
      
      <p class="secondary-text">If the button above doesn't work, copy and paste this link into your browser:<br>
        <a href="{{ .ConfirmationURL }}" class="link">{{ .ConfirmationURL }}</a>
      </p>
      
      <div class="divider"></div>
      <div class="footer">
        You received this email because someone invited you to VibeMatch.<br>
        If you did not expect this invitation, you can safely ignore this email.
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 3. Magic Link or OTP

*   **Subject:** `Sign in to VibeMatch ✨`
*   **Body Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to VibeMatch</title>
  <style type="text/css">
    body { background-color: #090b11; color: #fff8ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; width: 100%; }
    .wrapper { background-color: #090b11; padding: 40px 20px; }
    .container { background-color: #101722; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin: 0 auto; max-width: 500px; padding: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); }
    .logo-container { text-align: center; margin-bottom: 24px; }
    .logo-text { color: #fff8ee; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-decoration: none; display: inline-block; }
    .logo-icon { background-color: #f0b44c; color: #18100b; display: inline-block; width: 32px; height: 32px; line-height: 32px; border-radius: 8px; font-size: 16px; text-align: center; margin-right: 8px; font-weight: bold; vertical-align: middle; }
    .title { font-size: 24px; font-weight: 900; margin-top: 0; margin-bottom: 16px; color: #fff8ee; text-align: center; }
    .text { color: #c5cedc; font-size: 15px; line-height: 24px; margin-top: 0; margin-bottom: 24px; text-align: center; }
    .btn-container { text-align: center; margin-bottom: 24px; }
    .btn { background-color: #f0b44c; border: none; border-radius: 8px; color: #18100b !important; display: inline-block; font-size: 14px; font-weight: bold; padding: 14px 28px; text-decoration: none; }
    .otp-code { background-color: rgba(255, 255, 255, 0.04); border: 1px dashed rgba(240, 180, 76, 0.3); border-radius: 8px; color: #ffd98a; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px auto; padding: 16px; text-align: center; width: fit-content; }
    .divider { border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 24px 0; }
    .footer { color: #687386; font-size: 12px; line-height: 18px; text-align: center; }
    .link { color: #f0b44c; text-decoration: none; }
    .secondary-text { color: #8f9bad; font-size: 12px; line-height: 20px; word-break: break-all; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-container">
        <span class="logo-text">
          <span class="logo-icon">🎬</span>VibeMatch
        </span>
      </div>
      <h1 class="title">Sign In</h1>
      <p class="text">Click the button below to sign in to your VibeMatch account instantly without a password.</p>
      
      <div class="btn-container">
        <a href="{{ .ConfirmationURL }}" class="btn" target="_blank">Sign In Instantly</a>
      </div>

      {{ if .Token }}
      <p class="text" style="margin-bottom: 8px;">Or use this sign-in code:</p>
      <div class="otp-code">{{ .Token }}</div>
      {{ end }}

      <div class="divider"></div>
      
      <p class="secondary-text">If you are using the link and the button above doesn't work, copy and paste this into your browser:<br>
        <a href="{{ .ConfirmationURL }}" class="link">{{ .ConfirmationURL }}</a>
      </p>
      
      <div class="divider"></div>
      <div class="footer">
        You received this email because you requested a magic sign-in link.<br>
        If you did not request this, you can safely ignore this email.
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 4. Change Email Address

*   **Subject:** `Confirm email change request on VibeMatch ✉️`
*   **Body Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your email change</title>
  <style type="text/css">
    body { background-color: #090b11; color: #fff8ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; width: 100%; }
    .wrapper { background-color: #090b11; padding: 40px 20px; }
    .container { background-color: #101722; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin: 0 auto; max-width: 500px; padding: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); }
    .logo-container { text-align: center; margin-bottom: 24px; }
    .logo-text { color: #fff8ee; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-decoration: none; display: inline-block; }
    .logo-icon { background-color: #f0b44c; color: #18100b; display: inline-block; width: 32px; height: 32px; line-height: 32px; border-radius: 8px; font-size: 16px; text-align: center; margin-right: 8px; font-weight: bold; vertical-align: middle; }
    .title { font-size: 24px; font-weight: 900; margin-top: 0; margin-bottom: 16px; color: #fff8ee; text-align: center; }
    .text { color: #c5cedc; font-size: 15px; line-height: 24px; margin-top: 0; margin-bottom: 24px; text-align: center; }
    .btn-container { text-align: center; margin-bottom: 24px; }
    .btn { background-color: #f0b44c; border: none; border-radius: 8px; color: #18100b !important; display: inline-block; font-size: 14px; font-weight: bold; padding: 14px 28px; text-decoration: none; }
    .otp-code { background-color: rgba(255, 255, 255, 0.04); border: 1px dashed rgba(240, 180, 76, 0.3); border-radius: 8px; color: #ffd98a; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px auto; padding: 16px; text-align: center; width: fit-content; }
    .divider { border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 24px 0; }
    .footer { color: #687386; font-size: 12px; line-height: 18px; text-align: center; }
    .link { color: #f0b44c; text-decoration: none; }
    .secondary-text { color: #8f9bad; font-size: 12px; line-height: 20px; word-break: break-all; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-container">
        <span class="logo-text">
          <span class="logo-icon">🎬</span>VibeMatch
        </span>
      </div>
      <h1 class="title">Confirm New Email</h1>
      <p class="text">We received a request to change your VibeMatch account email address from <strong>{{ .OldEmail }}</strong> to <strong>{{ .NewEmail }}</strong>.</p>
      
      <div class="btn-container">
        <a href="{{ .ConfirmationURL }}" class="btn" target="_blank">Confirm Email Change</a>
      </div>

      {{ if .Token }}
      <p class="text" style="margin-bottom: 8px;">Or enter this confirmation code:</p>
      <div class="otp-code">{{ .Token }}</div>
      {{ end }}

      <div class="divider"></div>
      
      <p class="secondary-text">If the button above doesn't work, copy and paste this link into your browser:<br>
        <a href="{{ .ConfirmationURL }}" class="link">{{ .ConfirmationURL }}</a>
      </p>
      
      <div class="divider"></div>
      <div class="footer">
        You received this email because a change of email was requested on VibeMatch.<br>
        If you did not request this, you can safely ignore this email.
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 5. Reset Password

*   **Subject:** `Reset your VibeMatch password 🔑`
*   **Body Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
  <style type="text/css">
    body { background-color: #090b11; color: #fff8ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; width: 100%; }
    .wrapper { background-color: #090b11; padding: 40px 20px; }
    .container { background-color: #101722; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin: 0 auto; max-width: 500px; padding: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); }
    .logo-container { text-align: center; margin-bottom: 24px; }
    .logo-text { color: #fff8ee; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-decoration: none; display: inline-block; }
    .logo-icon { background-color: #f0b44c; color: #18100b; display: inline-block; width: 32px; height: 32px; line-height: 32px; border-radius: 8px; font-size: 16px; text-align: center; margin-right: 8px; font-weight: bold; vertical-align: middle; }
    .title { font-size: 24px; font-weight: 900; margin-top: 0; margin-bottom: 16px; color: #fff8ee; text-align: center; }
    .text { color: #c5cedc; font-size: 15px; line-height: 24px; margin-top: 0; margin-bottom: 24px; text-align: center; }
    .btn-container { text-align: center; margin-bottom: 24px; }
    .btn { background-color: #f0b44c; border: none; border-radius: 8px; color: #18100b !important; display: inline-block; font-size: 14px; font-weight: bold; padding: 14px 28px; text-decoration: none; }
    .otp-code { background-color: rgba(255, 255, 255, 0.04); border: 1px dashed rgba(240, 180, 76, 0.3); border-radius: 8px; color: #ffd98a; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px auto; padding: 16px; text-align: center; width: fit-content; }
    .divider { border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 24px 0; }
    .footer { color: #687386; font-size: 12px; line-height: 18px; text-align: center; }
    .link { color: #f0b44c; text-decoration: none; }
    .secondary-text { color: #8f9bad; font-size: 12px; line-height: 20px; word-break: break-all; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-container">
        <span class="logo-text">
          <span class="logo-icon">🎬</span>VibeMatch
        </span>
      </div>
      <h1 class="title">Reset Password</h1>
      <p class="text">We received a request to reset your VibeMatch account password. Click the button below to choose a new password.</p>
      
      <div class="btn-container">
        <a href="{{ .ConfirmationURL }}" class="btn" target="_blank">Reset Password</a>
      </div>

      {{ if .Token }}
      <p class="text" style="margin-bottom: 8px;">Or enter this reset code:</p>
      <div class="otp-code">{{ .Token }}</div>
      {{ end }}

      <div class="divider"></div>
      
      <p class="secondary-text">If the button above doesn't work, copy and paste this link into your browser:<br>
        <a href="{{ .ConfirmationURL }}" class="link">{{ .ConfirmationURL }}</a>
      </p>
      
      <div class="divider"></div>
      <div class="footer">
        You received this email because you requested a password reset.<br>
        If you did not request this, you can safely ignore this email.
      </div>
    </div>
  </div>
</body>
</html>
```

---

## 6. Reauthentication

*   **Subject:** `Verify your identity on VibeMatch 🔒`
*   **Body Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your identity</title>
  <style type="text/css">
    body { background-color: #090b11; color: #fff8ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; width: 100%; }
    .wrapper { background-color: #090b11; padding: 40px 20px; }
    .container { background-color: #101722; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; margin: 0 auto; max-width: 500px; padding: 32px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); }
    .logo-container { text-align: center; margin-bottom: 24px; }
    .logo-text { color: #fff8ee; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-decoration: none; display: inline-block; }
    .logo-icon { background-color: #f0b44c; color: #18100b; display: inline-block; width: 32px; height: 32px; line-height: 32px; border-radius: 8px; font-size: 16px; text-align: center; margin-right: 8px; font-weight: bold; vertical-align: middle; }
    .title { font-size: 24px; font-weight: 900; margin-top: 0; margin-bottom: 16px; color: #fff8ee; text-align: center; }
    .text { color: #c5cedc; font-size: 15px; line-height: 24px; margin-top: 0; margin-bottom: 20px; text-align: center; }
    .otp-code { background-color: rgba(255, 255, 255, 0.04); border: 1px dashed rgba(240, 180, 76, 0.3); border-radius: 8px; color: #ffd98a; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px auto; padding: 16px; text-align: center; width: fit-content; }
    .divider { border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 24px 0; }
    .footer { color: #687386; font-size: 12px; line-height: 18px; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-container">
        <span class="logo-text">
          <span class="logo-icon">🎬</span>VibeMatch
        </span>
      </div>
      <h1 class="title">Verify Identity</h1>
      <p class="text">Please enter the following confirmation code to complete your security action.</p>
      
      <div class="otp-code">{{ .Token }}</div>

      <div class="divider"></div>
      <div class="footer">
        You received this email because a sensitive operation required reauthentication.<br>
        If you did not initiate this, please secure your account credentials immediately.
      </div>
    </div>
  </div>
</body>
</html>
```
