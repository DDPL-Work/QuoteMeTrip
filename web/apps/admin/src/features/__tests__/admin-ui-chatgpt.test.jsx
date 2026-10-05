import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminLayout } from '../../layouts/AdminLayout.jsx';
import { MembershipPlansPage } from '../../pages/MembershipPlansPage.jsx';
import { ConfirmModal } from '../../components/ConfirmModal.jsx';
import { adminApi } from '../../services/api.js';

// Mock auth context
vi.mock('../../features/auth/auth-context.js', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Lead Admin', email: 'admin@quotemetrip.com', role: 'admin' },
    logout: vi.fn(),
  }),
}));

// Mock api
vi.mock('../../services/api.js', () => ({
  adminApi: {
    listMembershipPlans: vi.fn(),
    createMembershipPlan: vi.fn(),
    updateMembershipPlan: vi.fn(),
    deleteMembershipPlan: vi.fn(),
  },
}));

describe('Admin UI & ChatGPT-style Sidebar and Panel Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('AdminLayout renders ChatGPT-style sidebar toggle and responds to click', () => {
    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    );

    // Check desktop toggle button exists
    const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(toggleBtn).toBeInTheDocument();

    // Check sidebar starts expanded
    const sidebar = screen.getByLabelText('OVERVIEW').closest('aside');
    expect(sidebar).not.toHaveClass('collapsed');

    // Click collapse toggle
    fireEvent.click(toggleBtn);
    expect(sidebar).toHaveClass('collapsed');

    // Click expand toggle (header or floating)
    const expandBtns = screen.getAllByRole('button', { name: /expand sidebar/i });
    expect(expandBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(expandBtns[0]);
    expect(sidebar).not.toHaveClass('collapsed');
  });

  test('AdminLayout toggles sidebar on Ctrl+B keyboard shortcut', () => {
    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    );

    const sidebar = screen.getByLabelText('OVERVIEW').closest('aside');
    expect(sidebar).not.toHaveClass('collapsed');

    // Press Ctrl+B
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(sidebar).toHaveClass('collapsed');

    // Press Ctrl+B again to re-expand
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(sidebar).not.toHaveClass('collapsed');
  });

  test('ConfirmModal renders custom dialog and calls onConfirm / onCancel without window.confirm', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { rerender } = render(
      <ConfirmModal
        isOpen={true}
        title="Delete Test Plan"
        message="Are you sure you want to delete this plan?"
        confirmText="Delete Plan"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Delete Test Plan')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this plan?')).toBeInTheDocument();

    // Click Confirm
    const confirmBtn = screen.getByRole('button', { name: 'Delete Plan' });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // Cancel on escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);

    // When closed, wait for AnimatePresence exit
    rerender(
      <ConfirmModal
        isOpen={false}
        title="Delete Test Plan"
        message="Are you sure you want to delete this plan?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await waitFor(() => {
      expect(screen.queryByText('Delete Test Plan')).not.toBeInTheDocument();
    });
  });

  test('MembershipPlansPage opens ConfirmModal on delete and calls delete API on confirmation', async () => {
    const mockPlans = [
      {
        id: 101,
        name: 'Enterprise Plan',
        slug: 'enterprise',
        price: '199.00',
        durationDays: 30,
        status: 'active',
        description: 'Full enterprise agency access',
      },
    ];

    adminApi.listMembershipPlans.mockResolvedValue(mockPlans);
    adminApi.deleteMembershipPlan.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <MembershipPlansPage />
      </MemoryRouter>
    );

    // Wait for plans to load
    await waitFor(() => {
      expect(screen.getByText('Enterprise Plan')).toBeInTheDocument();
    });

    // Native window.confirm should NOT be called
    const confirmSpy = vi.spyOn(window, 'confirm');

    // Click Delete Plan button on card
    const deleteBtn = screen.getByRole('button', { name: /delete plan/i });
    fireEvent.click(deleteBtn);

    // ConfirmModal should appear
    expect(screen.getByText('Delete Membership Plan')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to permanently delete the membership plan "Enterprise Plan"?/i)
    ).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();

    // Confirm the deletion inside the modal
    const modalDeleteBtn = screen.getAllByRole('button', { name: /delete plan/i }).find(
      (btn) => btn.closest('.admin-plans-page') === null || btn.getAttribute('style')?.includes('DC2626')
    );
    fireEvent.click(modalDeleteBtn || screen.getAllByRole('button', { name: /delete plan/i })[1]);

    await waitFor(() => {
      expect(adminApi.deleteMembershipPlan).toHaveBeenCalledWith(101);
    });
  });
});
