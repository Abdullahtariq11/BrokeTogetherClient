import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../../../api/shoppingService', () => ({
  getItems: jest.fn(),
  addItem: jest.fn(),
  editItem: jest.fn(),
  markItem: jest.fn(),
  deleteItem: jest.fn(),
  convertToExpense: jest.fn(),
}));

import shoppingService from '../../../api/shoppingService';
import ShoppingTab from '../ShoppingTab';

describe('ShoppingTab', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows the empty state when there are no items', async () => {
    shoppingService.getItems.mockResolvedValue([]);

    const { findByText } = await render(<ShoppingTab homeId={1} refreshTrigger={0} />);

    expect(await findByText(/shopping list is empty/i)).toBeTruthy();
  });

  it('renders fetched items split into to-buy and purchased sections', async () => {
    shoppingService.getItems.mockResolvedValue([
      { id: 1, name: 'Milk', price: 2.5, isChecked: false },
      { id: 2, name: 'Bread', price: 3, isChecked: true },
    ]);

    const { findByText, getByText } = await render(<ShoppingTab homeId={1} refreshTrigger={0} />);

    expect(await findByText('Milk')).toBeTruthy();
    expect(getByText('Bread')).toBeTruthy();
    expect(getByText('Purchased')).toBeTruthy();
  });

  it('adds a new item and refreshes the list', async () => {
    shoppingService.getItems.mockResolvedValue([]);
    shoppingService.addItem.mockResolvedValue({ id: 3, name: 'Eggs', isChecked: false });

    const { findByText, getByPlaceholderText, getByTestId } = await render(
      <ShoppingTab homeId={1} refreshTrigger={0} />
    );
    await findByText(/shopping list is empty/i);

    shoppingService.getItems.mockResolvedValue([{ id: 3, name: 'Eggs', isChecked: false }]);

    await fireEvent.changeText(getByPlaceholderText('Item name…'), 'Eggs');
    await fireEvent.press(getByTestId('shopping-add-button'));

    await waitFor(() => {
      expect(shoppingService.addItem).toHaveBeenCalledWith('Eggs', null, 1);
    });
    expect(await findByText('Eggs')).toBeTruthy();
  });

  it('does not call addItem when the name is blank', async () => {
    shoppingService.getItems.mockResolvedValue([]);
    const { findByText, getByTestId } = await render(<ShoppingTab homeId={1} refreshTrigger={0} />);
    await findByText(/shopping list is empty/i);

    await fireEvent.press(getByTestId('shopping-add-button'));

    expect(shoppingService.addItem).not.toHaveBeenCalled();
  });
});
