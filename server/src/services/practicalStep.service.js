const practicalStepRepo = require('../repositories/practicalStep.repo');

async function createStep(payload) {
  return practicalStepRepo.createStep(payload);
}

async function updateStep(id, payload) {
  return practicalStepRepo.updateStep(id, payload);
}

async function deleteStep(id) {
  return practicalStepRepo.deleteStep(id);
}

async function reorderSteps(steps = []) {
  return practicalStepRepo.reorderSteps(steps);
}

async function getStepById(id) {
  return practicalStepRepo.findById(id);
}

async function getStepsByWorshipId(worshipId) {
  return practicalStepRepo.findByWorshipId(worshipId);
}

module.exports = { createStep, updateStep, deleteStep, reorderSteps, getStepById, getStepsByWorshipId };
