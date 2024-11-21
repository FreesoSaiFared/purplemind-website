import { MikiSection } from './chatgpt-bridge.js';

class MikiPage extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.setupStyles();
        this.setupContent();
    }

    setupStyles() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 2rem;
                    background: white;
                    border-radius: 8px;
                    color: #333;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .page-title {
                    font-size: 2rem;
                    color: #4B0082;
                    margin: 0;
                }

                .add-section {
                    background: #4B0082;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.3s;
                }

                .add-section:hover {
                    background: #6A0DAD;
                }

                .content {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
            </style>
            <div class="page-header">
                <h1 class="page-title"></h1>
                <button class="add-section">Add Section</button>
            </div>
            <div class="content">
                <slot></slot>
            </div>
        `;
    }

    setupContent() {
        const title = this.getAttribute('page-title') || 'Untitled Page';
        this.shadowRoot.querySelector('.page-title').textContent = title;

        const addButton = this.shadowRoot.querySelector('.add-section');
        addButton.addEventListener('click', () => {
            const dialog = document.createElement('miki-prompt-dialog');
            dialog.setAttribute('mode', 'create');
            document.body.appendChild(dialog);
        });
    }

    toWikiMarkup() {
        const sections = Array.from(this.querySelectorAll('miki-section'));
        return sections.map(section => section.toWikiMarkup()).join('\n\n');
    }
}

class MikiPromptDialog extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.setupStyles();
        this.setupContent();
    }

    setupStyles() {
        this.shadowRoot.innerHTML = `
            <style>
                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .dialog {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .prompt-chain {
                    margin: 1rem 0;
                }

                .prompt-item {
                    display: flex;
                    align-items: center;
                    padding: 1rem;
                    border: 1px solid #ddd;
                    margin: 0.5rem 0;
                    border-radius: 4px;
                }

                .prompt-content {
                    flex-grow: 1;
                }

                .vote-buttons {
                    display: flex;
                    gap: 0.5rem;
                    margin-left: 1rem;
                }

                .vote-button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                }

                .vote-button:hover {
                    background: #f0f0f0;
                }

                .vote-count {
                    display: inline-block;
                    min-width: 2rem;
                    text-align: center;
                }

                .new-prompt {
                    margin: 1rem 0;
                }

                .prompt-input {
                    width: 100%;
                    padding: 1rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin: 0.5rem 0;
                    font-family: inherit;
                    resize: vertical;
                }

                .button-row {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .dialog-button {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .primary {
                    background: #4B0082;
                    color: white;
                }

                .secondary {
                    background: #ddd;
                }

                .timestamp {
                    font-size: 0.8rem;
                    color: #666;
                    margin-top: 0.5rem;
                }
            </style>
            <div class="overlay">
                <div class="dialog">
                    <h2>Edit Content</h2>
                    <div class="prompt-chain"></div>
                    <div class="new-prompt">
                        <h3>Add New Prompt</h3>
                        <textarea class="prompt-input" rows="3" placeholder="Enter your prompt..."></textarea>
                    </div>
                    <div class="button-row">
                        <button class="dialog-button secondary" id="cancel">Cancel</button>
                        <button class="dialog-button primary" id="apply">Apply Changes</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupContent() {
        const mode = this.getAttribute('mode');
        const chainContainer = this.shadowRoot.querySelector('.prompt-chain');
        
        if (mode === 'edit' && this.section) {
            this.renderPromptChain(chainContainer);
        }

        this.shadowRoot.querySelector('#cancel').addEventListener('click', () => {
            this.remove();
        });

        this.shadowRoot.querySelector('#apply').addEventListener('click', async () => {
            const newPrompt = this.shadowRoot.querySelector('.prompt-input').value;
            if (newPrompt && this.section) {
                this.section.addPrompt(newPrompt);
                await this.section.regenerateContent();
            }
            this.remove();
        });

        this.shadowRoot.querySelector('.overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.remove();
        });
    }

    renderPromptChain(container) {
        container.innerHTML = '<h3>Prompt History</h3>';
        
        this.section.promptChain.forEach((prompt, index) => {
            const item = document.createElement('div');
            item.className = 'prompt-item';
            
            const timestamp = new Date(prompt.timestamp).toLocaleString();
            
            item.innerHTML = `
                <div class="prompt-content">
                    <div><strong>${prompt.type === 'genesis' ? 'Genesis Prompt' : 'Revision Prompt'}</strong></div>
                    <div>${prompt.prompt}</div>
                    <div class="timestamp">${timestamp}</div>
                </div>
                <div class="vote-buttons">
                    <button class="vote-button" data-vote="up">👍</button>
                    <span class="vote-count">${prompt.votes}</span>
                    <button class="vote-button" data-vote="down">👎</button>
                </div>
            `;

            const voteButtons = item.querySelectorAll('.vote-button');
            const voteCount = item.querySelector('.vote-count');
            
            voteButtons.forEach(button => {
                button.addEventListener('click', async () => {
                    const vote = button.dataset.vote === 'up' ? 1 : -1;
                    this.section.promptChain[index].votes += vote;
                    voteCount.textContent = this.section.promptChain[index].votes;
                    
                    if (this.section.promptChain[index].votes < 0) {
                        await this.section.regenerateContent();
                    }
                });
            });

            container.appendChild(item);
        });
    }
}

// Navigation system
class MikiNav {
    static init() {
        window.addEventListener('popstate', this.handleNavigation.bind(this));
        document.addEventListener('click', this.handleClick.bind(this));
    }

    static handleClick(e) {
        if (e.target.matches('.miki-link')) {
            e.preventDefault();
            const href = e.target.getAttribute('href');
            this.navigateTo(href);
        }
    }

    static async navigateTo(path) {
        history.pushState({}, '', path);
        await this.handleNavigation();
    }

    static async handleNavigation() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop() || 'index';
        
        const content = `
            <miki-page page-title="${pageName}">
                <miki-section metaprompt="Initial page content">
                    Welcome to ${pageName}. Click anywhere in this text to begin editing through prompts.
                </miki-section>
            </miki-page>
        `;
        
        document.querySelector('main').innerHTML = content;
    }

    static createNewPage(title) {
        const safePath = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        this.navigateTo(`/${safePath}`);
    }
}

// Register custom elements
customElements.define('miki-page', MikiPage);
customElements.define('miki-prompt-dialog', MikiPromptDialog);

// Initialize navigation
MikiNav.init();

// Export for use in other modules
export { MikiPage, MikiPromptDialog, MikiNav };
