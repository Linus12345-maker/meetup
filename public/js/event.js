const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    if (!eventId) {
        window.location.href = '/';
        return;
    }
    loadEvent();
});

async function loadEvent() {
    const container = document.getElementById('event-container');
    try {
        const headers = {};
        if (window.Clerk && window.Clerk.session) {
            const token = await window.Clerk.session.getToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/events/${eventId}`, { headers });
        if (!res.ok) throw new Error('Event not found');
        const event = await res.json();
        renderEvent(event, container);
    } catch (error) {
        container.innerHTML = `
            <div class="text-center py-20">
                <h2 class="text-2xl font-bold mb-2">Event Not Found</h2>
                <p class="text-slateMuted mb-6">The event you are looking for might have been removed or is private.</p>
                <a href="/" class="text-coral hover:underline">Go back home</a>
            </div>
        `;
    }
}

function renderEvent(event, container) {
    const isHost = window.Clerk?.user?.id === event.host?.clerkId;
    const isAttending = event.rsvps?.some(r => r.user?.clerkId === window.Clerk?.user?.id);
    const rsvpCount = event.rsvps?.length || 0;

    const dateObj = new Date(event.dateTime);
    const dateFormatted = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeFormatted = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + ' - ' + new Date(dateObj.getTime() + 2*60*60*1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    container.innerHTML = `
        <div class="px-6 py-[53px] w-full font-display">
            <!-- back button -->
            <a href="/" class="flex items-center gap-1.5 text-[#5a5c5b] text-[15px] font-bold mb-6 hover:text-coral transition-colors">
                <i class="ph ph-arrow-left text-lg"></i>
                <span>Back</span>
            </a>
            
            <!-- Event Cover -->
            <div class="w-full aspect-square md:h-[382px] rounded-[32px] overflow-hidden mb-6 shadow-sm bg-gray-100">
                <img src="${event.coverImageUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80'}" class="w-full h-full object-cover">
            </div>
            
            <div class="flex flex-wrap items-center gap-2 mb-4">
                <h1 class="text-[#2d2f2e] text-[28px] font-extrabold leading-[35px]">${event.title}</h1>
                ${event.isPrivate ? `
                    <div class="bg-coral/10 text-coral px-3 py-1 rounded-full text-[12px] font-bold border border-coral/20 flex items-center gap-1">
                        <i class="ph ph-lock-key"></i> Unlisted
                    </div>
                ` : ''}
            </div>
            
            <!-- date time -->
            <div class="flex items-center gap-[18px] mb-[26px]">
                <div class="w-[42px] h-[42px] shadow-[0_2px_8px_0_rgba(45,47,46,0.06)] bg-white rounded-[12px] flex items-center justify-center shrink-0">
                    <i class="ph ph-calendar-blank text-[24px] text-[#2d2f2e]"></i>
                </div>
                <div class="flex flex-col gap-1">
                    <p class="text-[17px] font-bold text-[#2d2f2e]">${dateFormatted}</p>
                    <p class="text-[14px] text-[#5a5c5b] font-medium">${timeFormatted}</p>
                </div>
            </div>
            
            <!-- location -->
            <div class="flex items-center gap-[18px] mb-[32px]">
                <div class="w-[42px] h-[42px] shadow-[0_2px_8px_0_rgba(45,47,46,0.06)] bg-white rounded-[12px] flex items-center justify-center shrink-0">
                    <i class="ph ph-map-pin text-[24px] text-[#2d2f2e]"></i>
                </div>
                <div class="flex flex-col gap-1">
                    <p class="text-[17px] font-bold text-[#2d2f2e]">${event.locationName || 'Location Not Set'}</p>
                    <p class="text-[14px] text-[#5a5c5b] font-medium underline cursor-pointer hover:text-coral transition-colors">Show map</p>
                </div>
            </div>
            
            <hr class="w-full border-[#f0f1ef] mb-[32px]">
            
            <!-- Host -->
            <div class="flex items-center justify-between mb-[32px]">
                <div class="flex items-center gap-[14px]">
                    <img src="${event.host?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + event.hostId}" class="w-[48px] h-[48px] rounded-full object-cover shadow-sm">
                    <div class="flex flex-col">
                        <p class="text-[17px] font-bold text-[#2d2f2e]">${event.host?.name || 'Anonymous'}</p>
                        <p class="text-[14px] text-[#5a5c5b] font-medium">Host</p>
                    </div>
                </div>
                <button class="bg-[#f0f1ef] hover:bg-gray-200 transition-colors px-[18px] py-[10px] rounded-full text-[#2d2f2e] text-[15px] font-bold">
                    Follow
                </button>
            </div>
            
            <!-- About -->
            <div class="mb-[32px]">
                <h2 class="text-[#2d2f2e] text-[20px] font-bold mb-3">About</h2>
                <div class="text-[#5a5c5b] text-[16px] leading-[24px]">
                    ${(event.description || '').replace(/\n/g, '<br/>')}
                </div>
            </div>

            <!-- Attendees -->
            <div class="mb-[40px]">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-[#2d2f2e] text-[20px] font-bold">Attendees (${rsvpCount})</h2>
                    <span class="text-coral font-bold text-[15px] cursor-pointer">See all</span>
                </div>
                <div class="flex -space-x-3">
                    ${event.rsvps?.slice(0, 8).map(r => `
                        <img src="${r.user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + r.user?.id}" class="w-[46px] h-[46px] rounded-full border-[3px] border-bgWarm object-cover shadow-sm" title="${r.user?.name}">
                    `).join('') || ''}
                </div>
            </div>
            
            <!-- Location Map -->
            <div class="mb-6">
                <h2 class="text-[#2d2f2e] text-[20px] font-bold mb-4">Location</h2>
                <div id="map" class="w-full h-[200px] rounded-[24px] shadow-sm z-10 overflow-hidden border border-[#f0f1ef] bg-gray-50 flex items-center justify-center text-slateMuted">
                   <p class="animate-pulse">Loading map...</p>
                </div>
            </div>
        </div>

        <!-- Fixed bottom RSVP bar -->
        <div class="fixed bottom-0 left-0 w-full bg-white border-t border-[#f0f1ef] px-6 py-4 shadow-[0_-4px_20px_0_rgba(45,47,46,0.05)] z-40">
            <div class="max-w-[430px] mx-auto flex gap-4 items-center">
                <button id="copyBtn" class="w-[54px] h-[54px] shrink-0 rounded-full border border-[#f0f1ef] flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm" title="Copy Invite Link">
                    <i id="share-icon" class="ph ph-share-network text-[24px] text-[#2d2f2e]"></i>
                </button>
                ${isHost ? `
                    <button id="editBtn" class="flex-1 bg-white border-2 border-[#f0f1ef] text-[#2d2f2e] font-bold text-[17px] h-[54px] rounded-full shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                        <i class="ph ph-pencil-simple"></i> Edit Event
                    </button>
                ` : `
                    <button id="rsvpBtn" class="flex-1 ${isAttending ? 'bg-white border-2 border-[#f0f1ef] text-[#2d2f2e]' : 'bg-coral text-white'} font-bold text-[17px] h-[54px] rounded-full shadow-sm hover:opacity-90 transition-opacity">
                        ${isAttending ? 'Cancel RSVP' : 'Join Event'}
                    </button>
                `}
            </div>
        </div>
    `;

    // Add Event Listeners
    const editBtn = document.getElementById('editBtn');
    if (editBtn) editBtn.addEventListener('click', () => editEvent());
    
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', () => copyInviteLink());

    const rsvpBtn = document.getElementById('rsvpBtn');
    if (rsvpBtn) rsvpBtn.addEventListener('click', () => toggleRSVP(isAttending));

    // Initialize map
    if (event.lat && event.lng && window.L) {
        setTimeout(() => {
            const mapEl = document.getElementById('map');
            if (!mapEl) return;
            mapEl.innerHTML = ''; // clear loading text
            
            try {
                const map = L.map('map', { zoomControl: false, dragging: !L.Browser.mobile, scrollWheelZoom: false }).setView([event.lat, event.lng], 14);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; CARTO'
                }).addTo(map);
                
                const markerHtmlStyles = `
                    width: 32px; height: 32px; display: block; left: -16px; top: -32px; position: relative;
                    border-radius: 32px 32px 0; transform: rotate(45deg); border: 2px solid #FFFFFF;
                    background-color: #E8614A; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                `;
                const icon = L.divIcon({
                    className: "custom-pin",
                    html: `<span style="${markerHtmlStyles}" />`
                });
                L.marker([event.lat, event.lng], { icon }).addTo(map);
            } catch (err) {
                console.error('Map init error:', err);
                mapEl.innerHTML = '<div class="text-xs text-textMuted p-4 text-center">Map failed to load. Location: ' + event.locationName + '</div>';
            }
        }, 300);
    }
}

async function toggleRSVP(isCurrentlyAttending) {
    if (!window.Clerk?.user) {
        window.Clerk.openSignIn();
        return;
    }
    const btn = document.getElementById('rsvpBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Processing...';
    
    try {
        const token = await window.Clerk.session.getToken();
        const res = await fetch('/api/rsvp', {
            method: isCurrentlyAttending ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ eventId: eventId })
        });
        
        if (!res.ok) throw new Error('Failed to update RSVP');
        loadEvent(); // Reload to get fresh data
    } catch (err) {
        console.error(err);
        alert('Failed to update RSVP. Please try again.');
        loadEvent();
    }
}

function editEvent() {
    alert('Editing functionality is currently in development. Please come back soon!');
}

async function copyInviteLink() {
    const shareIcon = document.getElementById('share-icon');
    const originalClass = shareIcon.className;
    
    try {
        await navigator.clipboard.writeText(window.location.href);
        shareIcon.className = 'ph ph-check text-[24px] text-green-500';
        setTimeout(() => {
            shareIcon.className = originalClass;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy link:', err);
        alert('Failed to copy link to clipboard.');
    }
}
