import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import PreviewCard from '../components/PreviewCard';

// Implements the universal "preview card" layer of the mini card → preview card → full
// profile flow. Any component can call openPreview(userId) to pop the same overlay,
// guaranteeing identical behavior in the chat, the directory, and anywhere else.

interface PreviewCardContextValue {
  openPreview: (userId: number) => void;
  closePreview: () => void;
}

const PreviewCardContext = createContext<PreviewCardContextValue | undefined>(
  undefined,
);

export function PreviewCardProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);

  const openPreview = useCallback((id: number) => setUserId(id), []);
  const closePreview = useCallback(() => setUserId(null), []);

  return (
    <PreviewCardContext.Provider value={{ openPreview, closePreview }}>
      {children}
      {userId !== null && (
        <PreviewCard userId={userId} onClose={closePreview} />
      )}
    </PreviewCardContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreviewCard(): PreviewCardContextValue {
  const ctx = useContext(PreviewCardContext);
  if (!ctx) throw new Error('usePreviewCard must be used within a PreviewCardProvider');
  return ctx;
}
