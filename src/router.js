import { useEffect, useState } from 'react';

// Minimal client-side router: real URLs (/news/cyber, /cat-monitor/hurricane-ian-2022) without extra dependencies.
export function usePath() {
    const [path, setPath] = useState(window.location.pathname);
    useEffect(() => {
        const onPop = () => setPath(window.location.pathname);
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);
    return path;
}

export function navigate(to, { replace = false, scroll = true } = {}) {
    if (to !== window.location.pathname + window.location.search) {
        window.history[replace ? 'replaceState' : 'pushState']({}, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
    if (scroll) window.scrollTo({ top: 0 });
}

export function linkProps(to) {
    return {
        href: to,
        onClick: (e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            navigate(to);
        },
    };
}

export const tagSlug = (t) => t.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function setPageMeta(title, description) {
    document.title = title;
    const d = document.querySelector('meta[name="description"]');
    if (d && description) d.setAttribute('content', description);
}
