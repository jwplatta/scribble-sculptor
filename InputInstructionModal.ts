import { App, Modal, Editor, TextAreaComponent, ButtonComponent } from 'obsidian';
import { OpenAITextCompletion } from 'OpenAITextCompletion';


class ApplyingInstructionModal extends Modal {
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
      const selectionWithDraft = this.sourceText + "\n\n" + draft.trim() + "\n";
      this.editor.replaceSelection(selectionWithDraft);
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
      new ApplyingInstructionModal(this.app, this.editor, this.sourceText, this.instructionText, this.textCompletion).open()
    });
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
