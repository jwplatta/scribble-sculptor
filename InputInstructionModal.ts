import { App, Modal, Editor, TextAreaComponent, ButtonComponent } from 'obsidian';
import { OpenAITextCompletion } from 'OpenAITextCompletion';


class DraftCompletionModal extends Modal {
  sourceText: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;
  draftCompletion: string;

  constructor(app: App, editor: Editor, sourceText: string, draftCompletion: string, textCompletion: OpenAITextCompletion) {
    super(app);
    this.app = app;
		this.editor = editor;
		this.sourceText = sourceText;
    this.draftCompletion = draftCompletion.trim();
		this.textCompletion = textCompletion;
  }

  onOpen() {
    const { contentEl } = this;

    const textAreaDiv = contentEl.createDiv();
    textAreaDiv.setAttr("style", "padding-top: 20px;");

    const textArea = new TextAreaComponent(textAreaDiv);
    textArea.setValue(this.draftCompletion);
    textArea.inputEl.style.width = "100%";
    textArea.inputEl.style.height = "20rem";
    textArea.onChange((value) => {
      this.draftCompletion = value;
    })

    const footerDiv = contentEl.createDiv();
    footerDiv.setAttr("style", "padding-top: 5px;");

    const useDraftButton = new ButtonComponent(footerDiv);
    useDraftButton.setButtonText("Use");
    useDraftButton.onClick(() => {
      this.close();
      const selectionWithDraft = this.sourceText + "\n\n" + this.draftCompletion.trim() + "\n";
      this.editor.replaceSelection(selectionWithDraft);
    });
    useDraftButton.then((cb) => {
      cb.buttonEl.setAttr("style", "margin: 2px;")
    })

    const tryAgainButton = new ButtonComponent(footerDiv);
    tryAgainButton.setButtonText("Try again");
    tryAgainButton.onClick(() => {
      this.close()
      new InputInstructionModal(this.app, this.editor, this.sourceText, this.textCompletion).open();
    });
    tryAgainButton.then((cb) => {
      cb.buttonEl.setAttr("style", "margin: 2px;")
    })

  }
}

class ApplyingInstructionbModal extends Modal {
  sourceText: string;
  instructionText: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;

  constructor(app: App, editor: Editor, sourceText: string, instructionText: string, textCompletion: OpenAITextCompletion) {
    super(app);
    this.app = app;
		this.sourceText = sourceText;
		this.editor = editor;
    this.instructionText = instructionText;
		this.textCompletion = textCompletion;
  }

  async applyInstruction() {
    const prompt = `Apply the instruction to the text.\n"""instruction: ${this.instructionText.trim()}\n"""\ntext:${this.sourceText.trim()}"""\n`.trim()
    const result = await this.textCompletion.post(prompt);
    return result;
  }

  onOpen() {
    const {contentEl} = this;
    contentEl.createEl("p", { text: "Generating text completion..."})
    this.applyInstruction().then((draft) => {
      this.close();
      new DraftCompletionModal(this.app, this.editor,this.sourceText, draft, this.textCompletion).open();
    })
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export class InputInstructionModal extends Modal {
  sourceText: string;
  instructionText: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;

  constructor(app: App, editor: Editor, sourceText: string, textCompletion: OpenAITextCompletion) {
		super(app);
    this.app = app;
    this.editor = editor;
    this.sourceText = sourceText.trim();
    this.textCompletion = textCompletion;
	}

	onOpen() {
		const {contentEl} = this;
    contentEl.createEl("h3", { text: "Selected Text:" }).setAttribute("style", "margin-top: 20px;");
    contentEl.createEl("p", { text: this.sourceText });

    contentEl.createEl("hr");

    contentEl.createEl("p", { text: "What do you want to do with the selected text?"})

    const textArea = new TextAreaComponent(contentEl);
    textArea.inputEl.style.width = "100%";
    textArea.inputEl.style.height = "10rem";

    textArea.onChange((value) => {
      this.instructionText = value;
    })

    const footerDiv = contentEl.createDiv();
    footerDiv.setAttr("style", "padding-top: 5px;");

    const submitButton = new ButtonComponent(footerDiv);
    submitButton.setButtonText("Apply");
    submitButton.onClick(() => {
      this.close();
      new ApplyingInstructionbModal(this.app, this.editor, this.sourceText, this.instructionText, this.textCompletion).open()
    });
    submitButton.then((cb) => {
      cb.buttonEl.setAttr("style", "margin: 2px;");
    })
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
