import mongoose from "mongoose";
import hebergementModel from "../models/hebergement.model.js";

export async function getHebergement(req, res) {
    try {
        const limit = await req.query?.limit || 10;
        const page = await req.query?.page || 1;
        const offset = (page - 1) * limit;
        const q = await req.query?.q;
        let type = await req.query?.type;
        const filter = {}
        if (q) {
            filter.$or = [
                { nom: { $regex: q, $options: 'i' } },
                { 'localisation.commune': { $regex: q, $options: 'i' } },
                { 'localisation.region': { $regex: q, $options: 'i' } }

            ]
        }
        if (type) {
            type = type.toUpperCase()
            if (!["HOTEL", "CAMPING", "RESIDENCE", "AUBERGE", "VILLAGE"].includes(type)) {
                return res.status(400).json({
                    "code": "400",
                    "message": "Bad type query"
                })
            };
            filter.type = type;
        }

        const data = await hebergementModel.find(filter).skip(offset).limit(limit).exec();
        if (!data) {
            return res.status(400).json({
                "code": "400",
                "message": "Data not found"
            })
        }
        return res.status(200).json({
            "code": "200",
            "data": data
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            "code": "500",
            "data": error
        })
    }
}