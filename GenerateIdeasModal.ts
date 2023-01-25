import { App, Modal, Editor, TextAreaComponent, ButtonComponent } from 'obsidian';
import { OpenAITextCompletion } from 'OpenAITextCompletion';

class ApplyingInstructionbModal extends Modal {
  instructionText: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;

  constructor(app: App, editor: Editor, instructionText: string, textCompletion: OpenAITextCompletion) {
    super(app);
    this.app = app;
		this.editor = editor;
    this.instructionText = instructionText;
		this.textCompletion = textCompletion;
  }

  async applyInstruction() {
    const prompt = `Write text following the instruction.\n"""instruction: ${this.instructionText.trim()}\n"""\n`.trim()
    const result = await this.textCompletion.post(prompt);
    return result;
  }

  onOpen() {
    const {contentEl} = this;
    contentEl.createEl("p", { text: "Generating text completion..."})
    this.applyInstruction().then((draft) => {
      this.close();
      this.editor.replaceRange(draft.trim(), this.editor.getCursor());
    })
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}


export class GenerateIdeasModal extends Modal {
  instructionText: string;
  editor: Editor;
  app: App;
  textCompletion: OpenAITextCompletion;


  constructor(app: App, editor: Editor, textCompletion: OpenAITextCompletion) {
		super(app);
    this.app = app;
    this.editor = editor;
    this.textCompletion = textCompletion;
	}

  onOpen(): void {
    const {contentEl} = this;
    contentEl.createEl("h3", { text: "Generate Ideas" }).setAttribute("style", "margin-top: 20px;");
    contentEl.createEl("p", { text: "Write a brief description."});

    const textArea = new TextAreaComponent(contentEl);
    textArea.inputEl.style.width = "100%";
    textArea.inputEl.style.height = "10rem";
    textArea.onChange((value) => {
      this.instructionText = value;
    })

    const footerDiv = contentEl.createDiv();
    footerDiv.setAttr("style", "padding-top: 5px;");

    const submitButton = new ButtonComponent(footerDiv);
    submitButton.setButtonText("Generate");
    submitButton.onClick(() => {
      this.close();
      new ApplyingInstructionbModal(this.app, this.editor, this.instructionText, this.textCompletion).open()
    });


  }

  onClose(): void {

  }

}