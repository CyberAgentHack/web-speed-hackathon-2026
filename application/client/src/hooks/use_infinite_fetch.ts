import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 2;

interface ReturnValues<T> {
    data: Array<T>;
    error: Error | null;
    isLoading: boolean;
    fetchMore: () => void;
}

export function useInfiniteFetch<T>(
    apiPath: string,
    fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
    const internalRef = useRef({ isLoading: false, offset: 0 });

    const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
        data: [],
        error: null,
        isLoading: true,
    });

    const fetchMore = useCallback(() => {
        const { isLoading, offset } = internalRef.current;
        if (isLoading) {
            return;
        }

        setResult((cur) => ({
            ...cur,
            isLoading: true,
        }));
        internalRef.current = {
            isLoading: true,
            offset,
        };

        // URLにlimitとoffsetを追加
        const separator = apiPath.includes("?") ? "&" : "?";
        const urlWithPagination = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

        void fetcher(urlWithPagination).then(
            (pageData) => {
                setResult((cur) => ({
                    ...cur,
                    data: [...cur.data, ...pageData],
                    isLoading: false,
                }));
                internalRef.current = {
                    isLoading: false,
                    offset: offset + LIMIT,
                };
            },
            (error) => {
                setResult((cur) => ({
                    ...cur,
                    error,
                    isLoading: false,
                }));
                internalRef.current = {
                    isLoading: false,
                    offset,
                };
            },
        );
    }, [apiPath, fetcher]);

    useEffect(() => {
        setResult(() => ({
            data: [],
            error: null,
            isLoading: true,
        }));
        internalRef.current = {
            isLoading: false,
            offset: 0,
        };

        fetchMore();
    }, [fetchMore]);

    return {
        ...result,
        fetchMore,
    };
}
