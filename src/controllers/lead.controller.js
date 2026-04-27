import * as leadService from "../Services/lead.service.js";

export const getLeads = async (req, res) => {
  try {
    const leads = await leadService.getLeads(req.user, req.query);
    res.status(200).json({ success: true, count: leads.length, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeadById = async (req, res) => {
  try {
    const lead = await leadService.getLeadById(req.user, req.params.id);
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createLead = async (req, res) => {
  try {
    const lead = await leadService.createLead(req.user, req.body);
    res.status(201).json({ success: true, message: "Lead created successfully", data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const lead = await leadService.updateLead(req.user, req.params.id, req.body);
    res.status(200).json({ success: true, message: "Lead updated successfully", data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const result = await leadService.deleteLead(req.user, req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignLead = async (req, res) => {
  try {
    const lead = await leadService.assignLead(req.user, req.params.id, req.body);
    res.status(200).json({ success: true, message: "Lead assigned successfully", data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateLeadStatus = async (req, res) => {
  try {
    const lead = await leadService.updateLeadStatus(req.user, req.params.id, req.body.status);
    res.status(200).json({ success: true, message: "Status updated successfully", data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addNote = async (req, res) => {
  try {
    const { text, noteId } = req.body;
    const lead = await leadService.addNote(req.user, req.params.id, text, noteId);
    res.status(200).json({ success: true, message: "Note processed successfully", data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addActivity = async (req, res) => {
  try {
    const lead = await leadService.addActivity(req.user, req.params.id, req.body);
    res.status(200).json({ success: true, message: "Activity added successfully", data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};