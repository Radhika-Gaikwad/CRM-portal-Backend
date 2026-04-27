import * as customerService from "../Services/customer.service.js";

export const getCustomers = async (req, res) => {
  try {
    const customers = await customerService.getCustomers(req.user, req.query);
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.user, req.params.id);
    res.status(200).json(customer);
  } catch (error) {
    res.status(403).json({ message: error.message }); // 403 Forbidden for RBAC failures
  }
};

export const addCustomerNote = async (req, res) => {
  try {
    const customer = await customerService.addCustomerNote(req.user, req.params.id, req.body.text);
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const logSupportCall = async (req, res) => {
  try {
    const customer = await customerService.logSupportCall(req.user, req.params.id, req.body);
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateAccountStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Account status is required" });

    const customer = await customerService.updateAccountStatus(req.user, req.params.id, status);
    res.status(200).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};