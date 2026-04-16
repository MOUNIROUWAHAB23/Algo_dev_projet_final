import { useCallback, useState } from "react";
import { mapHebergementService } from "../services/mapHebergement.service";

export function useMapHebergements() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMarkers = useCallback(async (filters) => {
    setLoading(true);
    setError(null);

    try {
      const data = await mapHebergementService.findAll(filters);
      setMarkers(data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement de la carte");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    markers,
    loading,
    error,
    fetchMarkers,
  };
}