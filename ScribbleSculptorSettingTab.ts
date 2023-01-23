import { App, PluginSettingTab, Setting } from 'obsidian';
import ScribbleSculptor from 'main';

export class ScribbleSculptorSettingTab extends PluginSettingTab {
	plugin: ScribbleSculptor;

	constructor(app: App, plugin: ScribbleSculptor) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('OpenAI Key')
			.setDesc('OpenAI developer key')
			.addText((text) => {
				text
					.setPlaceholder('Enter key')
					.setValue(this.plugin.settings.openAIKey)
					.onChange(async (value) => {
						console.log('Secret: ' + value);
						this.plugin.settings.openAIKey = value;
						await this.plugin.saveSettings();
					})
					.then((cb) => {
						cb.inputEl.style.width = '100%';
					})
				}
			);
	}
}