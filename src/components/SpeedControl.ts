export interface SpeedControlOptions {
  onChange: (multiplier: number) => void;
  defaultValue?: number;
}

export class SpeedControl {
  private container: HTMLDivElement;
  private select: HTMLSelectElement;

  constructor(options: SpeedControlOptions) {
    // Create container
    this.container = document.createElement("div");
    this.container.style.position = "absolute";
    this.container.style.top = "20px";
    this.container.style.left = "20px";
    this.container.style.background = "rgba(0, 0, 0, 0.7)";
    this.container.style.padding = "15px";
    this.container.style.borderRadius = "8px";
    this.container.style.color = "white";
    this.container.style.fontFamily = "Arial, sans-serif";
    this.container.style.fontSize = "14px";
    this.container.style.zIndex = "1000";

    // Create label
    const label = document.createElement("label");
    label.textContent = "Rotation Speed: ";
    label.style.marginRight = "10px";

    // Create select
    this.select = document.createElement("select");
    this.select.style.padding = "5px";
    this.select.style.borderRadius = "4px";
    this.select.style.cursor = "pointer";

    // Add options
    const speedOptions = [
      { value: "1", text: "Real-time (1x)" },
      { value: "100", text: "Fast (100x - ~14 min/day)" },
      { value: "500", text: "Faster (500x - ~3 min/day)" },
      { value: "1440", text: "Very Fast (1440x - 1 min/day)" },
    ];

    speedOptions.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.text;
      if (options.defaultValue && parseFloat(opt.value) === options.defaultValue) {
        option.selected = true;
      }
      this.select.appendChild(option);
    });

    // Add event listener
    this.select.addEventListener("change", (e) => {
      const multiplier = parseFloat((e.target as HTMLSelectElement).value);
      options.onChange(multiplier);
    });

    // Assemble
    this.container.appendChild(label);
    this.container.appendChild(this.select);
  }

  appendTo(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  remove(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }

  getElement(): HTMLDivElement {
    return this.container;
  }
}
