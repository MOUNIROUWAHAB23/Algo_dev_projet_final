import mongoose from "mongoose";
import hebergementModel from "../models/hebergement.model.js";

export async function getHebergement(req, res) {
    try {
        const limit = await req.query?.limit || 20;
        const page = await req.query?.page || 1;
        const offset = (page - 1) * limit;
        const q = await req.query?.q;
        const type = await req.query?.type?.toUpperCase();
        const region = await req.query?.region;
        const classification = await req.query?.classification;
        const lat = await req.query?.lat;
        const long = await req.query?.long;
        const radius = await req.query?.radius;
        const filter = {}
        if (limit>100){
            return res.status(400).json({
                    "code": "400",
                    "message": "Bad limit is greater than 100"
                })
        }
        if (q) {
            filter.$or = [
                { nom: { $regex: q, $options: 'i' } },
                { 'localisation.commune': { $regex: q, $options: 'i' } },
                { 'localisation.region': { $regex: q, $options: 'i' } }

            ]
        }
        if (type) {
            if (!["HOTEL", "CAMPING", "RESIDENCE", "AUBERGE", "VILLAGE"].includes(type)) {
                return res.status(400).json({
                    "code": "400",
                    "message": "Bad type query"
                })
            };
            filter.type = type;
        }
        if (region) {
            filter["localisation.region"] = { $regex: region, $options: "i" };
        }
        if (classification) {
            filter.classification = classification;
        }
        if (lat, long, radius) {
            console.log("lat:", lat);
            console.log("long:", long);
            console.log("radius:", radius);
            console.log("parsed:", parseFloat(lat), parseFloat(long), parseInt(radius));
            filter["localisation.coordinates"] = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(long), parseFloat(lat)]
                    },
                    $maxDistance: radius * 1000

                }
            };
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