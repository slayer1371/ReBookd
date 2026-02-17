# ReBookd

ReBookd is a modern, full-stack booking and reservation management platform built with Next.js 15. It connects users with local businesses, allowing for seamless appointment scheduling, payments, and service discovery.

![ReBookd Banner](https://placehold.co/1200x400?text=ReBookd+Platform)

## 🚀 Features

-   **User & Business Portals**: Separate dashboards for regular users and business owners.
-   **Advanced Booking System**: Real-time availability, slot management, and appointment tracking.
-   **Secure Payments**: Integrated with **Stripe Connect** for business payouts and **Stripe Payments** for user transactions.
-   **Authentication**: Secure login/signup via **NextAuth.js** (credentials & OAuth).
-   **Smart Notifications**: Real-time alerts for cancellations matching user **Location** and **Category Preferences** (or Watchlist).
-   **Geolocation & Maps**: Integrated **OpenStreetMap** for business address geocoding and distance-based deal filtering.
-   **Role-Based Dashboards**: tailored experiences for **Consumers** (Feed, Watchlist) and **Businesses** (Deal Management, Analytics).
-   **Responsive Design**: Mobile-first UI built with **Tailwind CSS** and **Radix UI**.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
-   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
-   **Payments**: [Stripe](https://stripe.com/)
-   **Email**: [SendGrid](https://sendgrid.com/)
-   **Validation**: [Zod](https://zod.dev/)

## 📦 Getting Started

### Prerequisites

-   Node.js (v18+)
-   PostgreSQL database
-   Stripe Account
-   SendGrid Account (for emails)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/slayer1371/ReBookd.git
    cd ReBookd
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

3.  **Set up Environment Variables:**

    Create a `.env` file in the root directory and add the following variables:

    ```env
    # Database
    DATABASE_URL="postgresql://user:password@localhost:5432/rebookd?schema=public"

    # NextAuth
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="your-super-secret-key"

    # Stripe
    STRIPE_SECRET_KEY="sk_test_..."
    STRIPE_publishable_KEY="pk_test_..."
    STRIPE_WEBHOOK_SECRET="whsec_..."
    NEXT_PUBLIC_STRIPE_CLIENT_ID="ca_..."

    # SendGrid
    SENDGRID_API_KEY="SG..."
    FROM_EMAIL="noreply@rebookd.com"

    # App
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```

4.  **Database Setup:**

    Push the Prisma schema to your database:

    ```bash
    npx prisma db push
    ```

    (Optional) Seed the database with initial data:

    ```bash
    npx prisma db seed
    ```

5.  **Run the Development Server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```
├── app/                  # Next.js App Router pages and layouts
│   ├── api/              # API Routes (Next.js Edge/Node runtime)
│   ├── (auth)/           # Authentication routes (login, signup)
│   ├── (dashboard)/      # Protected dashboard routes
│   └── layout.tsx        # Root layout
├── components/           # Reusable React components
│   ├── ui/               # UI primitives (buttons, inputs, etc.)
│   └── ...
├── lib/                  # Utility functions, hooks, and configurations
│   ├── prisma.ts         # Prisma client instance
│   └── utils.ts          # Helper functions
├── prisma/               # Prisma schema and migrations
├── public/               # Static assets
└── styles/               # Global styles (globals.css)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
