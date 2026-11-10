import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('each skill belongs to one populated panel, with a real project behind each link', () => {
  const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url), 'utf8'));
  const projects = JSON.parse(readFileSync(new URL('../data/projects.json', import.meta.url), 'utf8'));
  const groupIds = new Set(profile.skillGroups.map(group => group.id));
  assert.equal(groupIds.size, profile.skillGroups.length);
  for (const skill of profile.skills) assert.ok(groupIds.has(skill.group), skill.title);
  const projectTitles = new Set([
    ...projects.highlights,
    ...projects.projectCategories.flatMap(category => category.projects),
  ].map(project => project.title.trim()));
  for (const group of profile.skillGroups) {
    assert.ok(profile.skills.some(skill => skill.group === group.id), group.title);
    assert.ok(projectTitles.has(group.project.trim()), group.project);
  }
});
