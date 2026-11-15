document.addEventListener('DOMContentLoaded', () => {
    // 헤더 메뉴 롤링 텍스트: 글자를 앞면/아랫면 두 장으로 쪼개고, 스크린리더에는 aria-label로 원래 이름 전달
    document.querySelectorAll('.site_nav a').forEach((link) => {
        const label = link.textContent.trim();
        link.setAttribute('aria-label', label);
        const roll = document.createElement('span');
        roll.className = 'roll_text';
        roll.setAttribute('aria-hidden', 'true');
        [...label].forEach((char, index) => {
            const charBox = document.createElement('span');
            charBox.className = 'roll_char';
            charBox.style.setProperty('--i', index);
            const face = char === ' ' ? '\u00a0' : char;
            charBox.innerHTML = `<span class="roll_face">${face}</span><span class="roll_face roll_face_next">${face}</span>`;
            roll.appendChild(charBox);
        });
        link.replaceChildren(roll);
    });
});
