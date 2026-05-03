import React from 'react';
import { Shield, Lock, Trash2, Smartphone, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/common/Button';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-4xl mx-auto space-y-8">
            <header className="space-y-4 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
                    <Shield size={32} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Privacy Policy & Terms</h1>
                <p className="text-muted-foreground">Last updated: May 3, 2026</p>
            </header>

            <section className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card 
                        icon={<Lock className="text-blue-500" />}
                        title="End-to-End Encryption"
                        description="Your messages are encrypted on your device before they ever reach our servers. Only you and the recipient have the keys to read them."
                    />
                    <Card 
                        icon={<Smartphone className="text-green-500" />}
                        title="Local Storage (IndexedDB)"
                        description="We store your decryption keys securely on your device using IndexedDB. These keys never leave your device and are not stored on our servers."
                    />
                    <Card 
                        icon={<Key className="text-orange-500" />}
                        title="No PIN Recovery"
                        description="Because we don't store your PIN or your keys, we cannot recover them for you. If you forget your PIN, your old encrypted chats will be lost forever."
                    />
                    <Card 
                        icon={<Trash2 className="text-red-500" />}
                        title="Data Deletion"
                        description="When you log out or reset your PIN, all sensitive data and decryption keys are immediately wiped from your local storage."
                    />
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 bg-muted/30 p-6 rounded-2xl border border-border">
                    <h3 className="text-lg font-bold">Terms of Service</h3>
                    <p>
                        By using this secure chat application, you agree to take full responsibility for the security of your Chat PIN. 
                        You acknowledge that losing this PIN results in the permanent loss of access to your encrypted message history.
                    </p>
                    <p>
                        We do not collect personal data beyond what is necessary for the application to function. 
                        Your messages are your own, and we have no technical means to access their content.
                    </p>
                    <h3 className="text-lg font-bold">User Responsibilities</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Maintain a secure and unique Chat PIN.</li>
                        <li>Log out when using shared or public devices to ensure local data is cleared.</li>
                        <li>Understand that PIN resets will permanently delete your old message history.</li>
                    </ul>
                </div>
            </section>

            <footer className="flex justify-center pt-8">
                <Button onClick={handleBack} variant="secondary" className="px-8">
                    Go Back
                </Button>
            </footer>
        </div>
    );
};

const Card = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-inner">
            {icon}
        </div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
);

export default PrivacyPolicy;
