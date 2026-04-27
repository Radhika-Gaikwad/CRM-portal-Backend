import * as settingsService from "../services/settings.service.js";

export const getSettings = async (req, res) => {
  try {
    const settings = await settingsService.getSettings(req.user);
    res.status(200).json(settings);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const settings = await settingsService.updateSettings(req.user, req.body);
    res.status(200).json(settings);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};