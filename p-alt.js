class PAltElement extends HTMLElement {
    constructor() {
        super();
        this.originalContent = this.innerHTML;
        this.alternatives = [];
        this.selectedIndex = -1; // -1 means showing original content
        this.attachShadow({ mode: 'open' });
        this.setupStyles();
        this.setupContent();
        this.setupEventListeners();
    }

    setupStyles() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    padding: 0.5em;
                    border-radius: 4px;
                }

                :host(:hover) {
                    background: rgba(75, 0, 130, 0.05);
                }

                .content {
                    position: relative;
                    cursor: pointer;
                }

                .content::after {
                    content: "⋮";
                    position: absolute;
                    right: -20px;
                    top: 50%;
                    transform: translateY(-50%);
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                :host(:hover) .content::after {
                    opacity: 0.5;
                }

                .popup {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    min-width: 200px;
                    z-index: 1000;
                    display: none;
                }

                .popup.active {
                    display: block;
                }

                .popup-item {
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .popup-item:hover {
                    background: #f5f5f5;
                }

                .popup-item.selected {
                    background: #4B0082;
                    color: white;
                }

                .popup-divider {
                    height: 1px;
                    background: #ddd;
                    margin: 4px 0;
                }

                .popup-button {
                    display: block;
                    width: 100%;
                    padding: 8px 16px;
                    border: none;
                    background: none;
                    text-align: left;
                    font: inherit;
                    cursor: pointer;
                    color: #4B0082;
                }

                .popup-button:hover {
                    background: #f5f5f5;
                }
            </style>
            <div class="content">
                <slot></slot>
            </div>
            <div class="popup" role="menu">
                <div class="popup-item original" role="menuitem">Original Content</div>
                <div class="alternatives-container"></div>
                <div class="popup-divider"></div>
                <button class="popup-button generate-alt" role="menuitem">
                    Generate Alternative
                </button>
                <button class="popup-button reset" role="menuitem">
                    Reset to Original
                </button>
            </div>
        `;
    }

    setupContent() {
        // Parse alternatives from data-alt attribute
        try {
            const altData = this.getAttribute('data-alt');
            if (altData) {
                this.alternatives = JSON.parse(altData);
                this.updateAlternativesUI();
            }
        } catch (e) {
            console.error('Error parsing alternatives:', e);
        }
    }

    setupEventListeners() {
        const content = this.shadowRoot.querySelector('.content');
        const popup = this.shadowRoot.querySelector('.popup');
        const generateBtn = popup.querySelector('.generate-alt');
        const resetBtn = popup.querySelector('.reset');
        const originalBtn = popup.querySelector('.original');

        // Toggle popup on content click
        content.addEventListener('click', (e) => {
            popup.classList.toggle('active');
            e.stopPropagation();
        });

        // Close popup when clicking outside
        document.addEventListener('click', () => {
            popup.classList.remove('active');
        });

        // Prevent popup close when clicking inside
        popup.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Handle generate button click
        generateBtn.addEventListener('click', () => {
            this.generateAlternative();
        });

        // Handle reset button click
        resetBtn.addEventListener('click', () => {
            this.reset();
        });

        // Handle original content selection
        originalBtn.addEventListener('click', () => {
            this.selectAlternative(-1);
        });
    }

    updateAlternativesUI() {
        const container = this.shadowRoot.querySelector('.alternatives-container');
        container.innerHTML = '';

        this.alternatives.forEach((alt, index) => {
            const item = document.createElement('div');
            item.className = 'popup-item';
            item.setAttribute('role', 'menuitem');
            item.textContent = alt.substring(0, 50) + (alt.length > 50 ? '...' : '');
            
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            }

            item.addEventListener('click', () => {
                this.selectAlternative(index);
            });

            container.appendChild(item);
        });
    }

    async generateAlternative() {
        // In a real implementation, this would call an LLM API
        // For now, we'll simulate it with a timeout
        const popup = this.shadowRoot.querySelector('.popup');
        const generateBtn = popup.querySelector('.generate-alt');
        generateBtn.textContent = 'Generating...';
        generateBtn.disabled = true;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const newAlt = `Generated alternative ${this.alternatives.length + 1} for: ${this.originalContent}`;
            this.alternatives.push(newAlt);
            this.updateAlternativesUI();
            this.selectAlternative(this.alternatives.length - 1);
        } catch (e) {
            console.error('Error generating alternative:', e);
        } finally {
            generateBtn.textContent = 'Generate Alternative';
            generateBtn.disabled = false;
        }
    }

    selectAlternative(index) {
        this.selectedIndex = index;
        if (index === -1) {
            this.innerHTML = this.originalContent;
        } else {
            this.innerHTML = this.alternatives[index];
        }
        this.updateAlternativesUI();
        
        // Close popup after selection
        this.shadowRoot.querySelector('.popup').classList.remove('active');

        // Dispatch change event
        this.dispatchEvent(new CustomEvent('alternativechange', {
            detail: { selectedIndex: index }
        }));
    }

    reset() {
        this.selectAlternative(-1);
    }

    // Lifecycle callbacks
    connectedCallback() {
        if (!this.hasAttribute('role')) {
            this.setAttribute('role', 'paragraph');
        }
    }

    static get observedAttributes() {
        return ['data-alt'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-alt' && oldValue !== newValue) {
            try {
                this.alternatives = JSON.parse(newValue);
                this.updateAlternativesUI();
            } catch (e) {
                console.error('Error parsing alternatives:', e);
            }
        }
    }
}

// Register the custom element
customElements.define('p-alt', PAltElement);
