import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3400/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const hebergementApi = {
  // US 15 : Carte globale
  fetchMapData: async () => {
    try {
      const response = await api.get('/hebergement?isMapView=true');
      return response.data.data;
    } catch (error) {
      console.error("Erreur fetchMapData:", error);
      return [];
    }
  },

  // US 16 : Rayon géolocalisé
  fetchNearby: async (lat, lng, radius, limit = 50) => {
    try {
      const response = await api.get(`/hebergement?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      if (error.response && error.response.status === 404) return [];
      console.error("Erreur fetchNearby:", error);
      throw error;
    }
  }
};



export default api
