import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "@/redux/rootReducer";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
    key: "root",
    storage,
    whitelist: ["auth"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


// store/index.ts
// import { configureStore } from "@reduxjs/toolkit";
// import { persistReducer, persistStore } from "redux-persist";
// import rootReducer from "@/redux/rootReducer";

// // Delay storage creation until runtime (not import time)
// const createStorage = () => {
//     const storage = self['localStorage'];
//     return {
//         getItem: (key: string) => Promise.resolve(storage.getItem(key)),
//         setItem: (key: string, value: string) => Promise.resolve(storage.setItem(key, value)),
//         removeItem: (key: string) => Promise.resolve(storage.removeItem(key)),
//     };
// };

// const persistConfig = {
//     key: "root",
//     storage: createStorage(),
//     whitelist: ['auth']
// }

// const persistedReducer = persistReducer(persistConfig, rootReducer)

// export const store = configureStore({
//     reducer: persistedReducer,
//     middleware: (getDefaultMiddleware) =>
//         getDefaultMiddleware({ serializableCheck: false }),
// })

// export const persistor = persistStore(store)

// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch