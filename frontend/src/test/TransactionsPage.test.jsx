import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionsPage } from '../pages/TransactionsPage';
import * as transactionApi from '../api/transactions';
import * as categoryApi from '../api/categories';
import * as accountApi from '../api/accounts';

vi.mock('../api/transactions');
vi.mock('../api/categories');
vi.mock('../api/accounts');

// Mock react-router-dom useOutletContext
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({
      refreshTrigger: 0,
      triggerRefresh: vi.fn(),
    }),
  };
});

describe('TransactionsPage Component', () => {
  const mockTransactions = [
    {
      _id: 'tx-1',
      amount: 150,
      type: 'expense',
      date: new Date().toISOString(),
      note: 'Grocery store snacks',
      category: { _id: 'cat-1', name: 'Food', color: '#f59e0b', icon: 'Utensils' },
      account: { _id: 'acc-1', name: 'Main Account', color: '#3b82f6' },
    },
    {
      _id: 'tx-2',
      amount: 4000,
      type: 'income',
      date: new Date().toISOString(),
      note: 'Monthly salary credit',
      category: { _id: 'cat-2', name: 'Salary', color: '#10b981', icon: 'Briefcase' },
      account: { _id: 'acc-1', name: 'Main Account', color: '#3b82f6' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    transactionApi.getTransactions.mockResolvedValue({
      transactions: mockTransactions,
      total: 2,
      totalPages: 1,
      currentPage: 1,
    });
    categoryApi.getCategories.mockResolvedValue({ categories: [] });
    accountApi.getAccounts.mockResolvedValue({ accounts: [] });
  });

  const renderTransactionsPage = () => {
    return render(
      <BrowserRouter>
        <TransactionsPage />
      </BrowserRouter>
    );
  };

  it('renders search input and action controls', async () => {
    renderTransactionsPage();

    expect(screen.getByPlaceholderText(/Search by note/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(transactionApi.getTransactions).toHaveBeenCalled();
    });
  });

  it('displays the list of fetched transactions after loading finishes', async () => {
    renderTransactionsPage();

    await waitFor(() => {
      expect(screen.queryByText(/Loading transactions/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Grocery store snacks')).toBeInTheDocument();
    expect(screen.getByText('Monthly salary credit')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('updates search query state on input change', async () => {
    renderTransactionsPage();

    const searchInput = screen.getByPlaceholderText(/Search by note/i);
    fireEvent.change(searchInput, { target: { value: 'Grocery' } });

    expect(searchInput.value).toBe('Grocery');
  });

  it('toggles filter panel visibility when filter button is clicked', async () => {
    renderTransactionsPage();

    await waitFor(() => {
      expect(screen.queryByText(/Loading transactions/i)).not.toBeInTheDocument();
    });

    const filterBtn = screen.getByRole('button', { name: /Filters/i });
    fireEvent.click(filterBtn);

    // After clicking, filter panel with Type / Category / Account dropdowns is visible
    expect(await screen.findByText(/All Types/i)).toBeInTheDocument();
  });
});
