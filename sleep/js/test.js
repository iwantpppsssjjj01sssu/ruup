// 루틴 유형 진단: 이름 입력 → 질문 5개 → 결과
document.addEventListener('DOMContentLoaded', () => {
    const NAME_KEY = 'luup_test_name';
    const ANSWER_KEY = 'luup_test_answers';

    const storage = {
        get(key, fallback) {
            try {
                const value = localStorage.getItem(key);
                return value === null ? fallback : JSON.parse(value);
            } catch (error) {
                return fallback;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                // 저장이 막혀 있으면 기본값으로 진행
            }
        }
    };

    // 1. 이름 입력
    const nameForm = document.querySelector('[data-name-form]');
    if (nameForm) {
        const input = nameForm.querySelector('[data-name-input]');
        const submit = nameForm.querySelector('[data-name-submit]');
        input.value = storage.get(NAME_KEY, '');
        const syncButton = () => {
            submit.disabled = input.value.trim() === '';
        };
        input.addEventListener('input', syncButton);
        syncButton();
        input.focus();

        nameForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!input.value.trim()) {
                return;
            }
            storage.set(NAME_KEY, input.value.trim());
            storage.set(ANSWER_KEY, []);
            window.location.href = 'sleep_ox.html';
        });
    }

    // 2. 질문
    const question = document.querySelector('[data-question]');
    if (question) {
        const index = Number(question.dataset.question);
        const answers = storage.get(ANSWER_KEY, []);
        const buttons = question.querySelectorAll('[data-answer]');

        buttons.forEach((button) => {
            if (answers[index] === button.dataset.answer) {
                button.classList.add('is-selected');
            }
            button.addEventListener('click', () => {
                buttons.forEach((item) => item.classList.toggle('is-selected', item === button));
                answers[index] = button.dataset.answer;
                storage.set(ANSWER_KEY, answers);
                window.setTimeout(() => {
                    window.location.href = question.dataset.next;
                }, 250);
            });
        });
    }

    // 3. 결과
    const resultType = document.querySelector('[data-result-type]');
    if (resultType) {
        const name = storage.get(NAME_KEY, '') || '회원';
        const answers = storage.get(ANSWER_KEY, []);
        const yes = (index) => answers[index] === 'o';

        const types = {
            owl: {
                icon: '🦉',
                title: '리셋이 필요한 올빼미형',
                summary: '밤에 에너지가 살아나는 타입이에요.',
                desc: '저녁 시간이 길고 잠드는 시간이 늦어지기 쉬워요. 아침을 억지로 바꾸기보다 잠들기 전 습관부터 정리하면 다음 날이 자연스럽게 달라져요.',
                points: ['잠들기 30분 전에는 화면을 멀리하기', '매일 같은 시간에 잠자리 준비 시작하기', '아침 루틴은 5분짜리부터 가볍게'],
                routines: ['digital-detox', 'sleep-ready', 'meditation']
            },
            early: {
                icon: '🐦',
                title: '계획대로 척척 얼리버드형',
                summary: '아침을 잘 쓰는 꾸준한 계획파예요.',
                desc: '이미 좋은 리듬을 갖고 있어요. 아침 시간을 조금 더 의미 있게 채우는 루틴을 더하면 하루의 만족도가 훨씬 높아질 거예요.',
                points: ['아침 시간에 나만의 성장 루틴 더하기', '집중이 잘되는 오전에 중요한 일 배치하기', '연속 기록으로 꾸준함을 눈으로 확인하기'],
                routines: ['miracle-morning', 'focus', 'english']
            },
            together: {
                icon: '🤝',
                title: '함께 달리는 응원형',
                summary: '사람들과 함께할 때 가장 힘이 나요.',
                desc: '혼자 할 때보다 누군가와 약속했을 때 훨씬 잘 지키는 타입이에요. 챌린지에 참여해 서로 인증하고 응원하면 루틴이 오래 이어져요.',
                points: ['친구나 동료와 같은 루틴 시작하기', '챌린지에 참여해 매일 인증하기', '작은 성공도 함께 나누기'],
                routines: ['walk', 'reading', 'home-workout']
            },
            energizer: {
                icon: '⚡',
                title: '몸이 먼저 움직이는 에너자이저형',
                summary: '활동적이고 실행력이 좋은 타입이에요.',
                desc: '몸을 움직이는 데 익숙해서 운동 루틴은 쉽게 자리 잡아요. 에너지를 잘 회복할 수 있도록 수분과 휴식 루틴을 함께 챙겨 주세요.',
                points: ['운동 루틴은 횟수보다 꾸준함에 집중하기', '하루 물 섭취량 챙기기', '운동 후 짧은 스트레칭으로 마무리하기'],
                routines: ['home-workout', 'water', 'morning-stretch']
            },
            sprout: {
                icon: '🌱',
                title: '차근차근 새싹형',
                summary: '작은 것부터 하나씩 쌓아가는 타입이에요.',
                desc: '아직 나에게 맞는 리듬을 찾는 중이에요. 처음부터 큰 목표를 세우기보다 5분 안에 끝나는 쉬운 루틴 하나로 시작하는 게 가장 좋아요.',
                points: ['5분 안에 끝나는 루틴 하나만 고르기', '매일 같은 시간에 알림 받기', '3일, 7일 연속 기록을 작은 목표로 삼기'],
                routines: ['water', 'gratitude', 'morning-stretch']
            }
        };

        let typeKey = 'sprout';
        if (yes(4) && !yes(0)) {
            typeKey = 'owl';
        } else if (yes(0) && yes(1)) {
            typeKey = 'early';
        } else if (yes(2)) {
            typeKey = 'together';
        } else if (yes(3)) {
            typeKey = 'energizer';
        }
        const type = types[typeKey];

        document.querySelector('[data-result-name]').textContent = name;
        document.querySelector('[data-result-icon]').textContent = type.icon;
        resultType.textContent = type.title;
        document.querySelector('[data-result-summary]').textContent = type.summary;
        document.querySelector('[data-result-desc]').textContent = type.desc;
        document.querySelector('[data-result-points]').innerHTML = type.points.map((point) => `<li>${point}</li>`).join('');
        document.querySelector('[data-result-routines]').innerHTML = type.routines
            .map((id) => window.luupFindRoutine(id))
            .filter(Boolean)
            .map((routine) => window.luupRoutineCard(routine, '../product/product.html'))
            .join('');
        document.title = `${type.title} | LUUP`;
    }
});
