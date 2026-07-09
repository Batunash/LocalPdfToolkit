import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RangeInputEditor } from './RangeInputEditor';
import type { PageRange } from './RangeInputEditor';

describe('RangeInputEditor', () => {
  const mockOnChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  const defaultRanges: PageRange[] = [
    { id: '1', from: 1, to: 5 },
  ];

  it('renders correctly with a single range', () => {
    render(<RangeInputEditor ranges={defaultRanges} onChange={mockOnChange} />);
    
    // It should render two inputs for the range
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2); // from and to
    expect((inputs[0] as HTMLInputElement).value).toBe('1');
    expect((inputs[1] as HTMLInputElement).value).toBe('5');
    
    // The remove button should be disabled since there's only 1 range
    // Actually we have two buttons, remove and add. Let's find by generic icon or text.
    const addBtn = screen.getByText('Add Range');
    expect(addBtn).toBeDefined();

    // To find the remove button, it's the first button before Add Range
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('calls onChange when from value is updated', () => {
    render(<RangeInputEditor ranges={defaultRanges} onChange={mockOnChange} />);
    
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '3' } });

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: '1', from: 3, to: 5 }
    ]);
  });

  it('calls onChange when from value is updated with multiple ranges', () => {
    const ranges: PageRange[] = [
      { id: '1', from: 1, to: 5 },
      { id: '2', from: 6, to: 10 },
    ];
    render(<RangeInputEditor ranges={ranges} onChange={mockOnChange} />);
    
    // There are 4 inputs now. 0,1 for first range, 2,3 for second.
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[2], { target: { value: '7' } }); // Update 'from' of second range

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: '1', from: 1, to: 5 },
      { id: '2', from: 7, to: 10 }
    ]);
  });

  it('calls onChange when to value is updated', () => {
    render(<RangeInputEditor ranges={defaultRanges} onChange={mockOnChange} />);
    
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[1], { target: { value: '7' } });

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: '1', from: 1, to: 7 }
    ]);
  });

  it('auto-fixes to when from > to', () => {
    render(<RangeInputEditor ranges={defaultRanges} onChange={mockOnChange} />);
    
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '10' } });

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: '1', from: 10, to: 10 }
    ]);
  });

  it('auto-fixes from when to < from', () => {
    const ranges: PageRange[] = [{ id: '1', from: 5, to: 10 }];
    render(<RangeInputEditor ranges={ranges} onChange={mockOnChange} />);
    
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[1], { target: { value: '3' } });

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: '1', from: 3, to: 3 }
    ]);
  });

  it('caps the input value to maxPages if provided', () => {
    render(<RangeInputEditor ranges={defaultRanges} onChange={mockOnChange} maxPages={10} />);
    
    const inputs = screen.getAllByRole('spinbutton');
    // Try to enter a value greater than maxPages
    fireEvent.change(inputs[0], { target: { value: '15' } });

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: '1', from: 10, to: 10 } // to is auto-fixed too
    ]);
  });

  it('adds a new range incrementing from the last range', () => {
    render(<RangeInputEditor ranges={defaultRanges} onChange={mockOnChange} />);
    
    const addBtn = screen.getByText('Add Range');
    fireEvent.click(addBtn);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const callArgs = mockOnChange.mock.calls[0][0];
    expect(callArgs).toHaveLength(2);
    expect(callArgs[1].from).toBe(6);
    expect(callArgs[1].to).toBe(6);
  });

  it('adds a new range capping at maxPages', () => {
    const ranges: PageRange[] = [{ id: '1', from: 1, to: 10 }];
    render(<RangeInputEditor ranges={ranges} onChange={mockOnChange} maxPages={10} />);
    
    const addBtn = screen.getByText('Add Range');
    fireEvent.click(addBtn);

    const callArgs = mockOnChange.mock.calls[0][0];
    expect(callArgs[1].from).toBe(10);
    expect(callArgs[1].to).toBe(10);
  });

  it('removes a range when remove button is clicked', () => {
    const ranges: PageRange[] = [
      { id: '1', from: 1, to: 5 },
      { id: '2', from: 6, to: 10 },
    ];
    render(<RangeInputEditor ranges={ranges} onChange={mockOnChange} />);
    
    const buttons = screen.getAllByRole('button');
    // First two buttons are remove buttons for the two ranges
    expect(buttons[0]).not.toBeDisabled();
    
    fireEvent.click(buttons[0]);

    expect(mockOnChange).toHaveBeenCalledWith([
      { id: '2', from: 6, to: 10 }
    ]);
  });

  it('adds a range when ranges array is empty', () => {
    render(<RangeInputEditor ranges={[]} onChange={mockOnChange} />);
    const addBtn = screen.getByText('Add Range');
    fireEvent.click(addBtn);

    const callArgs = mockOnChange.mock.calls[0][0];
    expect(callArgs).toHaveLength(1);
    expect(callArgs[0].from).toBe(1);
    expect(callArgs[0].to).toBe(1);
  });

  it('adds a range capping nextFrom at maxPages', () => {
    // If the last range ends at 10, nextFrom would be 11.
    // If maxPages is 10, nextFrom should be capped at 10.
    const ranges: PageRange[] = [{ id: '1', from: 1, to: 10 }];
    render(<RangeInputEditor ranges={ranges} onChange={mockOnChange} maxPages={10} />);
    
    const addBtn = screen.getByText('Add Range');
    fireEvent.click(addBtn);

    const callArgs = mockOnChange.mock.calls[0][0];
    expect(callArgs[1].from).toBe(10);
    expect(callArgs[1].to).toBe(10);
  });

  it('falls back to range.from or 1 if input is empty string', () => {
    render(<RangeInputEditor ranges={defaultRanges} onChange={mockOnChange} />);
    
    const inputs = screen.getAllByRole('spinbutton');
    
    // Clear the from input (should fallback to 1 via Math.max(1, NaN))
    fireEvent.change(inputs[0], { target: { value: '' } });
    expect(mockOnChange).toHaveBeenCalledWith([
      { id: '1', from: 1, to: 5 }
    ]);

    mockOnChange.mockClear();

    // Clear the to input (should fallback to range.from, which is 1)
    fireEvent.change(inputs[1], { target: { value: '' } });
    expect(mockOnChange).toHaveBeenCalledWith([
      { id: '1', from: 1, to: 1 }
    ]);
  });
});
