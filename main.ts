import { App, Editor, MarkdownView, Modal, Notice, Plugin, Setting } from 'obsidian';
import { ScribbleSculptorSettingTab } from 'ScribbleSculptorSettingTab';
// import { DraftClozeKeywordsModal } from 'DraftCloze';
import { DraftClozeDialogue } from 'DraftClozeDialogue';
// import { DraftBasicFlashcardKeywordsModal } from 'DraftBasicFlashcard';
import { DraftBasicFlashcardDialogue } from 'DraftBasicFlashcardDialogue';
import { InputInstructionModal } from 'InputInstructionModal';
import { NoSelectionModal } from 'NoSelectionModal';
import { OpenAITextCompletion } from 'OpenAITextCompletion';
import { InputInstructionDialogue } from 'InputInstructionDialogue';
import { GenerateIdeasModal } from 'GenerateIdeasModal';
import { OpenAIModels } from 'OpenAIModels';
import { ExecuteGPTPromptDialogue } from 'ExecuteGPTPromptDialogue';
// const { Configuration, OpenAIApi } = require("openai");

// Remember to rename these classes and interfaces!

interface ScribbleSculptorSettings {
	openAIKey: string;
}

const DEFAULT_SETTINGS: ScribbleSculptorSettings = {
	openAIKey: ''
}

export default class ScribbleSculptor extends Plugin {
	settings: ScribbleSculptorSettings;
	openai: any;

	async openaiTextCompletion(prompt: string) {
		const requestData = JSON.stringify({
			prompt: prompt,
			max_tokens: 256,
			model: 'text-davinci-003',
			temperature: 0.5,
			frequency_penalty: 0.0,
			presence_penalty: 0.0,
			n: 1
		});

    if(!this.settings || !this.settings.openAIKey) throw new Error('OpenAI Key is not provided')

		try {
			const response = await fetch('https://api.openai.com/v1/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.settings.openAIKey}`,
				},
				body: requestData
			});

      if(!response.ok) throw new Error(response.statusText)

			const jsonResponse = await response.json();

      if(!jsonResponse || !jsonResponse.choices || !jsonResponse.choices[0] || !jsonResponse.choices[0].text) {
				throw new Error('Invalid Response from OpenAI');
			}

			return jsonResponse.choices[0].text;
		} catch(error) {
			return error;
		}
	}

	// async openaiTextCompletion(prompt: string) {
	// 	const requestData = JSON.stringify({
	// 		prompt: prompt,
	// 		max_tokens: 256,
	// 		model: 'text-davinci-003',
	// 		n: 1,
	// 		stop: ""
	// 	});

	// 	console.log(this.settings.openAIKey);

	// 	try {
	// 		const response = await fetch('https://api.openai.com/v1/completions', {
	// 			method: 'POST',
	// 			headers: {
	// 				'Content-Type': 'application/json',
	// 				'Authorization': `Bearer ${this.settings.openAIKey}`,
	// 			},
	// 			body: requestData
	// 		});

	// 		const jsonResponse = await response.json();
	// 		console.log(jsonResponse);

  //   	return jsonResponse.choices[0].text;
	// 	} catch(error) {
	// 		console.log(error);
	// 		return error;
	// 	}
	// }

	async onload() {
		await this.loadSettings();

		// Setup OpenAI interface
		// const configuration = new Configuration({
		// 	apiKey: this.settings.openAIKey,
		// });
		// this.openai = new OpenAIApi(configuration);
		// const response = await this.openai.listEngines();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'WriteingTools', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('Scribble Sculptor!');
		});

		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		this.addCommand({
			id: 'summarize-text',
			name: 'Summarize',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();

				if (selection) {
					const prompt = `
					Write a summary about the main topic of the text.

					Text: ${selection.trim()}
					Summary:`.trim();

					const textCompletion = new OpenAITextCompletion(this.settings.openAIKey);

					textCompletion.post(prompt).then((summary) => {
						const textWithSummary = selection + "\n\nSUMMARY\n" + summary.trim() + "\n\n---\n";
						editor.replaceSelection(textWithSummary);
					})
				} else {
					new NoSelectionModal(this.app).open()
				}
			}
		});

		this.addCommand({
			id: 'text-to-bullet-points',
			name: 'Make Bullets Points',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();

				if (selection) {
					const prompt = `Convert the main ideas of the text into bullet points.\n\ntext:\n"""\n${selection.trim()}\n"""`.trim()

					const textCompletion = new OpenAITextCompletion(this.settings.openAIKey);
					textCompletion.post(prompt).then((bulletPoints) => {
						const textWithSummary = selection + "\n\n" + bulletPoints.trim();
						editor.replaceSelection(textWithSummary);
					})
				} else {
					new NoSelectionModal(this.app).open()
				}
			}
		});

		this.addCommand({
			id: 'text-instruct',
			name: 'Text Instruct',
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection();

				if (selection) {
					new InputInstructionModal(this.app, editor, selection, new OpenAITextCompletion(this.settings.openAIKey)).open()
				} else {
					new NoSelectionModal(this.app).open()
				}
			}
		})

		this.addCommand({
			id: 'text-instruction-dialogue',
			name: 'Text Instruct Dialogue',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();

				if (selection) {
					new InputInstructionDialogue(this.app, editor, selection, new OpenAITextCompletion(this.settings.openAIKey)).open();
				} else {
					new NoSelectionModal(this.app).open()
				}
			}
		});

		this.addCommand({
			id: 'generate-ideas-modal',
			name: 'Generate Ideas',
			editorCallback: (editor: Editor) => {
				new GenerateIdeasModal(this.app, editor, new OpenAITextCompletion(this.settings.openAIKey)).open();
			}
		});

		this.addCommand({
			id: 'write-cloze-flashcard-dialogue',
			name: 'Write Cloze Flashcard Dialogue',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();

				if(selection) {
					new DraftClozeDialogue(this.app, editor, selection, selection, new OpenAITextCompletion(this.settings.openAIKey)).open();
				} else {
					new NoSelectionModal(this.app).open()
				}
			}
		});

		this.addCommand({
			id: 'write-basic-flashcard-dialogue',
			name: 'Write Basic Flashcard Dialogue',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();

				if (selection) {
					new DraftBasicFlashcardDialogue(this.app, editor, selection, selection, new OpenAITextCompletion(this.settings.openAIKey)).open();
				} else {
					new NoSelectionModal(this.app).open()
				}
			}
		});

		this.addCommand({
			id: 'execute-gpt-prompt',
			name: 'Execute GPT Prompt',
			editorCallback: (editor: Editor) => {
				const prompt = editor.getSelection();

				if (prompt) {
					const textCompletion = new OpenAITextCompletion(this.settings.openAIKey)
					textCompletion.post(prompt).then((completion) => {
						editor.replaceRange(completion.trim(), editor.getCursor());
					})
				} else {
					new NoSelectionModal(this.app).open();
				}
			}
		});

		this.addCommand({
			id: 'execute-gpt-prompt-dialogue',
			name: 'Execute GPT Prompt Dialogue',
			editorCallback: (editor: Editor) => {
				// new OpenAITextCompletion(this.settings.openAIKey)
				console.log(new OpenAIModels(this.settings.openAIKey).get());
				const prompt = editor.getSelection();

				new ExecuteGPTPromptDialogue(this.app, editor, prompt, new OpenAIModels(this.settings.openAIKey), new OpenAITextCompletion(this.settings.openAIKey)).open();
			}
		});



		// this.addCommand({
		// 	id: 'test-command',
		// 	name: 'Test Command',
		// 	callback: () => {
		// 		const text_completion = new OpenAITextCompletion(this.settings.openAIKey)

		// 		text_completion.test('bar foo bar').then((prompt) => {
		// 			console.log(prompt);
		// 		})
		// 	}
		// })

		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ScribbleSculptorSettingTab(this.app, this));
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// class NewDraftModal extends Modal {
// 	result: string;
// 	onSubmit: (result: string) => void;

