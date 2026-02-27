"use client";

import React, { createContext, useContext } from "react";
import { format } from "date-fns";
import { id, enUS } from "date-fns/locale";

type SettingsContextType = {
    settings: any;
    formatDate: (date: Date | string | null | undefined, customFormat?: string) => string;
};

const SettingsContext = createContext<SettingsContextType>({
    settings: {},
    formatDate: () => "",
});

export function SettingsProvider({ settings, children }: { settings: any, children: React.ReactNode }) {

    // A useful global formatter tied to settings overrides
    const formatDate = (date: Date | string | null | undefined, customFormat?: string) => {
        if (!date) return "-";

        try {
            const d = new Date(date);
            const locale = settings?.general?.language === 'id' ? id : enUS;
            const formatStr = customFormat || settings?.general?.dateFormat || "dd MMM yyyy HH:mm";

            // Map some common format strings from standard input to date-fns formats if they differ
            let fnsFormat = formatStr;
            if (fnsFormat === "DD/MM/YYYY") fnsFormat = "dd/MM/yyyy";
            if (fnsFormat === "MM/DD/YYYY") fnsFormat = "MM/dd/yyyy";
            if (fnsFormat === "YYYY-MM-DD") fnsFormat = "yyyy-MM-dd";

            return format(d, fnsFormat, { locale });
        } catch (e) {
            return String(date);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, formatDate }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSystemSettings = () => useContext(SettingsContext);
