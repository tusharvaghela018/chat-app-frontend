import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import DirectList from "@/pages/chat/components/sidebar/DirectList"
import GroupList from "@/pages/chat/components/sidebar/GroupList"
import Button from "@/common/Button"
import type { IGroup, IUser } from "@/types"

type Tab = "direct" | "groups"

interface Props {
    selectedUserId: number | null
    selectedGroupId: number | null
    onSelectUser: (user: IUser) => void
    onSelectGroup: (group: IGroup) => void
    onCreateGroup: () => void
    activeTab: Tab
    onTabChange: (tab: Tab) => void
}

const Sidebar = ({ selectedUserId, selectedGroupId, onSelectUser, onSelectGroup, onCreateGroup, activeTab, onTabChange }: Props) => {
    const navigate = useNavigate()
    // const [activeTab, setActiveTab] = useState<Tab>("direct")

    return (
        <div className="w-1/4 bg-white border-r flex flex-col h-full">

            {/* header */}
            <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                <span className="font-semibold text-lg">Chats</span>
                <Button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition"
                >
                    <ArrowLeft size={16} />
                    Home
                </Button>
            </div>

            {/* tabs */}
            <div className="flex border-b flex-shrink-0">
                <Button
                    onClick={() => onTabChange("direct")}
                    className={`flex-1 py-2.5 text-sm font-medium transition
                        ${activeTab === "direct"
                            ? "border-b-2 border-blue-500 text-blue-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Direct
                </Button>
                <Button
                    onClick={() => onTabChange("groups")}
                    className={`flex-1 py-2.5 text-sm font-medium transition
                        ${activeTab === "groups"
                            ? "border-b-2 border-blue-500 text-blue-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Groups
                </Button>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "direct" ? (
                    <DirectList
                        selectedUserId={selectedUserId}
                        onSelectUser={onSelectUser}
                    />
                ) : (
                    <GroupList
                        selectedGroupId={selectedGroupId}
                        onSelectGroup={onSelectGroup}
                        onCreateGroup={onCreateGroup}
                    />
                )}
            </div>
        </div>
    )
}

export default Sidebar