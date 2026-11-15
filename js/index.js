document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 0. 인트로: 찢어진 종이 가장자리 만들기 → 끝나면(또는 건너뛰기) 지움
    const opening = document.querySelector('[data-intro]');
    if (opening) {
        // 인트로가 끝나면 알림 (첫 화면 라벨 효과를 그때 다시 보여 주기 위해)
        const removeOpening = () => {
            opening.remove();
            document.dispatchEvent(new Event('luup:intro-done'));
        };
        if (prefersReducedMotion) {
            removeOpening();
        } else {
            // 가장자리 점을 들쭉날쭉하게: 위 조각은 아래쪽이, 아래 조각은 위쪽이 찢어진 모양
            const points = 70;
            const edge = (fromBottom) => Array.from({ length: points + 1 }, (_, i) => {
                const x = (i / points) * 100;
                const depth = 4 + Math.random() * 16 + (i % 7 === 0 ? 10 : 0);
                return fromBottom ? `${x.toFixed(2)}% calc(100% - ${depth.toFixed(1)}px)` : `${x.toFixed(2)}% ${depth.toFixed(1)}px`;
            });
            opening.querySelector('[data-intro-top]').style.clipPath = `polygon(0 0, 100% 0, ${edge(true).reverse().join(', ')})`;
            opening.querySelector('[data-intro-bottom]').style.clipPath = `polygon(${edge(false).join(', ')}, 100% 100%, 0 100%)`;
            // 검정 세로 줄 12개: 저마다 조금씩 다른 시간에 위로 올라감
            const cols = opening.querySelector('[data-intro-cols]');
            cols.innerHTML = Array.from({ length: 12 }, () => `<span style="--d:${(5.75 + Math.random() * 0.4).toFixed(2)}s"></span>`).join('');
            const doneId = setTimeout(removeOpening, 7400);

            // 단어 글자를 한 자씩 span으로 나눔: 단어는 한 번에 나타나고, 접힐 때 첫 글자 뒤 글자들이 하나씩 줄어들며 사라짐
            opening.querySelectorAll('.intro_word b, .intro_rest').forEach((part) => {
                part.innerHTML = [...part.textContent].map((ch) => `<span class="intro_ch">${ch}</span>`).join('');
            });
            opening.querySelector('[data-intro-skip]').addEventListener('click', () => {
                clearTimeout(doneId);
                opening.classList.add('is-skip');
                setTimeout(removeOpening, 400);
            });
        }
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

    // 5-1 오늘의 루틴 체크
    const today = document.querySelector('[data-today]');
    if (today) {
        const items = today.querySelectorAll('.today_list li');
        const count = today.querySelector('[data-today-count]');
        const bar = today.querySelector('[data-today-bar]');
        const percent = today.querySelector('[data-today-percent]');

        const updateToday = () => {
            const done = today.querySelectorAll('.today_list li.is-done').length;
            const value = Math.round((done / items.length) * 100);
            count.textContent = `${done} / ${items.length}`;
            percent.textContent = `${value}%`;
            bar.style.setProperty('--value', `${value}%`);
        };

        items.forEach((item) => {
            item.querySelector('.check')?.addEventListener('click', (event) => {
                const isDone = item.classList.toggle('is-done');
                event.currentTarget.setAttribute('aria-pressed', String(isDone));
                updateToday();
            });
        });
    }

    // 5-3 챌린지 탭
    const challenge = document.querySelector('[data-challenge]');
    if (challenge) {
        const card = challenge.querySelector('.challenge_card');
        const icon = challenge.querySelector('[data-challenge-icon]');
        const title = challenge.querySelector('[data-challenge-title]');
        const desc = challenge.querySelector('[data-challenge-desc]');
        const people = challenge.querySelector('[data-challenge-people]');
        const progressText = challenge.querySelector('[data-challenge-progress-text]');
        const bar = challenge.querySelector('[data-challenge-bar]');

        window.luupChips(challenge.querySelector('[data-challenge-chips]'), (button) => {
            const data = button.dataset;
            card.classList.add('is-changing');
            window.setTimeout(() => {
                icon.textContent = data.icon;
                icon.style.setProperty('--icon-bg', data.bg);
                title.textContent = data.title;
                desc.textContent = data.desc;
                people.textContent = data.people;
                progressText.textContent = `${data.progress}%`;
                bar.style.setProperty('--value', `${data.progress}%`);
                card.classList.remove('is-changing');
            }, prefersReducedMotion ? 0 : 200);
        });
    }

    // 5-4 후기 탭
    const review = document.querySelector('[data-review]');
    if (review) {
        const lists = review.querySelectorAll('[data-review-list]');
        window.luupChips(review.querySelector('[data-review-chips]'), (button) => {
            lists.forEach((list) => {
                list.hidden = list.dataset.reviewList !== button.dataset.review;
            });
        });
    }

    // 1-1. 히어로 문구 연출: 맨 위에서 처음 스크롤하면 화면은 그대로 두고
    //      형광펜 → LU가 붙어 LUUP! 까지 다 써진 뒤에야 스크롤이 내려감 (맨 위로 돌아오면 다시 처음부터)
    const heroUp = document.querySelector('[data-hero-up]');
    const intro = { stage: 0, timers: [] };
    const INTRO_STEP_MS = 650;

    const finishIntro = () => {
        intro.stage = 2;
        heroUp?.classList.add('is-marked', 'is-luup');
    };

    const playIntro = () => {
        if (!heroUp || intro.stage !== 0) {
            return;
        }
        if (prefersReducedMotion) {
            finishIntro();
            return;
        }
        intro.stage = 1;
        heroUp.classList.add('is-marked');
        intro.timers.push(setTimeout(() => heroUp.classList.add('is-luup'), INTRO_STEP_MS));
        intro.timers.push(setTimeout(finishIntro, INTRO_STEP_MS * 2 + 50));
    };

    const resetIntro = () => {
        intro.timers.forEach(clearTimeout);
        intro.timers = [];
        intro.stage = 0;
        heroUp?.classList.remove('is-marked', 'is-luup');
    };

    // 연출이 끝나기 전, 맨 위에서 아래로 내리려는 입력은 막고 연출만 시작
    const isLocked = () => heroUp && intro.stage !== 2 && window.scrollY < 5;
    const holdScroll = (event) => {
        if (!isLocked()) {
            return;
        }
        event.preventDefault();
        playIntro();
    };

    if (heroUp) {
        window.addEventListener('wheel', (event) => {
            if (event.deltaY > 0) {
                holdScroll(event);
            }
        }, { passive: false });

        let touchStartY = 0;
        window.addEventListener('touchstart', (event) => {
            touchStartY = event.touches[0].clientY;
        }, { passive: true });
        window.addEventListener('touchmove', (event) => {
            if (touchStartY - event.touches[0].clientY > 0) {
                holdScroll(event);
            }
        }, { passive: false });

        window.addEventListener('keydown', (event) => {
            const isField = event.target.closest?.('input, textarea, select, [contenteditable]');
            if (!isField && ['ArrowDown', 'PageDown', 'End', ' '].includes(event.key)) {
                holdScroll(event);
            }
        });

        // 스크롤바를 직접 끌어 내린 경우 등 막지 못한 스크롤은 연출을 바로 마무리, 맨 위로 오면 초기화
        window.addEventListener('scroll', () => {
            if (window.scrollY < 2 && intro.stage === 2) {
                resetIntro();
            } else if (window.scrollY > 40 && intro.stage !== 2) {
                intro.timers.forEach(clearTimeout);
                finishIntro();
            }
        }, { passive: true });
    }


    // 1. 첫 화면: 스크롤 1화면마다 다음 장면이 반쪽씩(왼쪽은 아래에서, 오른쪽은 위에서) 밀려 들어옴
    const gg = document.querySelector('[data-gg]');
    if (gg) {
        const chapters = [...gg.querySelectorAll('[data-gg-ch]')];
        const count = gg.querySelector('[data-gg-count]');
        const ggEase = (v) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
        let ggShown = null;
        let ggTicking = false;

        // 제목 위 영문 라벨: 글자를 한 자씩 나눠 두면 CSS가 순서대로 아래에서 올라오게 함 (--i = 글자 순서)
        gg.querySelectorAll('[data-scramble]').forEach((label) => {
            label.setAttribute('aria-label', label.textContent);
            label.innerHTML = [...label.textContent].map((ch, i) => `<span class="gg_lt" style="--i:${i}" aria-hidden="true">${ch}</span>`).join('');
        });
        // 장면 글자 순서: 큰 제목 → 라벨 → 링크 (순서·시간은 CSS). 인트로가 끝나야(ggReady) 첫 장면부터 보여 줌
        let ggReady = !document.querySelector('[data-intro]');
        const showChapter = (chapter) => {
            if (!chapter || !ggReady || chapter.classList.contains('is-shown')) {
                return;
            }
            chapter.classList.add('is-shown');
        };
        document.addEventListener('luup:intro-done', () => {
            ggReady = true;
            showChapter(gg.querySelector('[data-gg-ch].is-current'));
        });

        const drawGg = (position) => {
            let current = 0;
            chapters.forEach((chapter, i) => {
                const raw = i === 0 ? 1 : Math.min(Math.max(position - (i - 1), 0), 1);
                const t = prefersReducedMotion ? Math.round(raw) : ggEase(raw);
                chapter.style.setProperty('--t', t.toFixed(4));
                if (t > 0.5) {
                    current = i;
                }
            });
            chapters.forEach((chapter, i) => chapter.classList.toggle('is-current', i === current));
            count.textContent = String(current + 1).padStart(2, '0');
            if (ggReady) {
                showChapter(chapters[current]);
            }
        };

        const updateGg = () => {
            ggTicking = false;
            const scrollable = gg.offsetHeight - window.innerHeight;
            const progress = Math.min(Math.max(-gg.getBoundingClientRect().top / Math.max(scrollable, 1), 0), 1);
            // 마지막 장면이 다 들어온 뒤 조금 머무르도록 0.9까지에서 장면 전환을 끝냄
            const target = Math.min(progress / 0.9, 1) * (chapters.length - 1);
            ggShown = ggShown === null || prefersReducedMotion ? target : ggShown + (target - ggShown) * 0.14;
            if (Math.abs(target - ggShown) < 0.001) {
                ggShown = target;
            } else {
                requestGg();
            }
            drawGg(ggShown);
        };

        const requestGg = () => {
            if (!ggTicking) {
                ggTicking = true;
                requestAnimationFrame(updateGg);
            }
        };

        // 어느 페이지에서 돌아오든 온보딩이 끝나면 첫 장면(LET'S BEGIN TODAY)부터 보이게 (주소에 #이 있으면 그 위치 우선)
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        const START_SCENE = 0;
        const startAtScene = () => {
            if (location.hash) {
                return;
            }
            const scrollable = gg.offsetHeight - window.innerHeight;
            const top = gg.getBoundingClientRect().top + window.scrollY;
            // updateGg와 같은 계산: 진행도 0.9에서 마지막 장면이 다 들어옴
            window.scrollTo(0, Math.round(top + scrollable * 0.9 * (START_SCENE / (chapters.length - 1))));
            ggShown = null;
            // 이동 직후(레이아웃이 자리 잡는 동안) 생기는 스크롤 이벤트 때문에 헤더가 숨겨지지 않게 잠깐 계속 보이게 함
            const showHeader = () => setTimeout(() => document.querySelector('.site_header')?.classList.remove('is-hidden'), 0);
            window.addEventListener('scroll', showHeader, { passive: true });
            setTimeout(() => window.removeEventListener('scroll', showHeader), 1500);
            showHeader();
        };
        startAtScene();
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                startAtScene();
            }
        });

        updateGg();
        window.addEventListener('scroll', requestGg, { passive: true });
        window.addEventListener('resize', requestGg);
    }

    // 4. 넘어가는 구간: 화면에 들어오면 차례로
    //    ① SMALL STEPS 등장(is-open) → ② BIG GROWTH 로 바뀜(is-swap) → ③ 문장이 한 단어씩 진해지고 형광펜(is-done)
    const gap = document.querySelector('[data-gap]');
    if (gap) {
        const playGap = () => {
            gap.classList.add('is-open');
            setTimeout(() => gap.classList.add('is-swap'), 2300);
            setTimeout(() => gap.classList.add('is-done'), 3700);
        };
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            gap.classList.add('is-open', 'is-swap', 'is-done');
        } else {
            const gapObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    gapObserver.disconnect();
                    playGap();
                }
            }, { threshold: 0.45 });
            gapObserver.observe(gap);
        }
    }

    // 2. 특별한 이유: 사진과 번호(01~04)가 자동으로 넘어감 — 새 사진이 오른쪽에서 밀려와 이전 사진을 덮음
    // 화면에 보일 때만 넘어가고, 번호를 누르면 그 사진으로 바로 가면서 시간을 처음부터 다시 셈
    const w2 = document.querySelector('[data-w2]');
    if (w2) {
        const slides = [...w2.querySelectorAll('[data-w2-slide]')];
        const steps = [...w2.querySelectorAll('[data-w2-step]')];
        const AUTO_MS = 1600;
        let current = 0;
        let autoTimer = null;
        let inView = false;

        const setActive = (index) => {
            steps.forEach((step, i) => {
                step.classList.toggle('is-active', i === index);
                if (i === index) {
                    step.setAttribute('aria-current', 'step');
                } else {
                    step.removeAttribute('aria-current');
                }
            });
        };

        const show = (index) => {
            if (index === current) {
                return;
            }
            slides.forEach((slide) => slide.classList.remove('is-prev'));
            slides[current].classList.remove('is-current');
            slides[current].classList.add('is-prev');
            // 새 사진은 오른쪽 밖에서 출발: 한 프레임 뒤에 is-current를 붙여야 밀려오는 움직임이 보임
            const next = slides[index];
            next.classList.add('is-ready');
            requestAnimationFrame(() => requestAnimationFrame(() => {
                next.classList.remove('is-ready');
                next.classList.add('is-current');
            }));
            current = index;
            setActive(current);
            w2.style.setProperty('--auto', `${AUTO_MS}ms`);
        };

        const stopAuto = () => {
            clearInterval(autoTimer);
            autoTimer = null;
        };
        const startAuto = () => {
            stopAuto();
            if (prefersReducedMotion || !inView) {
                return;
            }
            autoTimer = setInterval(() => show((current + 1) % slides.length), AUTO_MS);
        };

        slides[0].classList.add('is-current');
        setActive(0);

        steps.forEach((stepButton, index) => {
            stepButton.addEventListener('click', () => {
                show(index);
                startAuto();
            });
        });

        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                inView = entries[0].isIntersecting;
                if (inView) {
                    startAuto();
                } else {
                    stopAuto();
                }
            }, { threshold: 0.35 }).observe(w2);
        }
    }

    // 2. 특별한 이유: 세로로 스크롤하면 카드 줄이 가로로 부드럽게 넘어감 (데스크톱)
    const why = document.querySelector('[data-why]');
    if (why) {
        const track = why.querySelector('[data-why-track]');
        const whyCards = why.querySelectorAll('.why_cards > li');
        const count = why.querySelector('[data-why-count]');
        const bar = why.querySelector('[data-why-bar]');
        const wideQuery = window.matchMedia('(min-width: 901px)');
        const h = { distance: 0, current: 0, target: 0, rafId: null, on: false };

        const setup = () => {
            h.on = wideQuery.matches && !prefersReducedMotion;
            why.classList.toggle('is-horizontal', h.on);
            if (!h.on) {
                why.style.height = '';
                track.style.removeProperty('--x');
                return;
            }
            // 줄 끝 여백(padding-right)은 scrollWidth에 빠지므로 직접 더해 마지막 카드 뒤에도 여유를 둠
            const endGap = parseFloat(getComputedStyle(track).paddingRight) || 0;
            h.distance = Math.max(track.scrollWidth + endGap - window.innerWidth, 0);
            why.style.height = `${window.innerHeight + h.distance}px`;
        };

        const frame = () => {
            h.current += (h.target - h.current) * 0.12;
            if (Math.abs(h.target - h.current) < 0.3) {
                h.current = h.target;
            }
            track.style.setProperty('--x', `${-h.current.toFixed(1)}px`);
            const ratio = h.distance ? h.current / h.distance : 0;
            bar.style.setProperty('--bar', ratio.toFixed(3));
            // 그림이 카드보다 살짝 늦게 따라오는 깊이감
            whyCards.forEach((card) => {
                const rect = card.getBoundingClientRect();
                const offset = (rect.left + rect.width / 2 - window.innerWidth / 2) / window.innerWidth;
                card.style.setProperty('--shift', `${(offset * -60).toFixed(1)}px`);
            });
            // 진행 정도에 맞춘 카드 번호 (끝까지 가면 마지막 번호)
            const current = Math.round(ratio * (whyCards.length - 1)) + 1;
            count.textContent = `${String(current).padStart(2, '0')} / ${String(whyCards.length).padStart(2, '0')}`;
            h.rafId = h.current === h.target ? null : requestAnimationFrame(frame);
        };

        const onScroll = () => {
            if (!h.on) {
                return;
            }
            const scrollable = why.offsetHeight - window.innerHeight;
            const progress = Math.min(Math.max(-why.getBoundingClientRect().top / Math.max(scrollable, 1), 0), 1);
            h.target = progress * h.distance;
            if (!h.rafId) {
                h.rafId = requestAnimationFrame(frame);
            }
        };

        setup();
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', () => {
            setup();
            onScroll();
        });
        // 웹폰트가 늦게 적용되면 카드 폭이 바뀌므로 다시 계산
        window.addEventListener('load', () => {
            setup();
            onScroll();
        });
    }

    // 5. 아치형 카드: 섹션을 지나는 동안(0~1) 카드가 왼쪽부터 한 장씩 뒤집힘
    const arc = document.querySelector('[data-arc]');
    if (arc && !prefersReducedMotion) {
        const cards = arc.querySelectorAll('.arc_card');
        const arcCta = arc.querySelector('[data-arc-cta]');
        // 편지 날짜: 오늘 날짜로 (예: 2026.11.02 (Mon) TODAY)
        const envDate = arc.querySelector('[data-env-date]');
        if (envDate) {
            const d = new Date();
            const two = (n) => String(n).padStart(2, '0');
            const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
            envDate.textContent = `${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())} (${day}) TODAY`;
        }
        // 초대장 버튼: 누르면 글리치 효과를 잠깐 보여준 뒤 Today로 이동
        const letterBtn = arcCta?.querySelector('.arc_cta_btn');
        letterBtn?.addEventListener('click', (event) => {
            if (prefersReducedMotion || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
                return;
            }
            event.preventDefault();
            letterBtn.classList.add('is-glitch');
            setTimeout(() => {
                window.location.href = letterBtn.href;
            }, 600);
        });
        // "나중에"를 누르면 이번 방문 동안은 다시 띄우지 않음
        let arcCtaClosed = false;
        arcCta?.querySelector('[data-arc-cta-close]')?.addEventListener('click', () => {
            arcCtaClosed = true;
            arcCta.classList.add('is-closed');
            arcCta.classList.remove('is-in');
            arcCta.querySelectorAll('a, button').forEach((el) => {
                el.tabIndex = -1;
            });
        });
        const clamp = (value) => Math.min(Math.max(value, 0), 1);
        let ticking = false;

        const updateArc = () => {
            ticking = false;
            const scrollable = arc.offsetHeight - window.innerHeight;
            const progress = clamp(-arc.getBoundingClientRect().top / Math.max(scrollable, 1));
            arc.style.setProperty('--p', progress.toFixed(4));
            // 카드가 거의 다 뒤집히면 Today로 가는 버튼 등장 (사라져 있을 땐 Tab으로도 못 가게)
            // 나타나는 기준(0.82)과 사라지는 기준(0.78)을 다르게 해서, 멈춘 자리 근처에서 깜빡이며 갇히지 않게 함
            const wasIn = arcCta?.classList.contains('is-in');
            const ctaIn = !arcCtaClosed && (wasIn ? progress > 0.78 : progress > 0.82);
            if (arcCta && wasIn !== ctaIn) {
                if (ctaIn) {
                    // 기준선 바로 위(0.83)에 멈춰서 반올림 오차로 다시 사라지지 않게
                    startHold(window.scrollY - (progress - 0.83) * scrollable);
                } else {
                    hold.on = false;
                }
                arcCta.classList.toggle('is-in', ctaIn);
                arcCta.querySelectorAll('a, button').forEach((el) => {
                    el.tabIndex = ctaIn ? 0 : -1;
                });
            }
            cards.forEach((card, index) => {
                const start = 0.08 + index * 0.08;
                const flip = clamp((progress - start) / 0.28);
                card.style.setProperty('--flip', `${(flip * 180).toFixed(1)}deg`);
            });
        };

        // 초대장이 나오면 그 자리에 멈춤 → 스크롤을 한 번 멈췄다가 다시 내리면 그때 아래로 진행
        const hold = { on: false, y: 0, since: 0, lastInput: 0 };
        const HOLD_MIN_MS = 600;
        const GESTURE_GAP_MS = 450;
        function startHold(y) {
            if (prefersReducedMotion) {
                return;
            }
            hold.on = true;
            hold.y = y;
            hold.since = performance.now();
            hold.lastInput = performance.now();
            window.scrollTo({ top: y, behavior: 'instant' });
        }
        // 아래로 가려는 입력: 멈춘 직후·같은 스크롤 동작이 이어지는 중이면 막고, 새로 내린 입력이면 풀어 줌
        const tryRelease = (event) => {
            if (!hold.on) {
                return;
            }
            const now = performance.now();
            const newGesture = now - hold.lastInput > GESTURE_GAP_MS && now - hold.since > HOLD_MIN_MS;
            hold.lastInput = now;
            if (newGesture) {
                hold.on = false;
                return;
            }
            event.preventDefault();
        };
        window.addEventListener('wheel', (event) => {
            if (event.deltaY > 0) {
                tryRelease(event);
            } else {
                hold.on = false;
            }
        }, { passive: false });
        let holdTouchY = 0;
        let holdTouchNew = false;
        window.addEventListener('touchstart', (event) => {
            holdTouchY = event.touches[0].clientY;
            holdTouchNew = true;
        }, { passive: true });
        window.addEventListener('touchmove', (event) => {
            if (!hold.on || holdTouchY - event.touches[0].clientY <= 0) {
                return;
            }
            if (holdTouchNew && performance.now() - hold.since > HOLD_MIN_MS) {
                hold.on = false;
                return;
            }
            event.preventDefault();
        }, { passive: false });
        window.addEventListener('touchend', () => {
            holdTouchNew = false;
        }, { passive: true });
        window.addEventListener('keydown', (event) => {
            if (hold.on && ['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key) && !event.target.closest?.('input, textarea, select')) {
                tryRelease(event);
            }
        });
        // 관성 스크롤이 남아 있으면 멈춘 자리로 되돌림
        window.addEventListener('scroll', () => {
            if (hold.on && window.scrollY > hold.y + 2 && performance.now() - hold.since < HOLD_MIN_MS) {
                window.scrollTo({ top: hold.y, behavior: 'instant' });
            }
        }, { passive: true });

        const requestArc = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateArc);
            }
        };
        updateArc();
        window.addEventListener('scroll', requestArc, { passive: true });
        window.addEventListener('resize', requestArc);
    }

    // 5-2. 아치 카드 뒤적이기: 가리킨 카드가 맨 앞으로, 양옆 카드는 가까울수록 크게 벌어짐
    const arcList = document.querySelector('.arc_cards');
    if (arcList && window.matchMedia('(hover: hover)').matches) {
        const arcItems = [...arcList.querySelectorAll('.arc_card')];
        const fan = (hovered) => {
            arcItems.forEach((card, index) => {
                const d = index - hovered;
                const spread = hovered < 0 || d === 0 ? 0 : Math.sign(d) * (7 / (1 + (Math.abs(d) - 1) * 0.9));
                card.style.setProperty('--spread', `${spread.toFixed(2)}deg`);
                card.style.setProperty('--rise', hovered >= 0 && d === 0 ? '-14px' : '0px');
                card.classList.toggle('is-front', hovered >= 0 && d === 0);
            });
        };
        arcItems.forEach((card, index) => {
            card.addEventListener('pointerenter', () => fan(index));
            card.addEventListener('focusin', () => fan(index));
        });
        arcList.addEventListener('pointerleave', () => fan(-1));
        arcList.addEventListener('focusout', (event) => {
            if (!arcList.contains(event.relatedTarget)) {
                fan(-1);
            }
        });
    }

    // 푸터: 본문이 위로 넘겨진 만큼(0~1) 드러남 → 큰 글자와 캐릭터가 제자리로
    const footer = document.querySelector('[data-reveal-footer]');
    const main = document.querySelector('main');
    if (footer && main && !prefersReducedMotion) {
        let footerTicking = false;
        const updateFooter = () => {
            footerTicking = false;
            const uncovered = window.innerHeight - main.getBoundingClientRect().bottom;
            const reveal = Math.min(Math.max(uncovered / footer.offsetHeight, 0), 1);
            footer.style.setProperty('--reveal', reveal.toFixed(3));
            // 푸터에 Back to Top이 있으니 오른쪽 아래 둥근 버튼은 숨김
            document.body.classList.toggle('is-footer-open', reveal > 0.3);
        };
        const requestFooter = () => {
            if (!footerTicking) {
                footerTicking = true;
                requestAnimationFrame(updateFooter);
            }
        };
        updateFooter();
        window.addEventListener('scroll', requestFooter, { passive: true });
        window.addEventListener('resize', requestFooter);
    }

    // 푸터 메뉴: 글자를 한 자씩 나눠서, 마우스를 올리면 한 글자씩 뒤집혀 돌아감
    document.querySelectorAll('[data-flip-text]').forEach((link) => {
        const word = link.textContent.trim();
        link.setAttribute('aria-label', word);
        link.innerHTML = [...word].map((ch, i) => `<span class="lf_ch" style="--i:${i}" aria-hidden="true">${ch}</span>`).join('');
    });

    document.querySelector('[data-back-top]')?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
});
