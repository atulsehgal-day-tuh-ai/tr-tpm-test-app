# TR TPM Test App

A basic test application to verify the recommended tech stack for the Talking Rain TPM system.

## Stack

- **Frontend/Framework**: Next.js 14 (React) with TypeScript
- **Runtime**: Node.js
- **Database**: PostgreSQL
- **Authentication**: Azure AD (Entra ID) with MSAL

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running and accessible
- Azure AD app registration configured

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/tr_tpm_db

# Azure AD Configuration
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-client-id-here
NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-tenant-id-here
NEXT_PUBLIC_AZURE_AD_REDIRECT_URI=http://localhost:3000
```

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE tr_tpm_db;
```

2. The application will automatically create the test table on first connection.

### Azure AD Setup

1. Register an application in Azure Portal (Azure Active Directory > App registrations)
2. Configure:
   - **Redirect URI**: `http://localhost:3000` (for development)
   - **Supported account types**: Based on your organization's needs
   - **API permissions**: Microsoft Graph > User.Read (for basic authentication)
3. Copy the **Application (client) ID** and **Directory (tenant) ID** to your `.env.local` file

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Test the components:
   - **Azure AD**: Click "Login with Azure AD" to test authentication
   - **PostgreSQL**: Click "Test Database Connection" to verify database connectivity

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── test-db/       # Database test endpoint
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page with test UI
│   ├── providers.tsx      # MSAL provider setup
│   └── globals.css        # Global styles
├── lib/                   # Utility libraries
│   ├── db.ts              # PostgreSQL connection and utilities
│   └── authConfig.ts      # Azure AD MSAL configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Features

- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ PostgreSQL database connection
- ✅ Azure AD authentication with MSAL
- ✅ Test page to verify all components
- ✅ Basic error handling

## Next Steps

This is a minimal test app. For the full TPM application, you'll need to:

1. Expand database schema for Budget, Forecast, Actual data
2. Implement proper authentication flows and role-based access
3. Add data models for Accounts, Promotions, Products
4. Create API routes for CRUD operations
5. Build user interface for data entry and reporting
6. Add data validation and business logic

## Notes

- Make sure your PostgreSQL database is running before testing
- Azure AD authentication requires proper app registration in Azure Portal
- The app uses MSAL React for client-side authentication
- Database connection pooling is configured for production use