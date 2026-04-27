import * as dealService from "../Services/deal.service.js";

export const createDeal = async (req, res) => {
  try {
    const deal = await dealService.createDeal(req.user, req.body);
    res.status(201).json(deal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getDeals = async (req, res) => {
  try {
    const deals = await dealService.getDeals(req.user, req.query);
    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDealById = async (req, res) => {
  try {
    const deal = await dealService.getDealById(req.user, req.params.id);
    res.json(deal);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateDealStage = async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ message: "Stage is required" });

    const deal = await dealService.updateDealStage(req.user, req.params.id, stage);
    res.json(deal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateDealDetails = async (req, res) => {
  try {
    const deal = await dealService.updateDealDetails(req.user, req.params.id, req.body);
    res.json(deal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteDeal = async (req, res) => {
  try {
    const result = await dealService.deleteDeal(req.user, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addDealNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Note text is required" });

    const deal = await dealService.addDealNote(req.user, req.params.id, text);
    res.json(deal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};