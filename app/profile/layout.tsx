import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Profile | Level Up',
    description: 'Manage your profile, avatar, and account settings.',
};

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
