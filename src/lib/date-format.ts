import { getSystemSettings } from "@/lib/settings";
import { format } from "date-fns";
import { id, enUS } from "date-fns/locale";

export function formatServerDate(date: Date | string | null | undefined, customFormat?: string) {
    if (!date) return "-";
    const settings = getSystemSettings();

    try {
        const d = new Date(date);
        const locale = settings?.general?.language === 'id' ? id : enUS;
        const formatStr = customFormat || settings?.general?.dateFormat || "dd MMM yyyy HH:mm";

        let fnsFormat = formatStr;
        if (fnsFormat === "DD/MM/YYYY") fnsFormat = "dd/MM/yyyy";
        if (fnsFormat === "MM/DD/YYYY") fnsFormat = "MM/dd/yyyy";
        if (fnsFormat === "YYYY-MM-DD") fnsFormat = "yyyy-MM-dd";

        return format(d, fnsFormat, { locale });
    } catch (e) {
        return String(date);
    }
}
