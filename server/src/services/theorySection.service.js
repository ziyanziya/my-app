const theorySectionRepo = require('../repositories/theorySection.repo');

async function createSection(payload) {
  return theorySectionRepo.createSection(payload);
}

async function updateSection(id, payload) {
  return theorySectionRepo.updateSection(id, payload);
}

async function deleteSection(id) {
  return theorySectionRepo.deleteSection(id);
}

async function reorderSections(sections = []) {
  return theorySectionRepo.reorderSections(sections);
}

async function getSectionById(id) {
  return theorySectionRepo.findById(id);
}

async function getSectionsByWorshipId(worshipId) {
  return theorySectionRepo.findByWorshipId(worshipId);
}

module.exports = { createSection, updateSection, deleteSection, reorderSections, getSectionById, getSectionsByWorshipId };
