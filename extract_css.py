import re
import os

input_file = r"c:\Users\decri\OneDrive\Área de Trabalho\Desing\meu\portfolio\button.html"
output_file = r"c:\Users\decri\OneDrive\Área de Trabalho\Desing\meu\portfolio\Portfolio\assets\css\particle-button.css"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

css_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
if css_match:
    css = css_match.group(1)
    # Rename class
    css = css.replace('.theButton.animated::after', '.particle-btn.animating::after')
    # Replace hardcoded color with variable
    css = css.replace('rgba(255, 166.99999999999997, 38.00000000000001, 1)', 'var(--accent-1)')
    # Base styles for the button effect
    base_css = """
.particle-btn {
    position: relative;
    overflow: visible !important;
}

.particle-btn::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 600px;
    pointer-events: none;
    z-index: 50;
    background-repeat: no-repeat;
    opacity: 0;
}
"""
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(base_css + css)
    print("CSS extracted and saved to particle-button.css")
else:
    print("CSS not found in button.html")
