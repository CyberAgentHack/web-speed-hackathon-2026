import { useEffect } from "react";

export const useDocumentTitle = (title: string | null) => {
    useEffect(() => {
        if (title == null) {
            return;
        }
        document.title = title;
    }, [title]);
};
