document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 히어로 위에 있을 때 헤더 투명 처리
    const hero = document.querySelector('.kv');
    const updateHeaderTone = () => {
        const limit = hero ? hero.offsetHeight - 80 : 0;
        body.classList.toggle('is-at-top', window.scrollY < limit);
    };
    updateHeaderTone();
    window.addEventListener('scroll', updateHeaderTone, { passive: true });
    window.addEventListener('resize', updateHeaderTone);

    // 자동재생이 막힌 경우 다시 시도
    const heroVideo = document.querySelector('.kv_video');
    heroVideo?.play().catch(() => {});

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
        }, { threshold: 0.18 });
        revealItems.forEach((item) => revealObserver.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add('is-in'));
    }

    // 01~04 리스트: 보이는 카드에 맞춰 활성화
    const specialItems = document.querySelectorAll('.special_item');
    const specialCards = document.querySelectorAll('.special_card');
    const setSpecialActive = (index) => {
        specialItems.forEach((item, i) => item.classList.toggle('is-active', i === index));
    };

    specialItems.forEach((item, index) => {
        item.querySelector('a')?.addEventListener('click', (event) => {
            event.preventDefault();
            setSpecialActive(index);
            specialCards[index]?.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'start'
            });
        });
    });

    if ('IntersectionObserver' in window) {
        const specialObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setSpecialActive([...specialCards].indexOf(entry.target));
                }
            });
        }, { rootMargin: '-45% 0px -45% 0px' });
        specialCards.forEach((card) => specialObserver.observe(card));
    }

    // 버튼 그룹 공통: 클릭한 버튼만 활성화
    const activateButton = (buttons, target) => {
        buttons.forEach((button) => {
            const isActive = button === target;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', String(isActive));
        });
    };

    // 이미지 페이드 교체
    const swapImage = (img, src, alt) => {
        if (!img || img.getAttribute('src') === src) {
            return;
        }
        img.classList.add('is-changing');
        window.setTimeout(() => {
            img.src = src;
            if (alt) {
                img.alt = alt;
            }
            img.classList.remove('is-changing');
        }, prefersReducedMotion ? 0 : 250);
    };

    // 5-1 제품 칩
    const productScreen = document.querySelector('[data-product-screen]');
    if (productScreen) {
        const chips = productScreen.querySelectorAll('.screen_chips button');
        const image = productScreen.querySelector('[data-product-image]');
        const name = productScreen.querySelector('[data-product-name]');
        const eyebrow = productScreen.querySelector('[data-product-eyebrow]');

        chips.forEach((chip) => {
            chip.addEventListener('click', () => {
                activateButton(chips, chip);
                swapImage(image, chip.dataset.src, `${chip.dataset.name} mattress`);
                name.textContent = chip.dataset.name;
                eyebrow.firstChild.textContent = chip.dataset.eyebrow;
            });
        });
    }

    // 5-3 방문 탭
    const visitScreen = document.querySelector('[data-visit-screen]');
    if (visitScreen) {
        const tabs = visitScreen.querySelectorAll('.screen_tabs button');
        const image = visitScreen.querySelector('[data-visit-image]');
        const title = visitScreen.querySelector('[data-visit-title]');
        const desc = visitScreen.querySelector('[data-visit-desc]');

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                activateButton(tabs, tab);
                swapImage(image, tab.dataset.src, `SIMMONS ${tab.dataset.title}`);
                title.textContent = tab.dataset.title;
                desc.textContent = tab.dataset.desc;
            });
        });
    }

    // 5-4 리뷰 탭
    const reviewScreen = document.querySelector('[data-review-screen]');
    if (reviewScreen) {
        const tabs = reviewScreen.querySelectorAll('.screen_tabs button');
        const lists = reviewScreen.querySelectorAll('[data-review-list]');

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                activateButton(tabs, tab);
                lists.forEach((list) => {
                    const isActive = list.dataset.reviewList === tab.dataset.review;
                    list.hidden = !isActive;
                    list.classList.toggle('is-active', isActive);
                });
            });
        });
    }
});
