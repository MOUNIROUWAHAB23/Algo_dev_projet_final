import request from "supertest";
import app from "../app.js";
import hebergementModel from "../models/hebergement.model.js";

jest.mock("../models/hebergement.model.js");

describe("GET /hebergement", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    hebergementModel.find = jest.fn().mockReturnThis();
    hebergementModel.find.mockReturnThis();
    hebergementModel.skip = jest.fn().mockReturnThis();
    hebergementModel.limit = jest.fn().mockReturnThis();
    hebergementModel.exec = jest.fn();
  });

  // -----------------------------
  // 1. LIMIT > 100
  // -----------------------------
  it("should return 400 if limit > 100", async () => {
    const res = await request(app).get("/api/hebergement?limit=150");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Limit cannot exceed 100 items");
  });

  // -----------------------------
  // 2. TYPE invalide
  // -----------------------------
  it("should return 400 for invalid type", async () => {
    const res = await request(app).get("/api/hebergement?type=invalid");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid type: invalid. Valid types are: HOTEL, CAMPING, RESIDENCE, AUBERGE, VILLAGE");
  });

  // -----------------------------
  // 3. Recherche q
  // -----------------------------
  it("should apply q filter", async () => {
    hebergementModel.exec.mockResolvedValue([
      { _id: "1", nom: "Hôtel Paris Luxe", type: "Hôtel" },
      { _id: "2", nom: "Appartement Paris Centre", type: "Appartement" }
    ]);

    const res = await request(app).get("/api/hebergement?q=paris");
    
    expect(res.statusCode).toBe(200);

    expect(hebergementModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.any(Array)
      })
    );
  });

  // -----------------------------
  // 4. Filtre région
  // -----------------------------
  it("should apply region filter", async () => {
    hebergementModel.exec.mockResolvedValue([
      { _id: "1", nom: "Hôtel Paris Luxe", type: "Hôtel" },
      { _id: "2", nom: "Appartement Paris Centre", type: "Appartement" }
    ]);

    const res = await request(app).get("/api/hebergement?region=ile");

    expect(res.statusCode).toBe(200);

    expect(hebergementModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        "localisation.region": { $regex: "ile", $options: "i" }
      })
    );
  });

  // -----------------------------
  // 5. Filtre classification
  // -----------------------------
  it("should apply classification filter", async () => {
    hebergementModel.exec.mockResolvedValue([
      { _id: "1", nom: "Hôtel Paris Luxe", type: "Hôtel" },
      { _id: "2", nom: "Appartement Paris Centre", type: "Appartement" }
    ]);

    const res = await request(app).get("/api/hebergement?classification=4");

    expect(res.statusCode).toBe(200);

    expect(hebergementModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        classification: "4"
      })
    );
  });

  // -----------------------------
  // 6. Filtre géolocalisation
  // -----------------------------
  it("should apply geolocation filter", async () => {
    hebergementModel.exec.mockResolvedValue([
      { _id: "1", nom: "Hôtel Paris Luxe", type: "Hôtel" },
      { _id: "2", nom: "Appartement Paris Centre", type: "Appartement" }
    ]);

    const res = await request(app).get(
      "/api/hebergement?lat=48.85&long=2.35&radius=10"
    );

    expect(res.statusCode).toBe(200);

    expect(hebergementModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        "localisation.coordinates": expect.objectContaining({
          $near: expect.any(Object)
        })
      })
    );
  });

  // -----------------------------
  // 7. Succès normal
  // -----------------------------
  it("should return 200 and data", async () => {
    hebergementModel.exec.mockResolvedValue([{ id: 1 }]);

    const res = await request(app).get("/api/hebergement");

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([{ id: 1 }]);
  });

  // -----------------------------
  // 8. Erreur serveur
  // -----------------------------
  it("should return 500 on server error", async () => {
    hebergementModel.exec.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/hebergement");

    expect(res.statusCode).toBe(500);
    expect(res.body.code).toBe("500");
  });

});
