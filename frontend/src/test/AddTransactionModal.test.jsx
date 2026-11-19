import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddTransactionModal } from '../components/AddTransactionModal';
import * as categoryApi from '../api/categories';
import * as accountApi from '../api/accounts';
import * as transactionApi from '../api/transactions';

vi.mock('../api/categories');
vi.mock('../api/accounts');
vi.mock('../api/transactions');

describe('AddTransactionModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockCategories = [
    { _id: 'cat-1', name: 'Food', type: 'expense', icon: 'Utensils', color: '#f59e0b' },
    { _id: 'cat-2', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10b981' },
  ];

  const mockAccounts = [
    { _id: 'acc-1', name: 'Checking Account', type: 'bank', balance: 5000 },
    { _id: 'acc-2', name: 'Cash Wallet', type: 'cash', balance: 400 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    categoryApi.getCategories.mockResolvedValue({ categories: mockCategories });
    accountApi.getAccounts.mockResolvedValue({ accounts: mockAccounts });
    transactionApi.createTransaction.mockResolvedValue({ success: true, transaction: {} });
  });

  it('does not render modal content when isOpen is false', () => {
    render(<AddTransactionModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    expect(screen.queryByText(/Add Transaction/i)).not.toBeInTheDocument();
  });

  it('renders modal elements properly when isOpen is true', async () => {
    render(<AddTransactionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByText(/Add Transaction/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Expense/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Income/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/0\.00/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(categoryApi.getCategories).toHaveBeenCalled();
      expect(accountApi.getAccounts).toHaveBeenCalled();
    });
  });

  it('validates that amount is required when form is submitted with zero or empty', async () => {
    render(<AddTransactionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const saveBtn = screen.getByRole('button', { name: /Save Transaction/i });
    const form = saveBtn.closest('form');
    fireEvent.submit(form);

    expect(await screen.findByText(/Please enter a valid amount greater than 0/i)).toBeInTheDocument();
    expect(transactionApi.createTransaction).not.toHaveBeenCalled();
  });

  it('allows switching between Expense and Income transaction types', () => {
    render(<AddTransactionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const incomeBtn = screen.getByRole('button', { name: /Income/i });
    fireEvent.click(incomeBtn);

    expect(incomeBtn).toHaveClass('active');
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<AddTransactionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
