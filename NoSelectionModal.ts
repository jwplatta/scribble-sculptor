import { App, Modal } from 'obsidian';
// import { App, Modal, Setting } from 'obsidian';

export class NoSelectionModal extends Modal {
  constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('No text selected. Please select some text.');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
