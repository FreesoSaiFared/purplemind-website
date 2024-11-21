const questions = [
    {
        title: "What describes you best?",
        options: [
            { text: "I'm a creative thinker", icon: "fas fa-lightbulb" },
            { text: "I'm analytical and logical", icon: "fas fa-brain" },
            { text: "I'm a natural leader", icon: "fas fa-crown" },
            { text: "I'm empathetic and caring", icon: "fas fa-heart" }
        ]
    },
    {
        title: "What's your preferred work environment?",
        options: [
            { text: "Remote work from home", icon: "fas fa-home" },
            { text: "Traditional office setting", icon: "fas fa-building" },
            { text: "Flexible co-working space", icon: "fas fa-coffee" },
            { text: "Outdoor or on-the-go", icon: "fas fa-tree" }
        ]
    }
];

let currentQuestionIndex = 0;
let breadcrumbHistory = [];

function updateQuestion() {
    const question = questions[currentQuestionIndex];
    document.querySelector('.question-title').textContent = question.title;
    
    const optionsContainer = document.querySelector('.options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.setAttribute('role', 'listitem');
        optionElement.setAttribute('tabindex', '0');
        
        // Add icon and text
        optionElement.innerHTML = `
            <i class="${option.icon}" style="margin-right: 10px;"></i>
            ${option.text}
            <div class="countdown">3</div>
            <div class="progress-bar"></div>
        `;
        
        optionElement.addEventListener('mouseenter', () => startCountdown(optionElement));
        optionElement.addEventListener('mouseleave', stopCountdown);
        optionElement.addEventListener('focus', () => startCountdown(optionElement));
        optionElement.addEventListener('blur', stopCountdown);
        
        optionsContainer.appendChild(optionElement);
    });
}

let countdownInterval;
let progressInterval;

function startCountdown(element) {
    if (element.classList.contains('selected')) return;
    
    stopCountdown(); // Clear any existing countdown
    
    const countdownDisplay = element.querySelector('.countdown');
    const progressBar = element.querySelector('.progress-bar');
    let timeLeft = 3;
    
    // Show countdown immediately
    countdownDisplay.style.opacity = '1';
    countdownDisplay.style.transform = 'scale(1)';
    
    // Update countdown every second
    countdownInterval = setInterval(() => {
        timeLeft--;
        countdownDisplay.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            selectOption(element);
            stopCountdown();
        }
    }, 1000); // Changed to 1 second
    
    // Update progress bar more frequently for smooth animation
    let progress = 0;
    progressInterval = setInterval(() => {
        progress += 1;
        progressBar.style.width = `${progress * 100 / 30}%`; // 30 steps for 3 seconds
    }, 100);
}

function stopCountdown() {
    clearInterval(countdownInterval);
    clearInterval(progressInterval);
    
    document.querySelectorAll('.option').forEach(option => {
        const countdownDisplay = option.querySelector('.countdown');
        const progressBar = option.querySelector('.progress-bar');
        
        if (!option.classList.contains('selected')) {
            countdownDisplay.style.opacity = '0';
            countdownDisplay.style.transform = 'scale(0.8)';
            countdownDisplay.textContent = '3';
            progressBar.style.width = '0';
        }
    });
}

function selectOption(element) {
    if (element.classList.contains('selected')) return;
    
    // Remove selection from other options
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selection to clicked option
    element.classList.add('selected');
    
    // Update breadcrumb
    updateBreadcrumb(element.textContent.trim());
    
    // Move to next question after a delay
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            updateQuestion();
        }
    }, 1000);
}

function updateBreadcrumb(selectedOption) {
    const breadcrumbList = document.querySelector('.breadcrumb-list');
    breadcrumbHistory.push(selectedOption);
    
    const breadcrumbItem = document.createElement('li');
    breadcrumbItem.className = 'breadcrumb-item';
    breadcrumbItem.textContent = selectedOption;
    breadcrumbList.appendChild(breadcrumbItem);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateQuestion();
});
