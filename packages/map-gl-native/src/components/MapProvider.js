import React, { useState, createContext } from "react";

export const MapContext = createContext({ instance: null, setInstance() {} });

export default function MapProvider({ children }) {
    const [instance, setInstance] = useState(null);
    return (
        <MapContext.Provider value={{ instance, setInstance }}>
            {children}
        </MapContext.Provider>
    );
}
