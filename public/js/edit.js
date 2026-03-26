const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

if (!eventId) {
    window.location.href = '/dashboard.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth
    const checkAuth = setInterval(async () => {
        const isClerkReady = window.Clerk && (window.Clerk.loaded || (typeof window.Clerk.isReady === 'function' && window.Clerk.isReady()));
        if (isClerkReady) {
            clearInterval(checkAuth);
            if (!window.Clerk.user) {
                window.location.href = '/login.html';
                return;
            }
            fetchEventData();
        }
    }, 100);
});

async function fetchEventData() {
    try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) throw new Error('Event not found');
        const event = await res.json();

        // Verify Host
        if (event.host?.clerkId !== window.Clerk.user.id) {
            alert('Unauthorized: You are not the host of this event.');
            window.location.href = '/dashboard.html';
            return;
        }

        populateForm(event);
    } catch (err) {
        console.error(err);
        alert('Failed to load event data.');
        window.location.href = '/dashboard.html';
    }
}

function populateForm(event) {
    const form = document.getElementById('editForm');
    const loading = document.getElementById('loadingState');
    
    // Fill fields
    form.title.value = event.title;
    form.description.value = event.description;
    form.categorySlug.value = event.categorySlug;
    form.locationName.value = event.locationName;
    form.capacity.value = event.maxAttendees || '';
    
    // Format Date for datetime-local (YYYY-MM-DDThh:mm)
    if (event.dateTime) {
        const date = new Date(event.dateTime);
        const iso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        form.dateTime.value = iso;
    }
    
    form.isPrivate.checked = event.isPrivate;
    document.getElementById('coverImageUrl').value = event.coverImageUrl || '';
    
    if (event.coverImageUrl) {
        const preview = document.getElementById('imagePreview');
        preview.src = event.coverImageUrl;
        preview.classList.remove('hidden');
    }

    // Coordinates
    document.getElementById('latInput').value = event.lat || '';
    document.getElementById('lngInput').value = event.lng || '';

    // Show form
    loading.classList.add('hidden');
    form.classList.remove('hidden');
}

// Cloudinary Widget
const uploadWidget = cloudinary.createUploadWidget({
    cloudName: 'dudh627hx',
    uploadPreset: 'meetdown_presets',
    cropping: true,
    multiple: false,
    folder: 'meetup_covers'
}, (error, result) => {
    if (!error && result && result.event === "success") {
        const url = result.info.secure_url;
        document.getElementById('coverImageUrl').value = url;
        const preview = document.getElementById('imagePreview');
        preview.src = url;
        preview.classList.remove('hidden');
    }
});

document.getElementById('uploadWidget').addEventListener('click', () => {
    uploadWidget.open();
});

// Submit Handler
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Saving...';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Convert checkbox to boolean
    data.isPrivate = formData.get('isPrivate') === 'on';
    if (data.capacity) data.maxAttendees = parseInt(data.capacity);

    try {
        const token = await window.Clerk.session.getToken();
        const res = await fetch(`/api/events/${eventId}`, {
            method: 'PUT', // The API handles PUT as update
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to update event');
        }

        window.location.href = `/event.html?id=${eventId}`;
    } catch (err) {
        console.error(err);
        alert(err.message);
        btn.disabled = false;
        btn.innerText = originalText;
    }
});

// Delete Handler
document.getElementById('deleteBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    const btn = document.getElementById('deleteBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Deleting...';

    try {
        const token = await window.Clerk.session.getToken();
        const res = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to delete event');

        alert('Event deleted successfully.');
        window.location.href = '/dashboard.html';
    } catch (err) {
        console.error(err);
        alert('Failed to delete event.');
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-trash"></i> Delete Event';
    }
});