// 	constructor(app: App, onSubmit: (result: string) => void) {
// 		super(app);
// 		this.onSubmit = onSubmit;
// 		this.modalEl.style.width = "100%";
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.createEl("h1", { text: "Enter a prompt" });

// 		new Setting(contentEl)
// 			.addSlider((sl) =>
// 				sl.setLimits(0, 1, 0.1)
// 					.then((cb) => {
// 						cb.setValue(0.5);
// 					})
// 			)
// 			.addDropdown((dd) =>
// 				dd.addOption('foo' , 'foo')
// 					.addOption('bar' , 'bar')
// 					// .then((cb) => {
// 					// 	cb.selectEl.style.float = 'left';
// 					// })
// 			)
// 			.addTextArea((text) =>
// 				text
// 					.onChange((value) => {
// 						this.result = value;
// 					})
// 					.then((cb) => {
// 						cb.inputEl.style.marginLeft = 'auto';
// 						cb.inputEl.style.marginRight = 'auto';
// 						cb.inputEl.style.display = 'block';
// 						cb.inputEl.style.width = '100%';
// 						cb.inputEl.rows = 30;
// 					})
// 			);

// 		new Setting(contentEl)
// 			.addButton((btn) =>
// 				btn
// 					.setButtonText("Save")
// 					.setCta()
// 					.onClick(() => {
// 						this.close();
// 						this.onSubmit(this.result);
// 					}
// 				)
// 			);
// 	}

// 	onClose() {
// 		const {contentEl} = this;
// 		contentEl.empty();
// 	}
// }

// class ScribbleSculptorSettingTab extends PluginSettingTab {
// 	plugin: ScribbleSculptor;

// 	constructor(app: App, plugin: ScribbleSculptor) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const {containerEl} = this;

// 		containerEl.empty();
// 		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

// 		new Setting(containerEl)
// 			.setName('OpenAI Key')
// 			.setDesc('OpenAI developer key')
// 			.addText((text) => {
// 				text
// 					.setPlaceholder('Enter key')
// 					.setValue(this.plugin.settings.openAIKey)
// 					.onChange(async (value) => {
// 						console.log('Secret: ' + value);
// 						this.plugin.settings.openAIKey = value;
// 						await this.plugin.saveSettings();
// 					})
// 					.then((cb) => {
// 						cb.inputEl.style.width = '100%';
// 					})
// 				}
// 			);
// 	}
// }