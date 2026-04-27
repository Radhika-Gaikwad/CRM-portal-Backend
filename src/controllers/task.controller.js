import * as taskService from "../Services/task.service.js";

export const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.user, req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await taskService.getTasks(req.user, req.query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await taskService.updateTaskStatus(req.user, req.params.id, status);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTaskDetails = async (req, res) => {
  try {
    const task = await taskService.updateTaskDetails(req.user, req.params.id, req.body);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const result = await taskService.deleteTask(req.user, req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};