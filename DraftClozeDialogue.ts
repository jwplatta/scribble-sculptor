import { App, Modal, Editor, TextAreaComponent, TextComponent, ButtonComponent } from 'obsidian';
import { OpenAITextCompletion } from 'OpenAITextCompletion';

export class DraftClozeDialogue extends Modal {
	sourceText: string;
	originalSourceText: string;
	draftedCloze: string;
	keywords: string;
	editor: Editor;
  app: App;
	textCompletion: OpenAITextCompletion;

	constructor(app: App, editor: Editor, sourceText: string, originalSourceText: string, textCompletion: OpenAITextCompletion) {
		super(app);
    this.app = app;
		this.sourceText = sourceText;
		this.originalSourceText = originalSourceText;
		this.editor = editor;
		this.textCompletion = textCompletion;
	}

	async draftCloze() {
		const prompt = `Write cloze question about the main idea of the text focusing on the keywords. Increment each cloze as c1, c2, c3, etc.\n"""Examples:\n- {{c1::Polar coordinates}} is the method of specifying a point with a {{c2::length}} and a {{c3::direction}}.\n- If the primal is {{c1::infeasible}}, then the dual is {{c2::unbounbed or infeasible}}.\n"""\nkeywords: ${this.keywords}\n"""\ntext: ${this.sourceText}\n"""\ncloze:`.trim();

		const draft = await this.textCompletion.post(prompt);
		return draft;
	}

	clozeTemplate(clozeText: string): string {
		const cloze = `START\nCloze\n${clozeText}\nExtra:\nTags:\nEND`
		return cloze;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setAttr("class", "scribble-sculptor-modal");

		contentEl.createEl("h2", { text: "Selected Text" });

		const selectedTextInput = new TextAreaComponent(contentEl);
		selectedTextInput.setValue(this.sourceText);
		selectedTextInput.inputEl.style.width = "100%";
    selectedTextInput.inputEl.style.height = "10rem";
		selectedTextInput.onChange((value) => {
			this.sourceText = value;
		});

		const keywordsTextInput = new TextComponent(contentEl)
    keywordsTextInput.setPlaceholder("Enter keywords to focus on...")
    keywordsTextInput.then((cb) => {
      cb.inputEl.setAttr("style", "margin-top: 5px; width: 100%;");
    })
    keywordsTextInput.onChange((value) => {
      this.keywords = value;
    });

		const draftButtonDiv = contentEl.createDiv();
		draftButtonDiv.setAttr("style", "margin-top: 5px;")

    const draftButton = new ButtonComponent(draftButtonDiv);
    draftButton.setButtonText("Draft flashcard");
    draftButton.onClick(() => {
			draftButton.setDisabled(true);
			selectedTextInput.setDisabled(true);
			draftedClozeText.setDisabled(true);
			keywordsTextInput.setDisabled(true);

			this.draftCloze().then((draft) => {
				this.draftedCloze = this.clozeTemplate(draft.trim());
				draftedClozeText.setValue(this.draftedCloze);
				draftButton.setDisabled(false);
				selectedTextInput.setDisabled(false);
				draftedClozeText.setDisabled(false);
				keywordsTextInput.setDisabled(false);
			});
    });

		contentEl.createEl("hr");
    contentEl.createEl("h2", { text: "Cloze Flashcard" });

		const draftedClozeText = new TextAreaComponent(contentEl);
		draftedClozeText.then((cb) => {
      cb.inputEl.setAttr("style", "margin-top: 5px; width: 100%; height: 10rem;");
    })
		draftedClozeText.onChange((value) => {
			this.draftedCloze = value;
		})

		const useButtonDiv = contentEl.createDiv();
		useButtonDiv.setAttr("style", "margin-top: 5px;");

		const useButton = new ButtonComponent(useButtonDiv)
    useButton.setButtonText("Use");
    useButton.onClick(() => {
      this.close();
			if (this.draftedCloze) {
				const selectionWithDraft = this.originalSourceText + "\n\n" + this.draftedCloze.trim() + "\n";
				this.editor.replaceSelection(selectionWithDraft);
			}
    })
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}