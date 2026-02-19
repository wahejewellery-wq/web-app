export interface PortfolioItem {
    id: string;
    title: string;
    date: string;
    weight: string;
    value: number;
    image: string;
}

const STORAGE_KEY = 'gold_portfolio_items';

export const saveItem = (item: PortfolioItem) => {
    if (typeof window === 'undefined') return;
    const existing = getItems();
    const updated = [item, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getItems = (): PortfolioItem[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};
