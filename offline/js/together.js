document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.challenge_item');

    // 상태 필터
    window.luupChips(document.querySelector('[data-status-chips]'), (button) => {
        const status = button.dataset.status;
        items.forEach((item) => {
            item.hidden = status !== 'all' && item.dataset.status !== status;
        });
    });

    // 참여하기 토글 (참여 인원 +1)
    document.querySelectorAll('[data-join]').forEach((button) => {
        const people = button.closest('.challenge_item').querySelector('[data-people]');
        const base = Number(people.dataset.people);

        button.addEventListener('click', () => {
            const isJoined = button.classList.toggle('is-joined');
            button.setAttribute('aria-pressed', String(isJoined));
            button.textContent = isJoined ? '✓ 참여 중' : '참여하기';
            people.textContent = `${(base + (isJoined ? 1 : 0)).toLocaleString('ko-KR')}명`;
        });
    });
});
