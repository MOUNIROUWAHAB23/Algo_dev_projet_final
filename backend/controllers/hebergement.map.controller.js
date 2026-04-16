import hebergementModel from "../models/hebergement.model.js";
import { buildHebergementFilter } from "../services/filter.service.js";

export async function getHebergementMap(req, res) {
  try {
    const filter = buildHebergementFilter(req.query);

    const data = await hebergementModel
      .find(filter)
      .select(
        "_id nom type classification localisation.region localisation.commune localisation.coordinates"
      )
      .lean()
      .exec();

    const normalized = data
      .filter(
        (item) =>
          Array.isArray(item?.localisation?.coordinates?.coordinates) &&
          item.localisation.coordinates.coordinates.length === 2
      )
      .map((item) => ({
        id: String(item._id),
        nom: item.nom,
        type: item.type,
        classification: item.classification ?? null,
        region: item.localisation?.region ?? "",
        commune: item.localisation?.commune ?? "",
        coordinates: item.localisation.coordinates.coordinates, // [lng, lat]
      }));

    return res.status(200).json({
      code: "200",
      data: normalized,
    });
  } catch (error) {
    return res.status(500).json({
      code: "500",
      message: error.message,
    });
  }
}