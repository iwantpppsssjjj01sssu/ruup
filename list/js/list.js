document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('[data-routine-grid]');
    const count = document.querySelector('[data-count]');
    const empty = document.querySelector('[data-empty]');
    const search = document.querySelector('[data-search]');
    let category = 'all';

    const render = () => {
        const keyword = search.value.trim();
        const routines = window.LUUP_ROUTINES.filter((routine) => {
            const matchCategory = category === 'all' || routine.category === category;
            const matchKeyword = !keyword || routine.title.includes(keyword) || routine.desc.includes(keyword);
            return matchCategory && matchKeyword;
        });

        grid.innerHTML = routines.map((routine) => window.luupRoutineCard(routine, '../product/product.html')).join('');
        count.textContent = routines.length;
        empty.hidden = routines.length > 0;
    };

    window.luupChips(document.querySelector('[data-category-chips]'), (button) => {
        category = button.dataset.category;
        render();
    });

    search.addEventListener('input', render);
    render();
});
