import { App, Modal, Editor, TextAreaComponent, TextComponent, ButtonComponent } from 'obsidian';
import { OpenAITextCompletion } from 'OpenAITextCompletion';

class DraftingClozeModal extends Modal {
	sourceText: string;
	originalSourceText: string;
	keywords: string;
	editor: Editor;
  app: App;
	textCompletion: OpenAITextCompletion;
	draftedCloze: string

	constructor(app: App, editor: Editor, sourceText: string, originalSourceText: string, keywords: string, textCompletion: OpenAITextCompletion) {
		super(app);
    this.app = app;
		this.sourceText = sourceText;
		this.originalSourceText = originalSourceText;
		this.editor = editor;
		this.keywords = keywords;
		this.textCompletion = textCompletion;
	}

	async draftCloze() {
		const prompt = `Write cloze question about the main idea of the text focusing on the keywords. Increment each cloze as c1, c2, c3, etc.\n"""Examples:\n- {{c1::Polar coordinates}} is the method of specifying a point with a {{c2::length}} and a {{c3::direction}}.\n- If the primal is {{c1::infeasible}}, then the dual is {{c2::unbounbed or infeasible}}.\n"""\nkeywords: ${this.keywords}\n"""\ntext: ${this.sourceText}\n"""\ncloze:`.trim();

		const draft = await this.textCompletion.post(prompt);

		return draft;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("p", { text: "Generating a new cloze..."});

		this.draftCloze().then((draft) => {
			this.close();
			new DraftClozeModal(this.app, this.editor, this.sourceText, this.originalSourceText, this.textCompletion, draft).open();
		})
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class DraftClozeModal extends Modal {
	sourceText: string;
	originalSourceText: string;
	editor: Editor;
  app: App;
	textCompletion: OpenAITextCompletion;
	draftCloze: string
	flashcard: string;

	constructor(app: App, editor: Editor, sourceText: string, originalSourceText: string, textCompletion: OpenAITextCompletion, draftCloze: string) {
		super(app);
    this.app = app;
		this.sourceText = sourceText;
		this.originalSourceText = originalSourceText;
		this.editor = editor;
		this.textCompletion = textCompletion;
		this.draftCloze = draftCloze.trim()

	}

	clozeTemplate(clozeText: string): string {
		const cloze = `START\nCloze\n${clozeText}\nExtra:\nTags:\nEND`
		return cloze;
	}

	onOpen() {
		const { contentEl } = this;

		this.flashcard = this.clozeTemplate(this.draftCloze);

		const mainDiv = contentEl.createDiv();
    mainDiv.createEl("h2", { text: "Draft Flashcard"});

    const flashcardTextArea = new TextAreaComponent(mainDiv);
    flashcardTextArea.setValue(this.flashcard);
    flashcardTextArea.inputEl.style.width = "100%";
    flashcardTextArea.inputEl.style.height = "20rem";
    flashcardTextArea.onChange((value) => {
      this.flashcard = value;
    });

		const footerDiv = contentEl.createDiv();
    footerDiv.setAttr("style", "margin-top: 5px;");

    const useButton = new ButtonComponent(footerDiv)
    useButton.setButtonText("Use");
    useButton.onClick(() => {
      this.close();
      const selectionWithDraft = this.originalSourceText + "\n\n" + this.flashcard.trim() + "\n";
      this.editor.replaceSelection(selectionWithDraft);
    })
    useButton.then((cb) => {
      cb.buttonEl.setAttr("style", "margin: 2px;");
    })

    const restartButton = new ButtonComponent(footerDiv)
    restartButton.setButtonText("Restart");
    restartButton.onClick(() => {
      this.close();
      new DraftClozeKeywordsModal(this.app, this.editor, this.originalSourceText, this.originalSourceText, this.textCompletion).open();
    })
	}
}

export class DraftClozeKeywordsModal extends Modal {
	sourceText: string;
	originalSourceText: string;
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

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Cloze Flashcard" });

		const mainDiv = contentEl.createDiv();

		const selectedTextInput = new TextAreaComponent(mainDiv);
		selectedTextInput.setValue(this.sourceText);
		selectedTextInput.inputEl.style.width = "100%";
    selectedTextInput.inputEl.style.height = "10rem";
		selectedTextInput.onChange((value) => {
			this.sourceText = value;
		})

		const keywordsTextInput = new TextComponent(mainDiv)
    keywordsTextInput.setPlaceholder("Enter focus keywords...")
    keywordsTextInput.then((cb) => {
      cb.inputEl.setAttr("style", "margin-top: 5px; width: 100%;");
    })
    keywordsTextInput.onChange((value) => {
      this.keywords = value;
    });

    const footerDiv = contentEl.createDiv();
    footerDiv.setAttr("style", "padding-top: 5px;");

    const draftButton = new ButtonComponent(footerDiv);
    draftButton.setButtonText("Draft");
    draftButton.onClick(() => {
      this.close()
      new DraftingClozeModal(this.app, this.editor, this.sourceText, this.originalSourceText, this.keywords, this.textCompletion).open()
    });
    draftButton.then((cb) => {
      cb.buttonEl.setAttr("style", "margin-top: 5x;");
    });
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}