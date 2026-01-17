import client from './client';

const homeService = {
  // Get all homes the user belongs to
  getMyHomes: async () => {
    const response = await client.get('/homes/my-homes');
    return response.data; // Returns Array<HomeResponse>
  },

  // Create a new home
  createHome: async (name) => {
    const response = await client.post('/homes', { name });
    return response.data;
  },

  // Join a home with a code
  joinHome: async (inviteCode) => {
    const response = await client.post('/homes/join', { inviteCode });
    return response.data;
  },

  // Get members of a specific home
  getMembers: async (homeId) => {
    const response = await client.get(`/homes/${homeId}/members`);
    return response.data;
  }
};

export default homeService;