import * as teamService from "../Services/team.service.js";

export const createTeam = async (req, res) => {
  try {
    const team = await teamService.createTeam(req.user, req.body);
    res.status(201).json(team);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const getTeams = async (req, res) => {
  try {
    const teams = await teamService.getTeams(req.user, req.query);
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeamById = async (req, res) => {
  try {
    const team = await teamService.getTeamById(req.user, req.params.id);
    res.status(200).json(team);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const team = await teamService.updateTeam(req.user, req.params.id, req.body);
    res.status(200).json(team);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const addTeamMember = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "Executive User ID is required" });

    const team = await teamService.addTeamMember(req.user, req.params.id, userId);
    res.status(200).json(team);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const removeTeamMember = async (req, res) => {
  try {
    const team = await teamService.removeTeamMember(req.user, req.params.id, req.params.userId);
    res.status(200).json(team);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const response = await teamService.deleteTeam(req.user, req.params.id);
    res.status(200).json(response);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};