document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.news_list li');

    window.luupChips(document.querySelector('[data-news-chips]'), (button) => {
        const type = button.dataset.type;
        items.forEach((item) => {
            item.hidden = type !== 'all' && item.dataset.type !== type;
        });
    });
});
