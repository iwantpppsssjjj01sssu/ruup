// 페이지 전환 대체 효과: View Transitions 미지원 브라우저에서만 페이드 인/아웃 (head에서 실행되어 첫 화면부터 적용)
(() => {
    const root = document.documentElement;
    if ('CSSViewTransitionRule' in window || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    root.classList.add('has-page-fade', 'is-page-entering');

    window.addEventListener('DOMContentLoaded', () => {
        requestAnimationFrame(() => root.classList.remove('is-page-entering'));
    });

    // 뒤로가기(bfcache)로 돌아왔을 때 사라진 상태로 남지 않도록 복구
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            root.classList.remove('is-page-leaving', 'is-page-entering');
        }
    });

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }
        const url = new URL(link.href, location.href);
        const isSamePageHash = url.pathname === location.pathname && url.hash;
        if (url.origin !== location.origin || link.target === '_blank' || link.hasAttribute('download') || isSamePageHash) {
            return;
        }
        event.preventDefault();
        root.classList.add('is-page-leaving');
        setTimeout(() => {
            location.href = url.href;
        }, 300);
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const header = document.querySelector('.site_header');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const darkHero = document.querySelector('[data-dark-hero]');
    let lastScroll = 0;

    // 헤더: 내릴 때 숨기고 올릴 때 보이기, 어두운 히어로 위에서는 투명
    if (darkHero) {
        body.classList.add('has-dark-hero');
    }

    const onScroll = () => {
        const currentScroll = window.scrollY;

        if (header) {
            const shouldHide = currentScroll > lastScroll && currentScroll > 120 && !body.classList.contains('is-menu-open');
            header.classList.toggle('is-hidden', shouldHide);
        }

        if (darkHero) {
            body.classList.toggle('is-at-top', currentScroll < darkHero.offsetHeight - 80);
        }

        topButton?.classList.toggle('is-visible', currentScroll > 600);
        lastScroll = currentScroll;
    };

    // 맨 위로 버튼
    const topButton = document.createElement('button');
    topButton.type = 'button';
    topButton.className = 'top_button';
    topButton.setAttribute('aria-label', '맨 위로');
    topButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    topButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    body.appendChild(topButton);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // 모바일 메뉴
    const mobileMenu = document.querySelector('.mobile_menu');
    const openButton = document.querySelector('[data-menu-open]');
    const closeButton = document.querySelector('[data-menu-close]');

    const setMenu = (isOpen) => {
        mobileMenu?.classList.toggle('is-open', isOpen);
        mobileMenu?.setAttribute('aria-hidden', String(!isOpen));
        openButton?.setAttribute('aria-expanded', String(isOpen));
        body.classList.toggle('is-menu-open', isOpen);
        if (isOpen) {
            closeButton?.focus();
        }
    };

    openButton?.addEventListener('click', () => setMenu(true));
    closeButton?.addEventListener('click', () => setMenu(false));
    mobileMenu?.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenu(false));
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && body.classList.contains('is-menu-open')) {
            setMenu(false);
        }
    });

    // 마우스 팔로워: 마우스(정밀 포인터 + hover) 환경에서만 동작, 터치 기기는 제외
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const cursorDot = document.createElement('div');
        cursorDot.className = 'cursor_dot';
        cursorDot.setAttribute('aria-hidden', 'true');
        body.appendChild(cursorDot);

        const ease = prefersReducedMotion ? 1 : 0.16;
        const target = { x: 0, y: 0 };
        const dot = { x: 0, y: 0 };
        let rafId = null;

        const render = () => {
            dot.x += (target.x - dot.x) * ease;
            dot.y += (target.y - dot.y) * ease;
            cursorDot.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0)`;

            // 목표 지점에 거의 도달하면 루프를 멈춰 불필요한 연산 방지
            if (Math.abs(target.x - dot.x) < 0.1 && Math.abs(target.y - dot.y) < 0.1) {
                rafId = null;
                return;
            }
            rafId = requestAnimationFrame(render);
        };

        document.addEventListener('mousemove', (event) => {
            target.x = event.clientX;
            target.y = event.clientY;
            if (!cursorDot.classList.contains('is-visible')) {
                // 처음 나타날 때는 커서 위치에서 바로 시작
                dot.x = target.x;
                dot.y = target.y;
                cursorDot.classList.add('is-visible');
            }
            if (!rafId) {
                rafId = requestAnimationFrame(render);
            }
        }, { passive: true });

        document.documentElement.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('is-visible');
        });
    }

    // 스크롤 등장 애니메이션
    const revealItems = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !prefersReducedMotion) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealItems.forEach((item) => revealObserver.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add('is-in'));
    }
});

// 칩/탭 버튼 그룹: 클릭한 버튼만 활성화하고 콜백 실행 (각 페이지에서 사용)
window.luupChips = (container, onChange) => {
    if (!container) {
        return;
    }
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            buttons.forEach((item) => {
                const isActive = item === button;
                item.classList.toggle('is-active', isActive);
                item.setAttribute('aria-pressed', String(isActive));
            });
            onChange?.(button);
        });
    });
};
