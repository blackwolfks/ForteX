
import { Helmet } from 'react-helmet-async';
import CFXApiKeySpecification from '@/components/auth/CFXApiKeySpecification';
import AuthGuard from '@/components/AuthGuard';

const CFXApiKeys = () => {
  return (
    <AuthGuard>
      <Helmet>
        <title>CFX API-Schlüssel | Admin Dashboard</title>
      </Helmet>
      <div className="min-h-screen bg-gray-900">
        <main className="flex-1">
          <CFXApiKeySpecification />
        </main>
      </div>
    </AuthGuard>
  );
};

export default CFXApiKeys;
