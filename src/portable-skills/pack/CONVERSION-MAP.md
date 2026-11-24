# Conversion map

Source skill | Antigravity skill | Capability status
--- | --- | ---
local-runtime | agy-local-runtime | local-helper-tested
documents | agy-documents | workflow-adapted
spreadsheets | agy-spreadsheets | workflow-adapted
presentations | agy-presentations | workflow-adapted
pdf | agy-pdf | workflow-adapted
excel-live-control | agy-excel-live-control | requires-excel-or-desktop-tool
computer-use | agy-computer-use | requires-desktop-mcp
imagegen | agy-imagegen | requires-native-image-tool
visualize | agy-visualize | workflow-adapted
write-page | agy-write-page | local-substitute-not-cloud-equivalent
maintain-space | agy-maintain-space | local-substitute-not-cloud-equivalent
organize-space | agy-organize-space | local-substitute-not-cloud-equivalent
manage-schedules | agy-manage-schedules | requires-native-scheduling
sites | agy-sites | local-substitute-no-managed-hosting
sites-remix | agy-sites-remix | local-substitute-no-managed-hosting
plugin-management | agy-plugin-management | workflow-adapted
template-creator | agy-template-creator | workflow-adapted
skill-creator | agy-skill-creator | workflow-adapted
skill-installer | agy-skill-installer | workflow-adapted
openai-docs | agy-openai-docs | workflow-adapted
artifact-template-analytics-dashboard | agy-artifact-template-analytics-dashboard | reference-preserved-local-workflow
artifact-template-business-review | agy-artifact-template-business-review | reference-preserved-local-workflow
artifact-template-design-report | agy-artifact-template-design-report | reference-preserved-local-workflow
artifact-template-experiment-analysis | agy-artifact-template-experiment-analysis | reference-preserved-local-workflow
artifact-template-financial-budget | agy-artifact-template-financial-budget | reference-preserved-local-workflow
artifact-template-investment-committee-memo | agy-artifact-template-investment-committee-memo | reference-preserved-local-workflow
artifact-template-legal-memorandum | agy-artifact-template-legal-memorandum | reference-preserved-local-workflow
artifact-template-market-trends-report | agy-artifact-template-market-trends-report | reference-preserved-local-workflow
artifact-template-minimal-letterhead | agy-artifact-template-minimal-letterhead | reference-preserved-local-workflow
artifact-template-operating-calendar | agy-artifact-template-operating-calendar | reference-preserved-local-workflow
artifact-template-operating-review | agy-artifact-template-operating-review | reference-preserved-local-workflow
artifact-template-project-kickoff | agy-artifact-template-project-kickoff | reference-preserved-local-workflow
artifact-template-project-tracker | agy-artifact-template-project-tracker | reference-preserved-local-workflow
artifact-template-sales-pipeline | agy-artifact-template-sales-pipeline | reference-preserved-local-workflow
artifact-template-simple-dark-mode | agy-artifact-template-simple-dark-mode | reference-preserved-local-workflow
artifact-template-simple-light-mode | agy-artifact-template-simple-light-mode | reference-preserved-local-workflow
artifact-template-strategy-memorandum | agy-artifact-template-strategy-memorandum | reference-preserved-local-workflow
artifact-template-system-design | agy-artifact-template-system-design | reference-preserved-local-workflow
artifact-template-team-alignment | agy-artifact-template-team-alignment | reference-preserved-local-workflow
artifact-template-three-statement-forecast | agy-artifact-template-three-statement-forecast | reference-preserved-local-workflow

## Unavailable account-specific capabilities

- create-pet: ChatGPT pet registration, uploads and activation have no equivalent account service in this pack. Image/sprite assets can be authored through agy-imagegen, but that does not install a pet.
- pets: Listing, selecting and deleting ChatGPT account pets requires the original account service; a local asset directory is not equivalent.
- update-pet: Updating a stable ChatGPT pet ID requires the original service. No replacement endpoint is invented.
- create-statusline: This configures the Codex CLI footer, not an Antigravity App capability. It is not auto-activated.
