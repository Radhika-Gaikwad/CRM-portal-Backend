import * as activityService from "../Services/activity.service.js";

export const createActivity = async (req, res) => {
  try {
    const activity = await activityService.createActivity(req.user, req.body);
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getActivities = async (req, res) => {
  try {
    const activities = await activityService.getActivities(req.user, req.query);
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActivityById = async (req, res) => {
  try {
    const activity = await activityService.getActivityById(req.user, req.params.id);
    res.status(200).json(activity);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const updateActivity = async (req, res) => {
  try {
    const activity = await activityService.updateActivity(req.user, req.params.id, req.body);
    res.status(200).json(activity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const response = await activityService.deleteActivity(req.user, req.params.id);
    res.status(200).json(response);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};