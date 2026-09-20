jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

import client from '../client';
import shoppingService from '../shoppingService';

describe('shoppingService', () => {
  afterEach(() => jest.clearAllMocks());

  it('getItems fetches the shopping list for a home', async () => {
    client.get.mockResolvedValue({ data: [{ id: 1, name: 'Milk' }] });

    const result = await shoppingService.getItems(42);

    expect(client.get).toHaveBeenCalledWith('/shopping-items/home/42/items');
    expect(result).toEqual([{ id: 1, name: 'Milk' }]);
  });

  it('addItem trims the name and parses the price', async () => {
    client.post.mockResolvedValue({ data: { id: 2 } });

    await shoppingService.addItem('  Bread  ', '3.50', 42);

    expect(client.post).toHaveBeenCalledWith('/shopping-items', {
      name: 'Bread',
      price: 3.5,
      homeId: 42,
    });
  });

  it('addItem sends a null price when none is given', async () => {
    client.post.mockResolvedValue({ data: {} });

    await shoppingService.addItem('Eggs', null, 42);

    expect(client.post).toHaveBeenCalledWith('/shopping-items', {
      name: 'Eggs',
      price: null,
      homeId: 42,
    });
  });

  it('convertToExpense posts the split payload for the item', async () => {
    client.post.mockResolvedValue({ data: { converted: true } });

    await shoppingService.convertToExpense(7, { splitType: 'EQUAL', userIds: [2, 3] });

    expect(client.post).toHaveBeenCalledWith('/shopping-items/item/7/convert', {
      splitType: 'EQUAL',
      userIds: [2, 3],
      exactSplits: null,
      payerFixedAmount: null,
    });
  });

  it('convertToExpense defaults to an EQUAL split with no members when called bare', async () => {
    client.post.mockResolvedValue({ data: { converted: true } });

    await shoppingService.convertToExpense(7);

    expect(client.post).toHaveBeenCalledWith('/shopping-items/item/7/convert', {
      splitType: 'EQUAL',
      userIds: [],
      exactSplits: null,
      payerFixedAmount: null,
    });
  });

  it('deleteItem calls the delete endpoint and returns nothing', async () => {
    client.delete.mockResolvedValue({});

    const result = await shoppingService.deleteItem(9);

    expect(client.delete).toHaveBeenCalledWith('/shopping-items/item/9');
    expect(result).toBeUndefined();
  });
});
