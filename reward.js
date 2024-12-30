document.addEventListener('DOMContentLoaded', function() {
    // Данные для reward items
    const rewardItems = [
        {
            title: 'Разработчики',
            points: 1000,
            image: 'https://res.cloudinary.com/dib4woqge/image/upload/v1735053105/photo_5397728990409647380_y_vrqmze.jpg',
            isDone: true
        },
        {
            title: 'Разработчики',
            points: 1000,
            image: 'https://res.cloudinary.com/dib4woqge/image/upload/v1735053105/photo_5397728990409647380_y_vrqmze.jpg',
            isDone: true
        }
    ];

    function createRewardItem(item) {
        return `
            <div class="flex items-center justify-between bg-[#1A1B1A] rounded-xl p-4 cursor-pointer">
                <div class="flex items-center gap-3">
                    <div class="w-[45px] h-[45px] bg-[#262626] rounded-md">
                        <img src="${item.image}" alt="task" class="w-full h-full object-cover p-1 rounded-lg">
                    </div>
                    <div class="flex flex-col">
                        <span class="text-white">${item.title}</span>
                        <div class="flex items-center gap-1">
                            <img src="https://i.postimg.cc/T1LPtGZ9/leaf-card.png" alt="leaf" class="w-[12px] h-[17px]">
                            <span class="text-white">${item.points}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button class="px-6 py-2 rounded-full bg-white/10 text-white">
                        <div class="flex items-center gap-2">
                            Done
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="currentColor" 
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </button>
                    <img src="https://i.postimg.cc/qRSMVPDB/right-arrow.png" alt="arrow" class="w-[8px] h-[14px] opacity-40">
                </div>
            </div>
        `;
    }

    // Инициализация reward секции
    function initRewardSection() {
        const rewardSection = document.querySelector('.reward-section');
        if (!rewardSection) return;

        // Очищаем текущее содержимое
        const rewardList = rewardSection.querySelector('.space-y-3');
        if (rewardList) {
            rewardList.innerHTML = rewardItems.map(item => createRewardItem(item)).join('');
        }
    }

    // Вызываем инициализацию при загрузке страницы
    initRewardSection();

    // Добавляем обработчик для кнопки reward в навигации
    const rewardNavItem = document.querySelector('.nav-item[data-section="reward"]');
    if (rewardNavItem) {
        rewardNavItem.addEventListener('click', () => {
            initRewardSection();
        });
    }
});
