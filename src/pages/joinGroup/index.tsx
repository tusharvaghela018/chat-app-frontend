import { useParams, useNavigate } from "react-router-dom";
import { usePostApi } from "@/hooks/api";
import { Users, Clock, CheckCircle2, ArrowRight, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import type { IGroup, IJoinGroupRequest } from "@/types";

interface JoinGroupResponse {
    group?: IGroup;
    group_id?: number;
    request?: IJoinGroupRequest;
}

const JoinGroupPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const { mutate: joinGroup, isPending, isSuccess, data } = usePostApi<JoinGroupResponse>(
        `/groups/join/${token}`
    );

    const response = data?.data;

    const handleJoin = () => {
        joinGroup({} as any, {
            onSuccess: (res) => {
                const resData = res.data;

                // already a member — redirect to chat
                if (resData?.group_id) {
                    navigate(ROUTES.CHAT.path, {
                        replace: true,
                        state: { openGroupId: resData.group_id }
                    });
                    return;
                }

                // open mode — joined instantly → redirect after short delay
                if (resData?.group) {
                    setTimeout(() => {
                        navigate(ROUTES.CHAT.path, {
                            replace: true,
                            state: { openGroupId: resData.group?.id }
                        });
                    }, 1500);
                }
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#090b16] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-500/15 dark:bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 shadow-xl shadow-purple-500/5 text-center space-y-6">
                    
                    {/* State 1: Approval Pending Mode */}
                    {isSuccess && response?.request ? (
                        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-18 h-18 sm:w-20 sm:h-20 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                <Clock size={36} className="stroke-[2.2]" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40 text-[11px] font-bold">
                                    <span>Pending Approval</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                                    Request Submitted
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                                    Your request to join this group is awaiting admin review. You will be notified as soon as you're approved.
                                </p>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(ROUTES.CHAT.path)}
                                    className="w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-600/25 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <MessageSquare size={16} />
                                    <span>Go to Chats</span>
                                </button>
                            </div>
                        </div>
                    ) : isSuccess && response?.group ? (
                        /* State 2: Instant Join Success Mode */
                        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-18 h-18 sm:w-20 sm:h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                <CheckCircle2 size={36} className="stroke-[2.2]" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 text-[11px] font-bold">
                                    <span>Welcome to the Group</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                                    Joined Successfully!
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    Opening your encrypted group conversation...
                                </p>
                            </div>
                            <div className="flex justify-center pt-2">
                                <Loader2 size={24} className="text-purple-600 dark:text-purple-400 animate-spin" />
                            </div>
                        </div>
                    ) : (
                        /* State 3: Default Invitation View */
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-purple-600/30">
                                    <Users size={36} className="stroke-[2.2]" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-100/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40 text-[11px] font-bold">
                                        <Sparkles size={11} className="text-purple-600 dark:text-purple-400" />
                                        <span>Group Invitation</span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                        You've Been Invited
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                                        Click below to join this group and start participating in real-time encrypted messaging.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleJoin}
                                    disabled={isPending}
                                    className="w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-600/25 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Joining Group...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Join Group</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate(ROUTES.CHAT.path)}
                                    className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                >
                                    Decline & Go to Chats
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JoinGroupPage;