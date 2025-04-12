document.addEventListener('DOMContentLoaded', function() {
    const expressionDisplay = document.getElementById('expression');
    const resultDisplay = document.getElementById('result');
    const historyPanel = document.getElementById('historyPanel');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');
    
    let currentInput = '0';
    let currentExpression = '';
    let lastResult = 0;
    let waitingForOperand = false;
    let history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
    
    // Initialize display
    updateDisplay();
    renderHistory();
    
    // Check for saved theme
    if (localStorage.getItem('calculatorTheme') === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggle').firstElementChild.textContent = '☀️';
    }
    
    // Check for history panel visibility
    if (localStorage.getItem('historyVisible') === 'false') {
        historyPanel.style.display = 'none';
    }
    
    // Number buttons
    document.querySelectorAll('[data-number]').forEach(button => {
        button.addEventListener('click', () => {
            inputDigit(button.getAttribute('data-number'));
        });
    });
    
    // Operator buttons
    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            
            switch(action) {
                case 'add':
                case 'subtract':
                case 'multiply':
                case 'divide':
                    handleOperator(action);
                    break;
                case 'calculate':
                    calculate();
                    break;
                case 'clear':
                    clearCalculator();
                    break;
                case 'backspace':
                    backspace();
                    break;
                case 'negate':
                    negate();
                    break;
                case 'percent':
                    percent();
                    break;
                case 'sqrt':
                    squareRoot();
                    break;
                case 'square':
                    square();
                    break;
                case 'reciprocal':
                    reciprocal();
                    break;
            }
        });
    });
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        document.getElementById('themeToggle').firstElementChild.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('calculatorTheme', isDark ? 'dark' : 'light');
    });
    
    // History toggle
    document.getElementById('historyToggle').addEventListener('click', () => {
        const isVisible = historyPanel.style.display !== 'none';
        historyPanel.style.display = isVisible ? 'none' : 'block';
        localStorage.setItem('historyVisible', !isVisible);
    });
    
    // Clear history
    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        localStorage.setItem('calculatorHistory', JSON.stringify(history));
        renderHistory();
    });
    
    // Keyboard support
    document.addEventListener('keydown', handleKeyboardInput);
    
    function inputDigit(digit) {
        if (waitingForOperand) {
            currentInput = digit;
            waitingForOperand = false;
        } else {
            currentInput = currentInput === '0' ? digit : currentInput + digit;
        }
        updateDisplay();
    }
    
    function handleOperator(operator) {
        const inputValue = parseFloat(currentInput);
        
        if (currentExpression === '') {
            currentExpression = currentInput;
        } else if (!waitingForOperand) {
            calculate(true);
        }
        
        const operatorSymbol = getOperatorSymbol(operator);
        currentExpression += ' ' + operatorSymbol + ' ';
        lastResult = parseFloat(currentInput);
        waitingForOperand = true;
        updateDisplay();
    }
    
    function getOperatorSymbol(operator) {
        switch(operator) {
            case 'add': return '+';
            case 'subtract': return '-';
            case 'multiply': return '×';
            case 'divide': return '÷';
            default: return '';
        }
    }
    
    function calculate(isChained = false) {
        if (currentExpression === '' || waitingForOperand && !isChained) return;
        
        const fullExpression = isChained ? 
            currentExpression + currentInput : 
            currentExpression + (waitingForOperand ? '' : ' ' + currentInput);
        
        try {
            // Convert to JavaScript-compatible expression
            const jsExpression = fullExpression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/%/g, '/100');
            
            const result = eval(jsExpression);
            
            if (!isFinite(result)) {
                throw new Error('Invalid calculation');
            }
            
            // Add to history only for full calculations (not chained)
            if (!isChained) {
                addToHistory(fullExpression, result);
            }
            
            currentInput = String(result);
            lastResult = result;
            
            if (!isChained) {
                currentExpression = '';
                waitingForOperand = true;
            } else {
                currentExpression = String(result);
            }
        } catch (error) {
            currentInput = 'Error';
            currentExpression = '';
            waitingForOperand = true;
        }
        
        updateDisplay();
    }
    
    function clearCalculator() {
        currentInput = '0';
        currentExpression = '';
        lastResult = 0;
        waitingForOperand = false;
        updateDisplay();
    }
    
    function backspace() {
        if (waitingForOperand) return;
        
        currentInput = currentInput.length > 1 ? 
            currentInput.slice(0, -1) : '0';
        updateDisplay();
    }
    
    function negate() {
        currentInput = String(-parseFloat(currentInput));
        updateDisplay();
    }
    
    function percent() {
        const value = parseFloat(currentInput);
        currentInput = String(value / 100);
        updateDisplay();
    }
    
    function squareRoot() {
        const value = parseFloat(currentInput);
        if (value < 0) {
            currentInput = 'Error';
        } else {
            currentInput = String(Math.sqrt(value));
            addToHistory(`√(${value})`, currentInput);
        }
        updateDisplay();
    }
    
    function square() {
        const value = parseFloat(currentInput);
        currentInput = String(value * value);
        addToHistory(`(${value})²`, currentInput);
        updateDisplay();
    }
    
    function reciprocal() {
        const value = parseFloat(currentInput);
        if (value === 0) {
            currentInput = 'Error';
        } else {
            currentInput = String(1 / value);
            addToHistory(`1/(${value})`, currentInput);
        }
        updateDisplay();
    }
    
    function updateDisplay() {
        resultDisplay.textContent = currentInput;
        expressionDisplay.textContent = currentExpression;
    }
    
    function addToHistory(expression, result) {
        if (expression === 'Error' || result === 'Error') return;
        
        history.unshift({
            expression: expression,
            result: result
        });
        
        // Keep only the last 10 entries
        if (history.length > 10) {
            history.pop();
        }
        
        localStorage.setItem('calculatorHistory', JSON.stringify(history));
        renderHistory();
    }
    
    function renderHistory() {
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'No calculations yet';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#888';
            emptyMessage.style.padding = '20px 0';
            historyList.appendChild(emptyMessage);
            return;
        }
        
        history.forEach(entry => {
            const historyEntry = document.createElement('div');
            historyEntry.className = 'history-entry';
            historyEntry.innerHTML = `
                <div class="history-expression">${entry.expression}</div>
                <div class="history-result">${entry.result}</div>
            `;
            
            historyEntry.addEventListener('click', () => {
                currentInput = entry.result;
                updateDisplay();
            });
            
            historyList.appendChild(historyEntry);
        });
    }
    
    function handleKeyboardInput(e) {
        if (/[0-9.]/.test(e.key)) {
            // Handle numbers and decimal point
            inputDigit(e.key);
        } else if (e.key === 'Enter' || e.key === '=') {
            // Handle equals
            calculate();
        } else if (e.key === 'Escape') {
            // Handle clear
            clearCalculator();
        } else if (e.key === 'Backspace') {
            // Handle backspace
            backspace();
        } else if (['+', '-', '*', '/'].includes(e.key)) {
            // Handle operators
            const operatorMap = {
                '+': 'add',
                '-': 'subtract',
                '*': 'multiply',
                '/': 'divide'
            };
            handleOperator(operatorMap[e.key]);
        } else if (e.key === '%') {
            // Handle percent
            percent();
        }
    }
});