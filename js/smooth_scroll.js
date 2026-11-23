// 페이지를 부드럽게 내려가게 하는 공통 스크립트 (기록 · 성장 페이지)
// 1) 마우스 휠 스크롤에 관성을 줘서, 툭툭 끊기지 않고 미끄러지듯 내려감
// 2) 섹션이 화면에 들어올 때 아래에서 살짝 떠오르며 나타남
(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ---------- 1. 부드러운 휠 스크롤 ----------
    if (!reduce && finePointer) {
        const root = document.documentElement;
        const EASE = 0.09;
        let target = window.scrollY;
        let current = window.scrollY;
        let rafId = null;

        const maxScroll = () => root.scrollHeight - window.innerHeight;
        const clamp = (value) => Math.min(Math.max(value, 0), maxScroll());

        // 휠이 안쪽 스크롤 영역(대화창 · 목록 등)에서 쓰일 수 있으면 그쪽에 맡김
        const canScrollInside = (node, delta) => {
            for (let el = node; el && el !== document.body && el !== root; el = el.parentElement) {
                const style = getComputedStyle(el);
                if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) {
                    if ((delta > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (delta < 0 && el.scrollTop > 0)) {
                        return true;
                    }
                }
            }
            return false;
        };

        const step = () => {
            current += (target - current) * EASE;
            if (Math.abs(target - current) < 0.5) {
                current = target;
            }
            window.scrollTo(0, current);
            if (current !== target) {
                rafId = requestAnimationFrame(step);
            } else {
                rafId = null;
                root.style.scrollBehavior = '';
            }
        };

        window.addEventListener('wheel', (event) => {
            if (event.ctrlKey || event.defaultPrevented || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
                return;
            }
            if (document.querySelector('dialog[open]') || root.classList.contains('is-report-open') || root.classList.contains('is-col-open') || root.classList.contains('is-op-alert')) {
                return;
            }
            const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;
            if (canScrollInside(event.target, delta)) {
                return;
            }
            event.preventDefault();
            if (!rafId) {
                // 키보드·스크롤바로 움직인 위치에서 이어서 시작
                current = window.scrollY;
                target = current;
            }
            target = clamp(target + delta);
            root.style.scrollBehavior = 'auto';
            if (!rafId) {
                rafId = requestAnimationFrame(step);
            }
        }, { passive: false });

        // 링크 이동 · 키보드 등 다른 방식으로 스크롤하면 위치를 맞춰 둠
        window.addEventListener('scroll', () => {
            if (!rafId) {
                target = current = window.scrollY;
            }
        }, { passive: true });
        window.addEventListener('resize', () => {
            target = clamp(target);
        });
    }

    // ---------- 2. 섹션 떠오르며 나타나기 ----------
    document.addEventListener('DOMContentLoaded', () => {
        if (reduce || !('IntersectionObserver' in window)) {
            return;
        }
        const sections = [...document.querySelectorAll('main > section')].slice(1);
        sections.forEach((section) => section.classList.add('sr_hide'));
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('sr_show');
                    observer.unobserve(entry.target);
                    // 움직임이 끝나면 transform을 풀어 안쪽 sticky · 고정 요소에 영향이 없게
                    setTimeout(() => entry.target.classList.remove('sr_hide', 'sr_show'), 1100);
                }
            });
        }, { rootMargin: '0px 0px -12% 0px' });
        sections.forEach((section) => observer.observe(section));
    });
})();
