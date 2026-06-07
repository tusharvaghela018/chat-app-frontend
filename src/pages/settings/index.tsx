import { useNavigate } from "react-router-dom"
import { ArrowLeft, UserMinus } from "lucide-react"
import Button from "@/common/Button"
import PrivacySettings from "./components/PrivacySettings"
import SecuritySettings from "./components/SecuritySettings"

const SettingsPage = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-full bg-background text-foreground pb-20 pt-6">
            <main className="mx-auto max-w-3xl px-4 sm:px-6">
                
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(-1)}
                            className="rounded-full"
                        >
                            <ArrowLeft size={24} />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Security Section (2FA, Password) */}
                    <SecuritySettings />

                    {/* Privacy Section (Blocked Users) */}
                    <PrivacySettings />

                    {/* Account Visibility Placeholder */}
                    <div className="overflow-hidden rounded-2xl border bg-card/40 shadow-sm opacity-60">
                        <div className="flex items-center gap-4 p-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <UserMinus size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Account Visibility</h2>
                                <p className="text-xs text-muted-foreground italic">Coming soon: Control who can find your profile</p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}

export default SettingsPage
