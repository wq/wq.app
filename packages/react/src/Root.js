import { Provider as StoreProvider } from "react-redux";
import { AppContext } from "./hooks.js";

export default function Root({ app, children }) {
    return (
        <StoreProvider store={app.store._store}>
            <AppContext.Provider value={{ app }}>
                {children}
            </AppContext.Provider>
        </StoreProvider>
    );
}
