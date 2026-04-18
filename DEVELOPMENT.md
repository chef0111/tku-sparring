# Development

This guide outlines the steps required to set up and run the project in a local environment.

## Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS version recommended)
- [bun](https://bun.sh/)
- [MongoDB Atlas](https://cloud.mongodb.com/)
- [Git](https://git-scm.com/)

## Setup

### 1. Clone the repository:

```bash
git clone https://github.com/chef0111/tku-sparring.git
cd tku-sparring
```

### 2. Install dependencies:

```bash
bun install
```

### 3. Configure environment variables:

- Copy `.env.example` to `.env.local`:
  ```bash
  cp .env.example .env.local
  ```
- Update the environment variables:
  ```env
  DATABASE_URL=<your-mongodb-connection-string>
  BETTER_AUTH_URL=http://localhost:3000
  BETTER_AUTH_SECRET=<generate-a-random-secret>
  ```

### 4. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

### 5. Start the development server:

```bash
bun run dev
```

The application should now be available at `http://localhost:3000`

### 6. Build for production

```bash
bun run start
```
