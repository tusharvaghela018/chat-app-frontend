import { Provider } from "react-redux";
import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistor, store } from "@/redux/store";
import { PersistGate } from "redux-persist/integration/react";

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </PersistGate>
        </Provider>
    );
}