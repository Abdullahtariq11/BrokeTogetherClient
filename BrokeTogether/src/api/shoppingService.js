import client from './client';

const shoppingService = {
  /**
   * Fetch all shopping items for a home.
   * @param {number} homeId
   */
  getItems: async (homeId) => {
    const response = await client.get(`/shopping-items/home/${homeId}/items`);
    return response.data;
  },

  /**
   * Add a new item to the home's shopping list.
   * @param {string} name
   * @param {number|null} price  - optional price
   * @param {number} homeId
   */
  addItem: async (name, price, homeId) => {
    const response = await client.post('/shopping-items', {
      name: name.trim(),
      price: price ? parseFloat(price) : null,
      homeId,
    });
    return response.data;
  },

  /**
   * Edit an existing shopping item.
   * @param {number} itemId
   * @param {string} name
   * @param {number|null} price
   * @param {number} homeId
   */
  editItem: async (itemId, name, price, homeId) => {
    const response = await client.put(`/shopping-items/item/${itemId}`, {
      name: name.trim(),
      price: price ? parseFloat(price) : null,
      homeId,
    });
    return response.data;
  },

  /**
   * Toggle the checked/unchecked state of an item.
   * @param {number} itemId
   */
  markItem: async (itemId) => {
    const response = await client.patch(`/shopping-items/item/mark/${itemId}`);
    return response.data;
  },

  /**
   * Delete a shopping item.
   * @param {number} itemId
   */
  deleteItem: async (itemId) => {
    await client.delete(`/shopping-items/item/${itemId}`);
  },

  // splitType: 'EQUAL' | 'PERSONAL' | 'FIXED' | 'CUSTOM'
  convertToExpense: async (itemId, { splitType, userIds, exactSplits, payerFixedAmount } = {}) => {
    const response = await client.post(`/shopping-items/item/${itemId}/convert`, {
      splitType: splitType || 'EQUAL',
      userIds: userIds || [],
      exactSplits: exactSplits || null,
      payerFixedAmount: payerFixedAmount || null,
    });
    return response.data;
  },
};

export default shoppingService;
