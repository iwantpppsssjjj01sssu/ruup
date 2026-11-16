// Growth(성장 리포트) 페이지
document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canObserve = 'IntersectionObserver' in window;

    // 화면에 들어오면 한 번만 실행
    const onceInView = (elements, callback, threshold = 0.35) => {
        if (prefersReducedMotion || !canObserve) {
            elements.forEach((el) => callback(el, true));
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    observer.unobserve(entry.target);
                    callback(entry.target, false);
                }
            });
        }, { threshold });
        elements.forEach((el) => observer.observe(el));
    };

    // 큰 숫자: 0부터 목표값까지 올라감
    onceInView(document.querySelectorAll('[data-count]'), (el, instant) => {
        const target = Number(el.dataset.count);
        if (instant) {
            el.textContent = target.toLocaleString('ko-KR');
            return;
        }
        const duration = 1400;
        const start = performance.now();
        const step = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased).toLocaleString('ko-KR');
            if (t < 1) {
                requestAnimationFrame(step);
            }
        };
        el.textContent = '0';
        requestAnimationFrame(step);
    }, 0.6);

    // "실천율 42% → 81%": 화면에 들어오면 차례로 나타나고, 81은 42부터 세어 올라감
    const rate = document.querySelector('[data-rate]');
    if (rate && !prefersReducedMotion && 'IntersectionObserver' in window) {
        const num = rate.querySelector('[data-rate-num]');
        const from = Number(num.dataset.from);
        const to = Number(num.dataset.to);
        rate.classList.add('is-wait');
        num.textContent = String(from);
        const rateObserver = new IntersectionObserver((entries) => {
            if (!entries[0].isIntersecting) {
                return;
            }
            rateObserver.disconnect();
            rate.classList.remove('is-wait');
            setTimeout(() => {
                const start = performance.now();
                const step = (now) => {
                    const t = Math.min((now - start) / 1100, 1);
                    num.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))));
                    if (t < 1) {
                        requestAnimationFrame(step);
                    } else {
                        rate.classList.add('is-done');
                    }
                };
                requestAnimationFrame(step);
                // 프레임이 멈춰도 최종 숫자는 반드시 맞게
                setTimeout(() => {
                    num.textContent = String(to);
                }, 1250);
            }, 800);
        }, { threshold: 0.6 });
        rateObserver.observe(rate);
    }

    // 첫 화면 오른쪽 위: 오늘 날짜 (예: 2026.11.16 (월))
    const todayDate = document.querySelector('[data-today-date]');
    if (todayDate) {
        const d = new Date();
        const two = (n) => String(n).padStart(2, '0');
        const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
        todayDate.textContent = `${d.getFullYear()}.${two(d.getMonth() + 1)}.${two(d.getDate())} (${day})`;
        todayDate.setAttribute('datetime', `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`);
    }

    // 첫 화면 제목: 잠시 뒤 "나의" → "우리 아이의"로 바뀜 (칸 폭도 새 글자에 맞게 부드럽게 늘어남)
    const swap = document.querySelector('[data-title-swap]');
    if (swap) {
        const from = swap.querySelector('.gr_swap_from');
        const to = swap.querySelector('.gr_swap_to');
        const widthOf = (el) => `${el.getBoundingClientRect().width}px`;
        const run = () => {
            swap.classList.add('is-swapped');
            swap.style.setProperty('--swap-w', widthOf(to));
        };
        const start = () => {
            swap.style.setProperty('--swap-w', widthOf(from));
            if (prefersReducedMotion) {
                run();
            } else {
                setTimeout(run, 1800);
            }
        };
        // 웹폰트가 적용된 뒤에 폭을 재야 정확함
        (document.fonts?.ready || Promise.resolve()).then(start);
        window.addEventListener('resize', () => {
            swap.style.setProperty('--swap-w', widthOf(swap.classList.contains('is-swapped') ? to : from));
        });
    }

    // 달성한 목표: "이번 주 목표 현황 확인하기"를 누르면 목표 블록이 차례로 올라오며 펼쳐짐 (다시 누르면 접힘)
    const goalsToggle = document.querySelector('[data-goals-toggle]');
    const goals = document.querySelector('[data-goals]');
    if (goalsToggle && goals) {
        const goalsLabel = goalsToggle.querySelector('[data-goals-label]');
        const goalsHint = goalsToggle.querySelector('small');
        goalsToggle.addEventListener('click', () => {
            const open = !goals.classList.contains('is-open');
            goals.classList.toggle('is-open', open);
            // 닫혀 있을 땐 안의 내용에 키보드·스크린리더가 닿지 않게
            goals.inert = !open;
            goalsToggle.setAttribute('aria-expanded', String(open));
            goalsLabel.textContent = open ? '목표 현황 접기' : '이번 주 목표 현황 확인하기';
            goalsHint.textContent = open ? '눌러서 접기' : '눌러서 펼쳐 보기';
            if (open) {
                // 공통 스크롤 등장 효과(reveal)는 바로 보이게 하고, 여기서는 펼침 애니메이션만 씀 (화면은 움직이지 않음)
                goals.querySelectorAll('.reveal').forEach((item) => item.classList.add('is-in'));
                goals.classList.remove('is-opening');
                void goals.offsetWidth;
                goals.classList.add('is-opening');
            }
        });
    }

    // 완료한 일: 기간 탭을 누르면 제목·기간·분야별 숫자와 막대가 바뀜
    const done = document.querySelector('[data-done]');
    if (done) {
        const rows = done.querySelectorAll('.gr_cats li');
        const periodText = done.querySelector('[data-done-period]');
        const totalText = done.querySelector('[data-done-total]');
        const rangeText = done.querySelector('[data-done-range]');
        const animateNumber = (el, to) => {
            const from = Number(el.textContent.replace(/[^0-9]/g, '')) || 0;
            if (prefersReducedMotion || from === to) {
                el.textContent = to.toLocaleString('ko-KR');
                return;
            }
            const start = performance.now();
            const token = Symbol('count');
            el.countToken = token;
            const step = (now) => {
                if (el.countToken !== token) {
                    return;
                }
                const t = Math.min((now - start) / 500, 1);
                el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))).toLocaleString('ko-KR');
                if (t < 1) {
                    requestAnimationFrame(step);
                }
            };
            requestAnimationFrame(step);
            // 탭이 백그라운드라 프레임이 멈춰도 최종 숫자는 반드시 맞게
            setTimeout(() => {
                if (el.countToken === token) {
                    el.textContent = to.toLocaleString('ko-KR');
                }
            }, 560);
        };
        window.luupChips(done.querySelector('[data-done-tabs]'), (button) => {
            const period = button.dataset.period;
            const values = [...rows].map((row) => Number(row.dataset[period]));
            const max = Math.max(...values);
            const total = values.reduce((sum, v) => sum + v, 0);
            rows.forEach((row, i) => {
                row.style.setProperty('--v', (values[i] / max).toFixed(2));
                animateNumber(row.querySelector('b'), values[i]);
            });
            periodText.textContent = button.dataset.label;
            totalText.textContent = `${total.toLocaleString('ko-KR')}개`;
            rangeText.textContent = button.dataset.range;
        });
    }

    // 그래프 선 그리기 · 달력 칸 채우기
    // 달력은 칸이 크고 높아서, 위쪽이 보이기 시작하면 바로(20%) 시작해야 칸이 떠오르는 모습이 보임
    onceInView(document.querySelectorAll('[data-chart]'), (el) => el.classList.add('is-in'));
    onceInView(document.querySelectorAll('.gr_heat'), (el) => el.classList.add('is-in'), 0.2);

    // 작은 대문자 라벨: 글자가 잠깐 뒤섞였다가 왼쪽부터 제자리로
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    onceInView(document.querySelectorAll('[data-scramble-label]'), (el, instant) => {
        if (instant) {
            return;
        }
        const text = el.textContent;
        el.setAttribute('aria-label', text);
        const frames = 14;
        let frame = 0;
        const tick = () => {
            const settled = Math.floor((frame / frames) * text.length);
            el.textContent = [...text].map((ch, i) => (
                i < settled || !/[A-Z0-9]/.test(ch) ? ch : pool[Math.floor(Math.random() * pool.length)]
            )).join('');
            frame += 1;
            if (frame <= frames) {
                setTimeout(tick, 28);
            } else {
                el.textContent = text;
            }
        };
        tick();
    }, 0.6);
});
