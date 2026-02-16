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

   // Get home by ID
  getHomeById: async (homeId) => {
    const response = await client.get(`/homes/${homeId}`);
    return response.data;
  },

  // Join a home with a code
  joinHome: async (inviteCode) => {
    const response = await client.post('/homes/join', { inviteCode });
    return response.data;
  },

   // Remove a member from home (only creator can do this)
  removeMember: async (homeId, userId) => {
    const response = await client.delete(`/homes/${homeId}/members/${userId}`);
    return response.data;
  },

  // Get members of a specific home
  getMembers: async (homeId) => {
    const response = await client.get(`/homes/${homeId}/members`);
    return response.data;
  },
   // Get invite code
  getInviteCode: async (homeId) => {
    const response = await client.get(`/homes/${homeId}/invite-code`);
    return response.data;
  },

  // Rename a home (admin only)
  renameHome: async (homeId, name) => {
    const response = await client.put(`/homes/${homeId}`, { name });
    return response.data;
  },

  // Leave a home
  leaveHome: async (homeId) => {
    const response = await client.delete(`/homes/${homeId}/leave`);
    return response.data;
  }
};

export default homeService;