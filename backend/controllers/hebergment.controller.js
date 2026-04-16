import hebergementModel from "../models/hebergement.model.js";
import { buildHebergementFilter, validatePagination } from "../services/filter.service.js";

export async function getHebergement(req, res) {
    try {
        const { limit, page, offset } = validatePagination(req.query.limit, req.query.page);
        
        const filter = buildHebergementFilter(req.query);

        // ==========================================
        // INTEGRATION US 16 : Géolocalisation (Rayon)
        // ==========================================
        const { lat, lng, radius, isMapView } = req.query;

        if (lat && lng && radius) {
            const radiusInMeters = parseInt(radius) * 1000;
            // On ajoute la contrainte spatiale au filtre existant
            // MongoDB triera automatiquement par distance croissante !
            filter["localisation.coordinates"] = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)] // [Longitude, Latitude]
                    },
                    $maxDistance: radiusInMeters
                }
            };
        }

        // ==========================================
        // INTEGRATION US 15 : Mode Carte (Leaflet)
        // ==========================================
        // Si le frontend demande la carte (isMapView=true), on ne pagine pas 
        // pour renvoyer tous les points, mais on allège drastiquement les données envoyées.
        if (isMapView === 'true') {
            // S'il n'y a pas déjà un filtre $near, on s'assure de ne prendre que les lieux géocodés
            if (!filter["localisation.coordinates"]) {
                filter["localisation.coordinates"] = { $ne: null };
            }

            const mapData = await hebergementModel.find(filter)
                .select('nom type classification localisation.coordinates hash_record') // Optimisation Réseau
                .exec();

            return res.status(200).json({
                "code": "200",
                "data": mapData
            });
        }

        // ==========================================
        // COMPORTEMENT STANDARD (Liste paginée)
        // ==========================================
        const data = await hebergementModel.find(filter).skip(offset).limit(limit).exec();
        
        if (data.length < 1) {
            return res.status(404).json({ // Standard REST (404 au lieu de 400 pour "Not Found")
                "code": "404",
                "message": "Data not found"
            });
        }
        
        return res.status(200).json({
            "code": "200",
            "data": data
        });

    } catch (error) {
        if (error.message.includes('Invalid') || error.message.includes('Limit')) {
            return res.status(400).json({
                "code": "400",
                "message": error.message
            });
        }
        return res.status(500).json({
            "code": "500",
            "message": error.message
        });
    }
}

export async function getHebergementById(req, res) {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({
                "code": "400",
                "message": "Id is required"
            });
        }

        const data = await hebergementModel.findById(id).exec();

        if (!data) {
            return res.status(404).json({
                "code": "404",
                "message": "Hebergement not found"
            });
        }

        return res.status(200).json({
            "code": "200",
            "data": data
        });

    } catch (error) {
        return res.status(500).json({
            "code": "500",
            "message": error.message
        });
    }
}