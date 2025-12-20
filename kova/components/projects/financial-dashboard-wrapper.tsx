'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { FinancialDashboard } from './financial-dashboard';

interface FinancialContextType {
    refreshKey: number;
    refresh: () => void;
}

export const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function useFinancialRefresh() {
    const context = useContext(FinancialContext);
    if (!context) {
        throw new Error('useFinancialRefresh must be used within FinancialDashboardWrapper');
    }
    return context;
}

interface FinancialDashboardWrapperProps {
    projectId: string;
    totalAmount: number;
    amountReceived: number;
    children?: ReactNode;
}

export function FinancialDashboardWrapper({ 
    projectId, 
    totalAmount, 
    amountReceived,
    children
}: FinancialDashboardWrapperProps) {
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <FinancialContext.Provider value={{ refreshKey, refresh }}>
            <FinancialDashboard 
                projectId={projectId}
                totalAmount={totalAmount}
                amountReceived={amountReceived}
                refreshKey={refreshKey}
            />
            {children}
        </FinancialContext.Provider>
    );
}
