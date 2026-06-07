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
                <div className="mb-6 sm:mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(-1)}
                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full"
                        >
                            <ArrowLeft size={20} className="sm:size-6" />
                        </Button>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
                    </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                    {/* Security Section (2FA, Password) */}
                    <SecuritySettings />

                    {/* Privacy Section (Blocked Users) */}
                    <PrivacySettings />

                    {/* Account Visibility Placeholder */}
                    <div className="overflow-hidden rounded-2xl border bg-card/40 shadow-sm opacity-60">
                        <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
                            <div className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <UserMinus size={20} className="sm:size-[22px]" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-bold truncate">Account Visibility</h2>
                                <p className="text-[10px] sm:text-xs text-muted-foreground italic truncate">Coming soon: Control profile discovery</p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}

export default SettingsPage
