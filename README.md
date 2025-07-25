# PickMe Intelligence - Law Enforcement OSINT Platform

A comprehensive intelligence platform designed specifically for law enforcement agencies, providing secure OSINT and premium verification services with real-time monitoring and compliance features.

## Features

- **OSINT Intelligence**: Free open-source intelligence gathering from social media, public records, and web sources
- **PRO Verification**: Premium API-based verification services for phone numbers, identity documents, and more
- **Credit System**: Transparent credit-based billing for premium services with detailed usage tracking
- **Real-time Monitoring**: Live request tracking and comprehensive audit logs for compliance and oversight
- **Admin Control Panel**: Complete management system for officers, queries, credits, and API configurations
- **Officer Portal**: Dedicated interface for law enforcement personnel to perform searches and access intelligence

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom cyber-themed design
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Custom Officer Authentication
- **State Management**: React Context API
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (optional for demo mode)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd pickme-intelligence-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration (optional - app works in demo mode without these)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
VITE_APP_NAME=PickMe Intelligence
VITE_APP_VERSION=1.0.0
```

## Demo Credentials

### Admin Portal (`/admin/login`)
- Email: `admin@pickme.intel`
- Password: `admin123`

### Officer Portal (`/officer/login`)
- Email: `ramesh@police.gov.in` or Mobile: `+91 9791103607`
- Password: `officer123`

## API Integration

### Development Environment

The application includes a Vite proxy configuration for API calls during development. The proxy is configured in `vite.config.ts`:

```javascript
server: {
  proxy: {
    '/api/signzy': {
      target: 'https://api.signzy.app',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/signzy/, ''),
      secure: true,
      headers: {
        'Origin': 'https://api.signzy.app'
      }
    },
  },
}
```

### Production Deployment

**IMPORTANT**: When deploying to production, you need to configure your hosting provider to handle API proxy requests.

#### For Netlify Deployment

Create a `_redirects` file in your `public` folder with the following content:

```
/api/signzy/* https://api.signzy.app/:splat 200
```

This ensures that any request to `/api/signzy/*` in production gets proxied to `https://api.signzy.app/*`.

#### For Vercel Deployment

Add to your `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/signzy/(.*)",
      "destination": "https://api.signzy.app/$1"
    }
  ]
}
```

#### For Other Hosting Providers

Configure your hosting provider's proxy/rewrite rules to redirect:
- From: `/api/signzy/*`
- To: `https://api.signzy.app/*`

### API Configuration

1. **Add API Keys**: Use the Admin Panel → API Management to add your Signzy API keys
2. **Configure Rate Plans**: Set up rate plans with API access in Admin Panel → Rate Plans
3. **Assign Plans to Officers**: Assign rate plans to officers to control API access

## Database Schema

The application uses Supabase with the following main tables:

- `officers` - Law enforcement personnel
- `admin_users` - Admin panel users
- `queries` - Search history and results
- `credit_transactions` - Credit usage tracking
- `apis` - API key management
- `rate_plans` - Subscription plans
- `plan_apis` - API access control per plan
- `officer_registrations` - Pending officer registrations
- `live_requests` - Real-time request monitoring

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Header, Sidebar)
│   └── UI/             # UI components (StatusBadge, LoadingSpinner)
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries (Supabase client)
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── main.tsx           # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### Admin Panel Features
- **Dashboard**: Real-time system overview and statistics
- **Officer Management**: Add, edit, and manage law enforcement personnel
- **Registration Approval**: Review and approve officer registration requests
- **Query History**: Complete audit trail of all searches performed
- **Credit Management**: Track and manage credit transactions
- **Rate Plan Management**: Create and configure subscription plans
- **API Management**: Manage API keys and service integrations
- **Live Monitoring**: Real-time request tracking and system health
- **Settings**: System configuration and preferences

### Officer Portal Features
- **Dashboard**: Personal statistics and quick actions
- **Free OSINT Lookups**: Open-source intelligence gathering
- **PRO Lookups**: Premium API-based verification services
- **Phone Prefill V2**: Advanced phone number intelligence
- **Query History**: Personal search history and results
- **Account Management**: Profile and credit information

## Security Features

- **Role-based Access Control**: Separate admin and officer authentication
- **Audit Logging**: Complete trail of all system activities
- **Credit Tracking**: Transparent usage monitoring
- **API Key Management**: Secure storage and rotation of API credentials
- **Session Management**: Secure authentication with timeout controls

## Compliance

- **Data Privacy**: Secure handling of sensitive law enforcement data
- **Audit Trails**: Complete logging for compliance requirements
- **Access Controls**: Granular permissions and role management
- **Credit Transparency**: Clear billing and usage tracking

## Support

For technical support or questions about the platform, please contact your system administrator.

## License

This project is proprietary software designed for law enforcement use only.