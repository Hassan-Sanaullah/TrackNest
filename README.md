# TrackNest

**TrackNest** is a lightweight, backend-driven real-time website analytics solution. It allows you to track page views, button clicks, and other custom events with a privacy-friendly, script-based tracking mechanism. Built using **NestJS**, **PostgreSQL**, **Prisma**, and **Redis**, TrackNest is designed to scale, while remaining minimal and easy to deploy.

---

## 🌐 Live Features

- Page view tracking
- Custom event tracking (e.g. button clicks)
- Unique session identification
- Referrer tracking
- Real-time ingestion via WebSockets
- JWT-based authentication
- Server-side aggregation via CRON jobs
- Redis caching and pub/sub
- Modular architecture for easy extensibility
- Redis-based rate limiting for event tracking to prevent abuse

---

## 🧠 How It Works

1. **Client embeds the tracking script**:

```html
<script src="http://<your-api-domain>/events/tracknest.js"></script>
<script>TrackNest('init', '<websiteId>');</script>
```

2. **Server-side responsibilities**:
   - Validates and stores event data in PostgreSQL.
   - Aggregates daily analytics using a scheduled CRON job.
   - Emits real-time updates to connected WebSocket clients.
   - Uses Redis for caching and pub/sub messaging.

3. **Real-time tracking (via WebSockets)**:

To receive real-time events in a dashboard:

```js
const socket = io('http://localhost:3000', {
  query: {
    token: '<jwt_token>',
    websiteId: '<your_website_id>'
  }
});

socket.on('new_event', (data) => {
  console.log('Real-time event:', data);
});
```

---

## 📦 Technologies Used

| Component       | Tech Stack                         |
|----------------|------------------------------------|
| Backend         | [NestJS](https://nestjs.com/)      |
| Database        | [PostgreSQL](https://postgresql.org) |
| ORM             | [Prisma](https://www.prisma.io/)   |
| Caching / PubSub| [Redis](https://redis.io/)         |
| Auth            | [JWT (via Passport)](https://docs.nestjs.com/security/authentication)               |
| WebSockets      | [Socket.IO](https://socket.io/)    |
| Frontend Script | Vanilla JS                         |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Docker + Docker Compose
- Optional: PostgreSQL and Redis (if not using Docker)

---

### 📦 Installation

1. **Clone the repo**:

```bash
git clone https://github.com/hassan-sanaullah/tracknest.git
cd tracknest
```

2. **Install dependencies**:

```bash
npm install
```

3. **Copy and configure your environment variables**:

```bash
cp .env.example .env
```

Then fill in your `.env` file with your actual values:

```env
JWT_SECRET=your_jwt_secret

REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tracknest

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=tracknest
POSTGRES_PORT=5432
```

4. **Start PostgreSQL and Redis using Docker Compose**:

```bash
npm run docker:up
```

This will start the services defined in your `docker-compose.postgres.yml` and `docker-compose.redis.yml` for PostgreSQL and Redis.

5. **Generate the Prisma client**:

```bash
npx prisma generate
```

6. **Apply database schema** (if not already applied):

```bash
npx prisma migrate dev --name init
```

7. **Run the server**:

```bash
npm run start:dev
```

---

## 🔌 WebSocket Usage

TrackNest supports real-time analytics using WebSockets (via `Socket.IO`). Connect to the server and subscribe to the `new_event` channel:

```js
const socket = io('http://localhost:3000', {
  query: {
    token: 'your_jwt_token',
    websiteId: 'your_website_id'
  }
});

socket.on('new_event', (data) => {
  console.log('New event received:', data);
});
```

> **Note**: The `token` must be a valid JWT issued by the TrackNest API.

---

## 🚀 API Endpoints

### 📍 Base URL

```
http://localhost:3000
```

---

## 📦 Authentication

### 🔐 Sign Up

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password_123"
}
```

---

### 🔑 Sign In

**Endpoint:** `POST /auth/signin`

**Request Body:**
```json
{
   "email": "user@example.com",
  "password": "Password_123"
}
```

---

### 🔄 Update Password

**Endpoint:** `PATCH /user/update-password`  
**Auth:** Bearer Token (JWT)

**Request Body:**
```json
{
  "currentPassword": "Password_123",
  "newPassword": "NewPassword_123"
}
```

---

## 🌐 Website Management

### ➕ Create Website

**Endpoint:** `POST /websites/create`  
**Auth:** Bearer Token (JWT)

**Request Body:**
```json
{
  "name": "test website",
  "domain": "www.example.com"
}
```

---

### 📄 Get Websites

**Endpoint:** `GET /websites`  
**Auth:** Bearer Token (JWT)

---

## 📊 Event Tracking

### 📌 Track Events

**Endpoint:** `POST /events/track`

**Headers:**
```
Content-Type: application/json  
x-domain: www.example.com
```

**Request Body:**
```json
{
  "websiteId": "8bd29934-3807-41a6-9bdc-0b26964c347c",
  "eventType": "page_view",
  "url": "/blog/how-to-code",
  "referrer": "https://example.com",
  "sessionId": "4e8a122f-5af0-49df-b9cb-5fc1a80e7331"
}
```

---

## 📈 Analytics

### 📊 Get Overview Stats

**Endpoint:**  
`GET /stats/<website-ID>/overview`  
**Auth:** Bearer Token (JWT)


---

> ℹ️ **Note:** Replace placeholder JWT tokens with valid ones obtained during sign-in.


---

## 📁 Project Structure

```
src/
├── aggregation/
├── auth/
├── events/
├── middleware/
├── prisma/
├── redis/
├── stats/
├── user/
├── websites/
├── app.controller.spec.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```


<!-- ---

## 🛠 Features to Add

- Analytics dashboard (React/Vite frontend)
- GDPR consent and cookie modes
- Bot filtering / spam protection
- Public vs Private project modes
- Event batching for performance
- Real-time charts and admin panel

---

## 🧑‍💻 Contributing

Pull requests and issues are welcome! Please open an issue first to discuss what you’d like to work on. -->

---

## 📝 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## 📞 Contact

Made with ❤️ by Hassan Sanaullah.

- Email: hassansanaullah10@gmail.com
- GitHub: [github.com/hassan-sanaullah](https://github.com/hassan-sanaullah)

---

## 🧷 Notes for Production

- Consider using a process manager like `pm2` or Docker for deployment.
- Use HTTPS in production to secure WebSocket and script traffic.
- Limit JWT token lifetimes and rotate secrets frequently.
