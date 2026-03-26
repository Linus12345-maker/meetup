const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    if (!profileId) {
        window.location.href = '/';
        return;
    }
    loadProfile();
});

async function loadProfile() {
    const container = document.getElementById('profile-container');
    try {
        const res = await fetch(`/api/users/${profileId}`);
        if (!res.ok) throw new Error('User not found');
        const user = await res.json();
        
        container.innerHTML = `
            <div class="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
                <img src="${user.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp'}" class="w-32 h-32 rounded-full shadow-md object-cover ring-4 ring-orange-50">
                <div class="text-center md:text-left flex-1">
                    <h1 class="font-display font-bold text-3xl md:text-4xl mb-2">${user.name}</h1>
                    <p class="text-slateMuted max-w-xl text-lg">${user.bio || 'This user prefers to keep an air of mystery about them.'}</p>
                    <div class="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                        <div class="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 flex items-center gap-2">
                            <i class="ph ph-calendar-star text-coral"></i>
                            <span class="font-bold">${user.hostedEvents?.length || 0} Hosted</span>
                        </div>
                    </div>
                </div>
            </div>

            <h2 class="font-display font-bold text-2xl mb-6">Events Hosted by ${user.name.split(' ')[0]}</h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="hosted-grid">
                ${(user.hostedEvents || []).map(event => {
                    const dateObj = new Date(event.dateTime);
                    const formattedDateTime = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    return `
                    <a href="/event.html?id=${event.id}" class="bg-white rounded-[24px] p-4 flex flex-col gap-6 shadow-[0_20px_40px_0_rgba(45,47,46,0.06)] hover:shadow-[0_20px_40px_0_rgba(45,47,46,0.1)] transition-all hover:-translate-y-1 block font-display">
                        <div class="relative h-[224px] w-full rounded-2xl overflow-hidden shrink-0">
                            <img src="${event.coverImageUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80'}" alt="${event.title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105">
                            <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[#a73220] text-[12px] font-bold tracking-[0.6px] uppercase">
                                ${event.category?.name || 'Event'}
                            </div>
                            <button class="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white text-[#2D2F2E] transition-colors shadow-sm" onclick="event.preventDefault();">
                                <i class="ph ph-heart text-[20px]"></i>
                            </button>
                        </div>
                        <div class="flex flex-col gap-4 flex-1">
                            <div class="flex flex-col gap-1">
                                <div class="text-[#a73220] font-bold text-[12px] truncate">
                                    ${formattedDateTime}
                                </div>
                                <h3 class="text-[#2d2f2e] font-bold text-[20px] leading-[25px] line-clamp-2">${event.title}</h3>
                                <div class="flex items-center gap-1.5 text-[#5a5c5b] font-medium text-[14px] mt-1">
                                    <i class="ph ph-map-pin"></i>
                                    <span class="truncate">${event.locationName || 'San Francisco, CA'}</span>
                                </div>
                            </div>
                            
                            <div class="border-t border-[#f0f1ef] pt-[17px] mt-auto flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <img src="${user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.clerkId}" class="w-8 h-8 rounded-full object-cover">
                                    <p class="text-[14px] text-[#5a5c5b]">
                                        Hosted by <span class="font-semibold text-[#2d2f2e]">${user.name || 'User'}</span>
                                    </p>
                                </div>
                                <div class="bg-[#d996fe]/20 px-[8px] py-[4px] rounded-[6px]">
                                    <span class="text-[#7d40a1] font-bold text-[12px]">${event.rsvps?.length || 0} going</span>
                                </div>
                            </div>
                        </div>
                    </a>
                `}).join('')}
                ${!user.hostedEvents?.length ? '<p class="text-slateMuted col-span-full">No events hosted yet.</p>' : ''}
            </div>
        `;
    } catch (error) {
        container.innerHTML = `
            <div class="text-center py-20">
                <h2 class="text-2xl font-bold mb-2">Profile Not Found</h2>
                <a href="/" class="text-coral hover:underline">Go back home</a>
            </div>
        `;
    }
}
