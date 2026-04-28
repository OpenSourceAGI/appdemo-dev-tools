# Better Auth Starter 🚀

Better Auth Starter is a Next.js 15 boilerplate with built-in authentication using **BetterAuth**. It supports **Google Login** and **BetterAuth credentials**, providing a solid foundation for any Next.js project requiring authentication.

## ✨ Features

- 🔐 **Authentication with BetterAuth**
- 🔑 **Google OAuth Login**
- 🎨 **Modern UI with Tailwind CSS & ShadCN**
- 🗄️ **Database integration with Prisma & PostgreSQL**
- ⚡ **Optimized with Next.js 15 App Router**

## 🛠️ Tech Stack

- **Framework:** Next.js 15
- **Auth Provider:** BetterAuth (Credentials & Google Login)
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS, ShadCN

## 🚀 Getting Started

### 1️⃣ Install Dependencies

```bash
bun install
```


### 2️⃣ Set Up Environment Variables
Create a .env file and add the necessary credentials:

```bash
# Secret key for BetterAuth (Use a strong, random secret)
BETTER_AUTH_SECRET=<your_better_auth_secret>

# The base URL of your application (Update this for production)
BETTER_AUTH_URL=http://localhost:3000  # Change this to your production domain in deployment

# PostgreSQL Database Connection URL (Use environment variables in production)
DATABASE_URL="postgresql://<username>:<password>@<host>/<database_name>?sslmode=require"

# Google OAuth Credentials (Required for social login)
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
```


### 3️⃣ Run Database Migrations

```bash
bunx prisma migrate dev
```


### 4️⃣ Start the Development Server

```bash
bun dev
```

The app will be available at http://localhost:3000.

## 🔗 Live Demo
Check out the live version: [Auth Starter](https://better-auth-livid.vercel.app/)


# Built by Aayush Ghimire

