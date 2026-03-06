export interface PortfolioItem {
    id: string;
    title: string;
    date: string;
    weight: string; // Keep for legacy
    gold_weight?: string;
    diamond_weight?: string | null;
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

export const clearItems = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
};

export const deleteItem = (id: string) => {
    if (typeof window === 'undefined') return;
    const existing = getItems();
    const updated = existing.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
