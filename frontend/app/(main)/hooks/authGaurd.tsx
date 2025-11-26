"use client";

import { useApp } from '@/components/providers/AppProvider';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {

  const { state } = useApp();
  const { profile, loading } = state;
  const router = useRouter();

  useEffect(() => {
    // Only redirect once loading is false and there is no profile
    if (!loading && !profile) {
      router.push('/login');
    }
  }, [loading, profile, router]);

  // While loading, or if the redirect is about to happen, show a loading indicator
  if (loading || (!profile && !loading)) {
    return <div className='w-screen h-screen flex items-center justify-center'></div>;
  }

  // If the user is authenticated (profile exists), render the children
  return <>{children}</>;
};

export default AuthGuard;