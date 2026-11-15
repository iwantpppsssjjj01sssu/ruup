// LUUP 루틴 데이터 (루틴 둘러보기, 루틴 상세, 진단 결과에서 함께 사용)
window.LUUP_CATEGORIES = {
    morning: '아침',
    health: '건강',
    study: '공부',
    mind: '마음',
    evening: '저녁'
};

window.LUUP_ROUTINES = [
    {
        id: 'miracle-morning',
        icon: '🌅',
        bg: '#fff4e0',
        title: '미라클 모닝',
        category: 'morning',
        desc: '하루를 남들보다 조금 일찍, 나를 위한 시간으로 시작해요.',
        time: '28분',
        level: '보통',
        people: 12480,
        steps: [
            { name: '일어나서 물 한 잔 마시기', min: '1분' },
            { name: '이불 정리하기', min: '2분' },
            { name: '가벼운 스트레칭', min: '10분' },
            { name: '오늘 할 일 3개 적기', min: '5분' },
            { name: '10분 독서', min: '10분' }
        ],
        tip: '알람은 침대에서 손이 닿지 않는 곳에 두면 다시 잠들 확률이 줄어들어요.'
    },
    {
        id: 'morning-stretch',
        icon: '🧘',
        bg: '#e6fbf5',
        title: '아침 스트레칭',
        category: 'morning',
        desc: '굳은 몸을 깨우는 10분, 하루 컨디션이 달라져요.',
        time: '10분',
        level: '쉬움',
        people: 18203,
        steps: [
            { name: '목·어깨 천천히 돌리기', min: '3분' },
            { name: '전신 늘리기 스트레칭', min: '5분' },
            { name: '깊게 숨 쉬기 5번', min: '2분' }
        ],
        tip: '침대 위에서 바로 시작해도 괜찮아요. 시작이 쉬워야 오래가요.'
    },
    {
        id: 'water',
        icon: '💧',
        bg: '#eaf6fe',
        title: '물 8잔 마시기',
        category: 'health',
        desc: '하루 종일 나눠 마시는 물 8잔으로 몸의 리듬을 지켜요.',
        time: '하루 종일',
        level: '쉬움',
        people: 21567,
        steps: [
            { name: '일어나자마자 1잔', min: '아침' },
            { name: '오전 업무 중 2잔', min: '오전' },
            { name: '점심 식사 후 1잔', min: '점심' },
            { name: '오후에 2잔', min: '오후' },
            { name: '저녁에 2잔', min: '저녁' }
        ],
        tip: '눈에 잘 보이는 곳에 물병을 두면 마시는 횟수가 자연스럽게 늘어나요.'
    },
    {
        id: 'walk',
        icon: '🏃',
        bg: '#e6fbf5',
        title: '하루 30분 걷기',
        category: 'health',
        desc: '출퇴근길이나 점심시간, 30분만 걸어도 충분해요.',
        time: '30분',
        level: '쉬움',
        people: 15832,
        steps: [
            { name: '발목·무릎 풀기', min: '3분' },
            { name: '조금 빠르게 걷기', min: '25분' },
            { name: '종아리 스트레칭', min: '2분' }
        ],
        tip: '좋아하는 팟캐스트나 음악과 함께하면 30분이 금방 지나가요.'
    },
    {
        id: 'home-workout',
        icon: '💪',
        bg: '#ffeef0',
        title: '홈트레이닝 15분',
        category: 'health',
        desc: '집에서 도구 없이, 15분이면 하루 운동 끝.',
        time: '15분',
        level: '보통',
        people: 9874,
        steps: [
            { name: '스쿼트 20개', min: '4분' },
            { name: '푸시업 10개', min: '3분' },
            { name: '플랭크 1분', min: '3분' },
            { name: '런지 20개', min: '5분' }
        ],
        tip: '처음에는 횟수를 절반으로 줄여도 괜찮아요. 매일 하는 게 더 중요해요.'
    },
    {
        id: 'focus',
        icon: '🎯',
        bg: '#eaf6fe',
        title: '집중 공부 시작 루틴',
        category: 'study',
        desc: '책상에 앉기까지가 제일 어렵다면, 이 순서대로 해 보세요.',
        time: '37분',
        level: '보통',
        people: 11209,
        steps: [
            { name: '책상 위 정리하기', min: '3분' },
            { name: '휴대폰 다른 방에 두기', min: '1분' },
            { name: '오늘의 목표 한 줄 쓰기', min: '3분' },
            { name: '25분 집중하기', min: '25분' },
            { name: '5분 쉬기', min: '5분' }
        ],
        tip: '25분 집중 + 5분 휴식을 한 세트로 생각하면 부담이 줄어들어요.'
    },
    {
        id: 'reading',
        icon: '📖',
        bg: '#f3ecff',
        title: '매일 20페이지 독서',
        category: 'study',
        desc: '하루 20페이지면 한 달에 두 권을 읽을 수 있어요.',
        time: '30분',
        level: '쉬움',
        people: 8641,
        steps: [
            { name: '읽을 책 펴 두기', min: '1분' },
            { name: '20페이지 읽기', min: '25분' },
            { name: '기억에 남는 문장 한 줄 기록', min: '4분' }
        ],
        tip: '잠들기 전 휴대폰 대신 책을 머리맡에 두는 것부터 시작해 보세요.'
    },
    {
        id: 'english',
        icon: '🗣️',
        bg: '#fff4e0',
        title: '영어 한 문장',
        category: 'study',
        desc: '하루 한 문장씩, 듣고 따라 하고 내 것으로 만들어요.',
        time: '15분',
        level: '쉬움',
        people: 7325,
        steps: [
            { name: '오늘의 문장 듣기', min: '3분' },
            { name: '소리 내어 따라 말하기', min: '5분' },
            { name: '내 상황으로 문장 바꿔 쓰기', min: '7분' }
        ],
        tip: '출근길처럼 매일 같은 시간에 하면 습관으로 자리 잡기 쉬워요.'
    },
    {
        id: 'gratitude',
        icon: '✍️',
        bg: '#ffeef0',
        title: '감사 일기',
        category: 'mind',
        desc: '하루를 마무리하며 좋았던 순간을 세 줄로 남겨요.',
        time: '7분',
        level: '쉬움',
        people: 13958,
        steps: [
            { name: '오늘 감사했던 일 3가지 쓰기', min: '5분' },
            { name: '내일 기대되는 일 1가지 쓰기', min: '2분' }
        ],
        tip: '거창하지 않아도 돼요. "점심이 맛있었다"도 충분한 감사예요.'
    },
    {
        id: 'meditation',
        icon: '🌿',
        bg: '#e6fbf5',
        title: '5분 명상',
        category: 'mind',
        desc: '복잡한 머릿속을 잠시 비우는 5분의 쉼표.',
        time: '5분',
        level: '쉬움',
        people: 10437,
        steps: [
            { name: '편한 자세로 앉기', min: '1분' },
            { name: '호흡에만 집중하기', min: '3분' },
            { name: '머리부터 발끝까지 느껴 보기', min: '1분' }
        ],
        tip: '생각이 떠올라도 괜찮아요. 다시 호흡으로 돌아오면 돼요.'
    },
    {
        id: 'digital-detox',
        icon: '📵',
        bg: '#eaf6fe',
        title: '디지털 디톡스',
        category: 'evening',
        desc: '잠들기 전 30분, 화면 대신 나에게 집중해요.',
        time: '32분',
        level: '보통',
        people: 6982,
        steps: [
            { name: '앱 알림 끄기', min: '1분' },
            { name: '휴대폰을 충전기에 두기', min: '1분' },
            { name: '종이책 읽기나 가족과 대화', min: '30분' }
        ],
        tip: '휴대폰 충전기를 침실 밖에 두면 훨씬 쉬워져요.'
    },
    {
        id: 'sleep-ready',
        icon: '🌙',
        bg: '#f3ecff',
        title: '꿀잠 준비 루틴',
        category: 'evening',
        desc: '매일 같은 순서로 잠들 준비를 하면 몸이 먼저 알아채요.',
        time: '21분',
        level: '쉬움',
        people: 14576,
        steps: [
            { name: '따뜻한 물로 샤워하기', min: '10분' },
            { name: '조명 어둡게 하기', min: '1분' },
            { name: '누워서 하는 스트레칭', min: '5분' },
            { name: '내일 입을 옷 챙겨 두기', min: '5분' }
        ],
        tip: '매일 비슷한 시간에 시작하는 것이 가장 중요해요.'
    }
];

window.luupFindRoutine = (id) => window.LUUP_ROUTINES.find((routine) => routine.id === id);

window.luupFormatPeople = (number) => number.toLocaleString('ko-KR');

// 루틴 카드 HTML (목록, 관련 루틴, 진단 결과에서 사용)
window.luupRoutineCard = (routine, detailPath) => `
    <a class="routine_card" href="${detailPath}?id=${routine.id}">
        <div class="routine_card_top">
            <span class="routine_icon" style="--icon-bg:${routine.bg}">${routine.icon}</span>
            <span class="badge badge_soft">${window.LUUP_CATEGORIES[routine.category]}</span>
        </div>
        <h3>${routine.title}</h3>
        <p>${routine.desc}</p>
        <ul class="routine_card_meta">
            <li>${routine.steps.length}단계</li>
            <li>${routine.time}</li>
            <li>${window.luupFormatPeople(routine.people)}명</li>
        </ul>
    </a>
`;
