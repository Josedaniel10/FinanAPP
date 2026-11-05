import { create } from 'zustand';

export type AppTab =
  | 'dashboard'
  | 'history'
  | 'accounts'
  | 'categories'
  | 'budgets'
  | 'savings'
  | 'reports'
  | 'admin'
  | 'profile';

interface UIState {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  // Modals state
  isTransactionModalOpen: boolean;
  isAccountModalOpen: boolean;
  isTransferModalOpen: boolean;
  isSavingsModalOpen: boolean;
  editingTransactionId: string | null;
  setTransactionModalOpen: (open: boolean, editingId?: string | null) => void;
  setAccountModalOpen: (open: boolean) => void;
  setTransferModalOpen: (open: boolean) => void;
  setSavingsModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  isSidebarCollapsed: false,
  toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  isTransactionModalOpen: false,
  isAccountModalOpen: false,
  isTransferModalOpen: false,
  isSavingsModalOpen: false,
  editingTransactionId: null,

  setTransactionModalOpen: (open, editingId = null) =>
    set({ isTransactionModalOpen: open, editingTransactionId: editingId }),

  setAccountModalOpen: (open) => set({ isAccountModalOpen: open }),
  setTransferModalOpen: (open) => set({ isTransferModalOpen: open }),
  setSavingsModalOpen: (open) => set({ isSavingsModalOpen: open }),
}));
