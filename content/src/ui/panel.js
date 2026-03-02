export class CornerMessage {
  constructor(root, text, duration = 4000) {
    this.root = root;
    this.text = text;
    this.duration = duration;
  }

  show() {
    const panel = document.createElement('div');
    panel.className = 'msg-panel';

    panel.style.bottom = '-10%'; 

    const msg = document.createElement('div');
    msg.className = 'msg';
    msg.innerText = this.text;

    panel.appendChild(msg);
    this.root.appendChild(panel);

    // ? To solve browser batching problem  
    requestAnimationFrame(() => {
      panel.style.bottom = '5%'; 
    });

    setTimeout(() => {
      panel.style.bottom = '-10%';
      setTimeout(() => panel.remove(), 1000); 
    }, this.duration);
  }
}
