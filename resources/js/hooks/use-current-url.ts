import { useLocation } from 'react-router-dom';
import { toUrl } from '@/lib/utils';

export type IsCurrentUrlFn = (
    urlToCheck: string,
    currentUrl?: string,
) => boolean;

export type WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
    urlToCheck: string,
    ifTrue: TIfTrue,
    ifFalse?: TIfFalse,
) => TIfTrue | TIfFalse;

export type UseCurrentUrlReturn = {
    currentUrl: string;
    isCurrentUrl: IsCurrentUrlFn;
    whenCurrentUrl: WhenCurrentUrlFn;
};

export function useCurrentUrl(): UseCurrentUrlReturn {
    const location = useLocation();
    const currentUrlPath = location.pathname;

    const isCurrentUrl: IsCurrentUrlFn = (
        urlToCheck: string,
        currentUrl?: string,
    ) => {
        const urlToCompare = currentUrl ?? currentUrlPath;
        const urlString = toUrl(urlToCheck);

        if (!urlString.startsWith('http')) {
            return urlString === urlToCompare;
        }

        try {
            const absoluteUrl = new URL(urlString);
            return absoluteUrl.pathname === urlToCompare;
        } catch {
            return false;
        }
    };

    const whenCurrentUrl: WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
        urlToCheck: string,
        ifTrue: TIfTrue,
        ifFalse: TIfFalse = null as TIfFalse,
    ): TIfTrue | TIfFalse => {
        return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
    };

    return {
        currentUrl: currentUrlPath,
        isCurrentUrl,
        whenCurrentUrl,
    };
}
