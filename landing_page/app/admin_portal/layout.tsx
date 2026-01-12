import { AuthProvider } from '@/components/admin/AuthProvider';

export const metadata = {
  title: 'Kalee Admin Portal',
  description: 'Admin portal for Kalee app management',
};

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
