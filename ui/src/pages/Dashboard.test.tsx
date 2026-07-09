import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { CATEGORIES } from '../config/tools';

vi.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Return empty string for 'merge' tool to test fallback
      if (key.includes('tools.merge.')) return '';
      if (key.includes('categories.organize')) return '';
      return key;
    },
  }),
}));

vi.mock('../components/Layout', () => ({
  DynamicIcon: ({ name }: any) => <span data-testid="dynamic-icon">{name}</span>
}));

// We need to mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual as any,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      button: ({ children, ...props }: any) => <button {...props}>{children}</button>
    }
  };
});

describe('Dashboard', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with all tools initially', () => {
    render(<Dashboard onNavigate={mockOnNavigate} />);
    
    // Check header
    expect(screen.getByText('dashboard.title')).toBeDefined();
    
    // Check categories
    for (const category of CATEGORIES) {
      if (category.id === 'organize') {
        expect(screen.getByText('Organize')).toBeDefined();
      } else {
        expect(screen.getByText(`categories.${category.id}`)).toBeDefined();
      }
    }
    
    // Check tools (at least some tools should be rendered)
    expect(screen.getByText('Merge PDF')).toBeDefined();
  });

  it('filters tools by search query', () => {
    render(<Dashboard onNavigate={mockOnNavigate} />);
    
    const searchInput = screen.getByPlaceholderText('dashboard.search');
    
    // Search for something specific, assuming 'merge' is in the tools
    fireEvent.change(searchInput, { target: { value: 'merge' } });
    
    // Check that 'merge' tool is visible, but others are not
    expect(screen.getByText('Merge PDF')).toBeDefined();
    
    // Find a tool that doesn't have 'merge' in it (e.g. 'split')
    const splitTool = screen.queryByText('tools.split.title');
    expect(splitTool).toBeNull();
  });

  it('clears search when clear button is clicked', () => {
    render(<Dashboard onNavigate={mockOnNavigate} />);
    
    const searchInput = screen.getByPlaceholderText('dashboard.search');
    fireEvent.change(searchInput, { target: { value: 'merge' } });
    
    // Find the X button, since it's the only button with X icon inside search bar area, wait it's just a button next to input
    const clearBtn = searchInput.parentElement?.querySelector('button');
    expect(clearBtn).not.toBeNull();
    
    fireEvent.click(clearBtn!);
    
    // Input should be empty
    expect((searchInput as HTMLInputElement).value).toBe('');
  });

  it('filters tools by category', () => {
    render(<Dashboard onNavigate={mockOnNavigate} />);
    
    // Click on 'organize' category (it returns empty string, so it should fallback to 'Organize')
    const organizeCat = screen.getByText('Organize');
    fireEvent.click(organizeCat);
    
    // 'merge' is in organize, should be visible
    expect(screen.getByText('Merge PDF')).toBeDefined();
    
    // 'ocr' is not in organize, should not be visible (assuming it's in a different category)
    const ocrTool = screen.queryByText('tools.ocr.title');
    expect(ocrTool).toBeNull();
  });

  it('shows no tools message when no tools match', () => {
    render(<Dashboard onNavigate={mockOnNavigate} />);
    
    const searchInput = screen.getByPlaceholderText('dashboard.search');
    fireEvent.change(searchInput, { target: { value: 'nonexistenttoolname123456789' } });
    
    expect(screen.getByText('dashboard.noTools')).toBeDefined();
  });

  it('calls onNavigate when a tool is clicked', () => {
    render(<Dashboard onNavigate={mockOnNavigate} />);
    
    const mergeTool = screen.getByText('Merge PDF');
    // The button is the ancestor of the text, so click the text triggers the button click
    fireEvent.click(mergeTool);
    
    expect(mockOnNavigate).toHaveBeenCalledWith('merge');
  });
});
