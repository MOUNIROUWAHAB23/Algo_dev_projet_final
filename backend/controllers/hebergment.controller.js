import hebergementModel from "../models/hebergement.model.js";
import { buildHebergementFilter, validatePagination } from "../services/filter.service.js";

export async function getHebergement(req, res) {
    try {
        const { limit, page, offset } = validatePagination(req.query.limit, req.query.page);
        const filter = buildHebergementFilter(req.query);

        const data = await hebergementModel.find(filter).skip(offset).limit(limit).exec();
        if (data.length < 1) {
            return res.status(400).json({
                "code": "400",
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