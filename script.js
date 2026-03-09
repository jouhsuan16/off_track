const NOTES_DATA = [
    "We do not measure decisions by speed of agreement.",
    "We do not require full consensus in order to move forward.",
    "When disagreement arises, we allow ideas to coexist rather than eliminate difference.",
    "When voting occurs, minority positions remain documented.",
    "If consensus cannot be reached, we experiment instead of forcing unity.",
    "We do not erase dissent.",
    "Conflict is not a problem to suppress but a site where thinking happens.",
    "Before major discussions, we create space for silence.",
    "We do not reward immediate rebuttal.",
    "We do not measure participation by speed of response.",
    "We pause rather than escalate.",
    "We reflect rather than blame.",
    "Tension may remain without immediate resolution.",
    "We refuse to reproduce productivity pressure within our collective.",
    "We reserve time for thinking.",
    "We do not require a unified visual style.",
    "We do not require a single voice.",
    "Multiple versions may coexist.",
    "Slowness is not delay.",
    "The unfinished is not failure.",
    "There is no single correct outcome.",
    "Roles are positions of support, not symbols of authority.",
    "There is no fixed leader.",
    "Creative direction rotates.",
    "Each member may facilitate.",
    "Roles shift according to the phase of the project.",
    "Power is not centralized.",
    "Responsibility is shared.",
    "We begin meetings with a brief emotional check-in.",
    "Members may say, “I am not at capacity today.”",
    "Rest is not withdrawal.",
    "We resist emotional numbness."
];

// --- Homepage Background Images ---
// 根据用户提供的图片名称 (1.jpeg - 20.jpeg) 自动生成路径
const HOMEPAGE_IMAGES = [];
for (let i = 1; i <= 20; i++) {
    HOMEPAGE_IMAGES.push(`assets/images/${i}.jpeg`);
}

// Aesthetic, gentle pale colors (distinct yellow, green, blue, purple)
const NOTE_COLORS = [
    "#FFF7B0", "#FFED99", "#FFF0A3", "#FCEEAD",
    // Fresh & Gentle Pale Greens
    "#D9F2D9", "#C1E8C1", "#E2F0CB", "#B5EAEA",
    // Clear & Gentle Pale Blues (distinct from purple)
    "#CDE4FF", "#B3D4FF", "#A2CFFE", "#D1E8FF",
    // Soft & Gentle Pale Purples (distinct from blue)
    "#E1C6FF", "#D0B2FF", "#E8D0FF", "#F1E0FF",
    // Pale Pinks/Blush (no red/coral, just very soft blush)
    "#FCE4EC", "#F8BBD0",
    // Soft Pale Orange/Peaches
    "#FFE0B2", "#FFD1A9"
];

// Diverse fonts from google fonts linked in HTML
const NOTE_FONTS = [
    "'Caveat', cursive",
    "'Courier Prime', monospace",
    "'DM Serif Display', serif",
    "'Inter', sans-serif",
    "'Lora', serif",
    "'Permanent Marker', cursive",
    "'Playfair Display', serif",
    "'Space Mono', monospace"
];

let globalZIndex = 10; // start above 1 just in case
let centerRect = null;
const isSplitView = window.isSplitView || false;

// --- Mock Backend API using LocalStorage ---
const STORAGE_KEY = 'manifesto_votes_comments';

function getVotesAndComments(noteId) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!data[noteId]) {
        data[noteId] = { likes: 0, dislikes: 0, comments: [] };
    }
    return data[noteId];
}

function saveVotesAndComments(noteId, newData) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[noteId] = newData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getUserInteraction(noteId) {
    const interactions = JSON.parse(localStorage.getItem('manifesto_user_interactions') || '{}');
    return interactions[noteId] || null;
}

function setUserInteraction(noteId, type) {
    const interactions = JSON.parse(localStorage.getItem('manifesto_user_interactions') || '{}');
    if (type === null) {
        delete interactions[noteId];
    } else {
        interactions[noteId] = type;
    }
    localStorage.setItem('manifesto_user_interactions', JSON.stringify(interactions));
}
// ------------------------------------------

function getObstacleRect() {
    if (isSplitView) return null; // No obstacle in split view (right pane is entirely free)
    const guide = document.getElementById('center-guide');
    if (!guide) return null;
    return guide.getBoundingClientRect();
}

function resolveCollision(x, y, width, height, obstacle) {
    if (!obstacle) return { x, y };

    const pad = 30; // 30px padding around the center block
    const obsL = obstacle.left - pad;
    const obsR = obstacle.right + pad;
    const obsT = obstacle.top - pad;
    const obsB = obstacle.bottom + pad;

    const myL = x;
    const myR = x + width;
    const myT = y;
    const myB = y + height;

    // Is there an intersection?
    if (myR > obsL && myL < obsR && myB > obsT && myT < obsB) {
        // Find overlap resolving distance
        const overlapL = myR - obsL;
        const overlapR = obsR - myL;
        const overlapT = myB - obsT;
        const overlapB = obsB - myT;

        const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

        // Push out in the direction of the smallest overlap
        if (minOverlap === overlapL) return { x: x - overlapL, y };
        if (minOverlap === overlapR) return { x: x + overlapR, y };
        if (minOverlap === overlapT) return { x, y: y - overlapT };
        if (minOverlap === overlapB) return { x, y: y + overlapB };
    }

    return { x, y };
}

function initHomepageBackground() {
    // This function is for the index.html page only
    if (typeof HOMEPAGE_IMAGES === 'undefined' || HOMEPAGE_IMAGES.length === 0) return;

    const bgContainer = document.getElementById('background-container');
    if (!bgContainer) return;

    const randomIndex = Math.floor(Math.random() * HOMEPAGE_IMAGES.length);
    const selectedImage = HOMEPAGE_IMAGES[randomIndex];
    bgContainer.style.backgroundImage = `url('${selectedImage}')`;
}

function spawnNotes() {
    const container = document.getElementById('sticky-notes-container');
    centerRect = getObstacleRect();

    // Bounds geometry. If split view, width is half the screen
    const bounds = {
        width: isSplitView ? window.innerWidth / 2 : window.innerWidth,
        height: window.innerHeight
    };

    NOTES_DATA.forEach((text, index) => {
        const noteId = 'note_' + index;
        const noteData = getVotesAndComments(noteId);
        const userInt = getUserInteraction(noteId);

        const note = document.createElement('div');
        note.className = 'sticky-note';
        note.dataset.id = noteId;

        // Random styles
        const bgColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
        const font = NOTE_FONTS[Math.floor(Math.random() * NOTE_FONTS.length)];
        const rotation = (Math.random() - 0.5) * 20; // -10 to 10 degrees

        note.dataset.rotation = rotation;
        note.style.transform = `rotate(${rotation}deg)`;

        // Build inner 3D structure
        const inner = document.createElement('div');
        inner.className = 'note-inner';

        const front = document.createElement('div');
        front.className = 'note-front';
        front.style.backgroundColor = bgColor;
        front.style.fontFamily = font;

        const content = document.createElement('div');
        content.className = 'note-text-content';
        content.textContent = text;

        const actions = document.createElement('div');
        actions.className = 'note-actions';

        const likeBtn = document.createElement('button');
        likeBtn.className = `vote-btn ${userInt === 'like' ? 'liked' : ''}`;
        likeBtn.innerHTML = `👍 <span class="like-count">${noteData.likes}</span>`;

        const dislikeBtn = document.createElement('button');
        dislikeBtn.className = `vote-btn ${userInt === 'dislike' ? 'disliked' : ''}`;
        dislikeBtn.innerHTML = `👎 <span class="dislike-count">${noteData.dislikes}</span>`;

        actions.appendChild(likeBtn);
        actions.appendChild(dislikeBtn);

        front.appendChild(content);
        front.appendChild(actions);

        const back = document.createElement('div');
        back.className = 'note-back';
        back.style.backgroundColor = bgColor;

        const flipBackBtn = document.createElement('button');
        flipBackBtn.className = 'flip-back-btn';
        flipBackBtn.innerHTML = '✕';
        flipBackBtn.title = "Flip back";

        const commentsContainer = document.createElement('div');
        commentsContainer.className = 'comments-container';

        noteData.comments.forEach(c => {
            const cdiv = document.createElement('div');
            cdiv.className = 'comment-item';
            cdiv.textContent = c.text;
            commentsContainer.appendChild(cdiv);
        });

        const commentForm = document.createElement('form');
        commentForm.className = 'comment-form';
        const textarea = document.createElement('textarea');
        textarea.placeholder = "Why do you agree/disagree?";
        const submitBtn = document.createElement('button');
        submitBtn.className = 'comment-submit';
        submitBtn.type = 'submit';
        submitBtn.textContent = 'Add Note';

        commentForm.appendChild(textarea);
        commentForm.appendChild(submitBtn);

        back.appendChild(flipBackBtn);
        back.appendChild(commentsContainer);
        back.appendChild(commentForm);

        inner.appendChild(front);
        inner.appendChild(back);
        note.appendChild(inner);

        // Wait... sticky notes logic should only run on index.html now
        if (isSplitView) return;

        let posX, posY;
        const noteWidth = 150;
        const noteHeight = 150;
        let intersecting = true;
        let attempts = 0;

        while (intersecting && attempts < 100) {
            posX = Math.random() * (bounds.width - noteWidth);
            posY = Math.random() * (bounds.height - noteHeight);

            if (!isSplitView && centerRect) {
                const testPos = resolveCollision(posX, posY, noteWidth, noteHeight, centerRect);
                // If it didn't push out, it means no intersection
                if (testPos.x === posX && testPos.y === posY) {
                    intersecting = false;
                }
            } else {
                intersecting = false;
            }
            attempts++;
        }

        note.style.left = `${posX}px`;
        note.style.top = `${posY}px`;

        // Let's add custom velocities for organic floating
        const vx = (Math.random() - 0.5) * 1.5; // random float velocity X
        const vy = (Math.random() - 0.5) * 1.5; // random float velocity Y
        note.dataset.vx = vx;
        note.dataset.vy = vy;
        note.dataset.floating = "true";

        // We need to apply scaling in JS to composite with the random rotation properly
        note.addEventListener('mouseenter', () => {
            note.dataset.floating = "false"; // Pause floating on hover
            note.style.transform = `rotate(${rotation}deg) scale(1.5)`;
            note.style.zIndex = 50;
        });
        note.addEventListener('mouseleave', () => {
            // only reset if not flipped or dragging
            if (!note.classList.contains('flipped') && !note.classList.contains('dragging')) {
                note.style.transform = `rotate(${rotation}deg) scale(1)`;
                note.style.zIndex = '';
                // Resume floating if textarea isn't focused
                if (document.activeElement !== textarea) {
                    note.dataset.floating = "true";
                }
            }
        });

        // --- Events ---
        note.addEventListener('dblclick', (e) => {
            if (e.target.closest('button') || e.target.closest('textarea') || e.target.closest('.comments-container')) return;
            note.classList.toggle('flipped');
            if (note.classList.contains('flipped')) {
                note.dataset.floating = "false";
                note.style.transform = `rotate(${rotation}deg) scale(1.5)`;
                note.style.zIndex = 50;
                textarea.focus();
            } else {
                // If unflipped via double click, and mouse is presumably still over it, keep scale but remove flip
                note.style.transform = `rotate(${rotation}deg) scale(1.5)`;
                // Floating remains false because mouse is still over it
            }
        });

        flipBackBtn.addEventListener('click', () => {
            note.classList.remove('flipped');
            note.style.transform = `rotate(${rotation}deg) scale(1.5)`; // assuming mouse is still inside
            // Floating remains false as mouse is inside
        });

        likeBtn.addEventListener('click', () => {
            const currentData = getVotesAndComments(noteId);
            const prevInteract = getUserInteraction(noteId);

            if (prevInteract === 'like') {
                currentData.likes = Math.max(0, currentData.likes - 1);
                setUserInteraction(noteId, null);
                likeBtn.classList.remove('liked');
            } else {
                currentData.likes++;
                if (prevInteract === 'dislike') {
                    currentData.dislikes = Math.max(0, currentData.dislikes - 1);
                    dislikeBtn.classList.remove('disliked');
                    dislikeBtn.querySelector('.dislike-count').textContent = currentData.dislikes;
                }
                setUserInteraction(noteId, 'like');
                likeBtn.classList.add('liked');

                // Flash animation
                inner.classList.remove('flashing');
                void inner.offsetWidth;
                inner.classList.add('flashing');
            }

            likeBtn.querySelector('.like-count').textContent = currentData.likes;
            saveVotesAndComments(noteId, currentData);
        });

        dislikeBtn.addEventListener('click', () => {
            const currentData = getVotesAndComments(noteId);
            const prevInteract = getUserInteraction(noteId);

            if (prevInteract === 'dislike') {
                currentData.dislikes = Math.max(0, currentData.dislikes - 1);
                setUserInteraction(noteId, null);
                dislikeBtn.classList.remove('disliked');
            } else {
                currentData.dislikes++;
                if (prevInteract === 'like') {
                    currentData.likes = Math.max(0, currentData.likes - 1);
                    likeBtn.classList.remove('liked');
                    likeBtn.querySelector('.like-count').textContent = currentData.likes;
                }
                setUserInteraction(noteId, 'dislike');
                dislikeBtn.classList.add('disliked');

                note.classList.add('flipped');
                setTimeout(() => textarea.focus(), 300);
            }

            dislikeBtn.querySelector('.dislike-count').textContent = currentData.dislikes;
            saveVotesAndComments(noteId, currentData);
        });

        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const commentText = textarea.value.trim();
            if (!commentText) return;

            const currentData = getVotesAndComments(noteId);
            currentData.comments.push({ text: commentText });
            saveVotesAndComments(noteId, currentData);

            const cdiv = document.createElement('div');
            cdiv.className = 'comment-item';
            cdiv.textContent = commentText;
            commentsContainer.appendChild(cdiv);

            commentsContainer.scrollTop = commentsContainer.scrollHeight;
            textarea.value = '';
            textarea.blur(); // Remove focus to ensure hover/focus expanding states drop
        });

        makeDraggable(note);
        container.appendChild(note);
    });
}

function makeDraggable(element) {
    let isDragging = false;
    let startMouseX, startMouseY;
    let startElLeft, startElTop;

    const onMouseDown = (e) => {
        // Prevent drag if clicking on an interactive element
        if (e.target.closest('button') || e.target.closest('textarea') || e.target.closest('.comments-container')) {
            return;
        }

        // Prevent default text selection
        if (e.type !== 'touchstart') {
            e.preventDefault();
        }

        isDragging = true;
        element.dataset.floating = "false"; // Stop floating when dragging

        // Bring to front and scale
        globalZIndex++;
        element.style.zIndex = globalZIndex;
        element.classList.add('dragging');

        const rot = element.dataset.rotation || 0;
        element.style.transform = `rotate(${rot}deg) scale(1.5)`;

        // Update center bounding box in case of window resize or scrolling
        centerRect = getObstacleRect();

        startMouseX = e.clientX || e.touches?.[0].clientX;
        startMouseY = e.clientY || e.touches?.[0].clientY;
        startElLeft = parseFloat(element.style.left) || 0;
        startElTop = parseFloat(element.style.top) || 0;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchmove', onMouseMove, { passive: false });
        document.addEventListener('touchend', onMouseUp);
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        if (e.type === 'touchmove') e.preventDefault(); // prevent scroll on touch drag

        const currentX = e.clientX || e.touches?.[0].clientX;
        const currentY = e.clientY || e.touches?.[0].clientY;

        const deltaX = currentX - startMouseX;
        const deltaY = currentY - startMouseY;

        let newLeft = startElLeft + deltaX;
        let newTop = startElTop + deltaY;

        // Bounding box of the container
        const boundingWidth = isSplitView ? window.innerWidth / 2 : window.innerWidth;
        const boundingHeight = window.innerHeight;

        // 1. Constrain to screen view using the zoomed width
        const currentWidth = element.getBoundingClientRect().width;
        newLeft = Math.max(0, Math.min(newLeft, boundingWidth - currentWidth));
        newTop = Math.max(0, Math.min(newTop, boundingHeight - currentWidth));

        // We no longer resolve center collision during drag, so notes can visually float over the text
        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
    };

    const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        element.classList.remove('dragging');

        const rot = element.dataset.rotation || 0;
        if (!element.classList.contains('flipped')) {
            // Assume we might still be hovering, mouseleave will handle true unhover
            element.style.transform = `rotate(${rot}deg) scale(1)`;
            // Allow floating to resume if mouse actually leaves the bounding box
            element.dataset.floating = "true";
        }

        // On drop, check if the note is resting on the center manifesto text
        if (!isSplitView && centerRect) {
            // Get current un-zoomed dimensions for resting state collision testing
            const finalWidth = 150;
            const currentLeft = parseFloat(element.style.left);
            const currentTop = parseFloat(element.style.top);

            const resolvedPos = resolveCollision(currentLeft, currentTop, finalWidth, finalWidth, centerRect);

            if (resolvedPos.x !== currentLeft || resolvedPos.y !== currentTop) {
                // There was a collision. Animate sliding out.
                // We add a temporary class that enables top/left transitions just for this slide
                element.style.transition = 'left 0.4s ease-out, top 0.4s ease-out, box-shadow 0.2s, transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), width 0.3s ease, min-height 0.3s ease, font-size 0.3s ease';

                // Force a reflow
                void element.offsetWidth;

                element.style.left = `${resolvedPos.x}px`;
                element.style.top = `${resolvedPos.y}px`;

                // Remove the layout transitions after it finishes sliding so dragging remains instantaneous
                setTimeout(() => {
                    element.style.transition = '';
                }, 400);
            }
        }

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('touchend', onMouseUp);
    };

    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('touchstart', onMouseDown, { passive: false });
}

// --- Floating Animation Loop ---
function startFloatingAnimation() {
    const container = document.getElementById('sticky-notes-container');

    function animate() {
        if (!isSplitView) {
            const notes = container.querySelectorAll('.sticky-note');
            const bounds = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            const centerObstacle = getObstacleRect();

            notes.forEach(note => {
                if (note.dataset.floating !== "true") return;

                let left = parseFloat(note.style.left) || 0;
                let top = parseFloat(note.style.top) || 0;
                let vx = parseFloat(note.dataset.vx) || 0;
                let vy = parseFloat(note.dataset.vy) || 0;
                const width = note.offsetWidth;
                const height = note.offsetHeight;

                left += vx;
                top += vy;

                // Bounce off edges of screen
                if (left <= 0) {
                    left = 0;
                    vx *= -1;
                } else if (left + width >= bounds.width) {
                    left = bounds.width - width;
                    vx *= -1;
                }

                if (top <= 0) {
                    top = 0;
                    vy *= -1;
                } else if (top + height >= bounds.height) {
                    top = bounds.height - height;
                    vy *= -1;
                }

                // Bounce off center guide
                // We use a simplified AABB check for the center guide
                if (centerObstacle) {
                    const pad = 30;
                    const obsL = centerObstacle.left - pad;
                    const obsR = centerObstacle.right + pad;
                    const obsT = centerObstacle.top - pad;
                    const obsB = centerObstacle.bottom + pad;

                    if (left + width > obsL && left < obsR && top + height > obsT && top < obsB) {
                        // Figure out which side it hit
                        const overlapL = (left + width) - obsL;
                        const overlapR = obsR - left;
                        const overlapT = (top + height) - obsT;
                        const overlapB = obsB - top;

                        const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

                        if (minOverlap === overlapL || minOverlap === overlapR) {
                            vx *= -1;
                            left += vx * 2; // push out slightly
                        } else {
                            vy *= -1;
                            top += vy * 2;
                        }
                    }
                }

                note.style.left = `${left}px`;
                note.style.top = `${top}px`;
                note.dataset.vx = vx;
                note.dataset.vy = vy;
            });
        }
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

// Canvas Drawing Logic for Manifesto Page
function initCanvasDrawing() {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rightPane = document.getElementById('right-pane');
    const promptText = document.getElementById('draw-prompt');
    const controls = document.getElementById('canvas-controls');
    const saveBtn = document.getElementById('save-btn');
    const restartBtn = document.getElementById('start-again-btn');

    // Modal elements
    const saveModal = document.getElementById('save-modal');
    const savedPreview = document.getElementById('saved-image-preview');
    const restartCountText = document.getElementById('restart-count-text');
    const closeModalBtn = document.getElementById('close-modal-btn');

    let isDrawing = false;
    let hasStarted = false;
    let hasSaved = false;

    // Restart logic
    let restartCount = parseInt(localStorage.getItem('manifestoRestartCount') || '0', 10);

    // Line state
    let path = [];
    let lastX = 0;
    let lastY = 0;
    let startTime = 0;

    let branches = []; // Keep track of autonomous branching lines

    let animationFrameId;

    // Load saved canvas
    const savedCanvasData = localStorage.getItem('manifestoCanvas');

    // Helper to load image data
    function loadSavedCanvas(dataURL) {
        if (!dataURL) return;
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = dataURL;

        // If there's already drawing, the prompt should flash "Continue your path." and disappear
        promptText.textContent = "Continue your path.";
        promptText.style.opacity = '0'; // Starts invisible, animation handles the rest

        // We force a reflow to ensure the animation triggers if it was already applied
        void promptText.offsetWidth;
        promptText.classList.add('flash-fade');

        // Remove class after animation to clean up
        setTimeout(() => {
            promptText.classList.remove('flash-fade');
        }, 1500);

        controls.classList.add('visible');
    }

    // Set canvas size to pane
    function resizeCanvas() {
        // Since we never want to clear the canvas on resize (no final version), 
        // resizing canvas natively clears it. So we must save it first.
        const imageData = canvas.toDataURL(); // Use dataURL to survive resize cleanly
        canvas.width = rightPane.clientWidth;
        canvas.height = rightPane.clientHeight;
        if (hasStarted || savedCanvasData) {
            loadSavedCanvas(imageData);
        }
    }

    // Initial size
    canvas.width = rightPane.clientWidth;
    canvas.height = rightPane.clientHeight;

    // Load initial data if exists
    if (savedCanvasData) {
        loadSavedCanvas(savedCanvasData);
        // We consider it "started" so controls show
        hasStarted = true;
        // Require save before restarting again
        restartBtn.disabled = true;
    } else {
        // Fresh start: show the draw prompt
        promptText.style.opacity = '1';
    }

    window.addEventListener('resize', resizeCanvas);

    // Helpers
    // Noise function for organic jitter
    function getNoise(t) {
        return Math.sin(t * 0.1) * Math.cos(t * 0.05) * 5;
    }

    // Main draw loop
    function draw() {
        if (!hasStarted) return;

        const now = Date.now();
        const elapsed = (now - startTime) / 1000; // in seconds

        // Draw main user path continuously if moving or just to add jitter over time
        if (isDrawing && path.length > 0) {
            const currentPoint = path[path.length - 1];

            // Calculate speed based on distance from last point
            let speed = 0;
            if (path.length > 1) {
                const prev = path[path.length - 2];
                const dx = currentPoint.x - prev.x;
                const dy = currentPoint.y - prev.y;
                speed = Math.sqrt(dx * dx + dy * dy);
            }

            // The jitter/offset logic Based on time and speed
            // "1.5 seconds later line shivers" (sped up from 3s)
            let jitterAmount = 0;
            if (elapsed > 1.5) {
                jitterAmount = 1;
            }

            // "Faster = more out of control"
            // "Slower = softer deviation"
            const deviationFactor = Math.min(speed * 0.2, 10);
            jitterAmount += deviationFactor;

            // Apply noise and jitter
            let drawX = currentPoint.x;
            let drawY = currentPoint.y;

            if (elapsed > 1.5) {
                drawX += (Math.random() - 0.5) * jitterAmount * 2;
                drawY += (Math.random() - 0.5) * jitterAmount * 2;
            }

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(drawX, drawY);

            // "Not too perfect, sometimes broken, sometimes transparent"
            const breakChance = Math.random();
            if (breakChance < 0.95) { // 5% chance the line breaks and doesn't draw
                ctx.strokeStyle = `rgba(0, 0, 0, ${Math.random() > 0.8 ? 0.2 : 0.8})`; // random transparency drops
                ctx.lineWidth = 1 + Math.random();
                ctx.stroke();
            }

            // Update last point but deliberately using the slightly displaced one causes the line to "drift" organically
            // Wait, we want the user to control it somewhat, so we don't completely hijack lastX/Y unless we want total chaos
            lastX = drawX;
            lastY = drawY;

            // "2.5 seconds: branching" (sped up from 5s)
            // "5 seconds: a second line grows completely" (sped up from 10s)
            // Let's spawn branches randomly if elapsed > 2.5
            if (elapsed > 2.5 && Math.random() < 0.03 * (speed * 0.1 || 1)) {
                // Spawn a branch from the current point
                branches.push({
                    x: drawX,
                    y: drawY,
                    vx: (Math.random() - 0.5) * (speed + 2),
                    vy: (Math.random() - 0.5) * (speed + 2),
                    life: Math.random() * 100 + 50, // how long the branch lives
                    size: Math.random() * 1.5,
                    opacity: Math.random() * 0.5 + 0.1
                });
            }

            // 5 seconds: major split (simulate a secondary persistent line)
            if (elapsed > 5 && Math.random() < 0.008) {
                branches.push({
                    x: drawX,
                    y: drawY,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    life: 99999, // lives forever until user stops drawing
                    size: Math.random() * 2 + 1,
                    opacity: 0.8
                });
            }
        }

        // Draw branches autonomously
        for (let i = branches.length - 1; i >= 0; i--) {
            let b = branches[i];

            // Branches drift on their own
            const bx = b.x + b.vx + (Math.random() - 0.5) * 2;
            const by = b.y + b.vy + (Math.random() - 0.5) * 2;

            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = `rgba(0,0,0, ${b.opacity})`;
            ctx.lineWidth = b.size;

            if (Math.random() < 0.9) ctx.stroke();

            b.x = bx;
            b.y = by;

            // Randomly change direction slightly to make it organic like a root
            b.vx += (Math.random() - 0.5) * 0.5;
            b.vy += (Math.random() - 0.5) * 0.5;

            b.life--;
            if (b.life <= 0) {
                branches.splice(i, 1);
            }
        }

        animationFrameId = requestAnimationFrame(draw);
    }

    // Input handlers
    function startDrawing(e) {
        if (e.target.id === 'start-again-btn') return;

        isDrawing = true;

        if (!hasStarted) {
            hasStarted = true;
            startTime = Date.now();
            promptText.style.opacity = '0'; // fade out prompt Text
            controls.classList.add('visible'); // show controls
            // Whenever they start drawing, they must save before restarting
            restartBtn.disabled = true;
            saveBtn.disabled = false;
            hasSaved = false;
            draw(); // start animation loop
        } else if (branches.length === 0 && path.length === 0) {
            // Already started but idle, restart animation loop and time for the new stroke
            startTime = Date.now();
            restartBtn.disabled = true;
            saveBtn.disabled = false;
            hasSaved = false;
            draw();
        }

        const rect = canvas.getBoundingClientRect();
        lastX = (e.clientX || e.touches?.[0].clientX) - rect.left;
        lastY = (e.clientY || e.touches?.[0].clientY) - rect.top;

        path = [{ x: lastX, y: lastY }];
    }

    function moveDrawing(e) {
        if (!isDrawing) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX || e.touches?.[0].clientX) - rect.left;
        const mouseY = (e.clientY || e.touches?.[0].clientY) - rect.top;

        path.push({ x: mouseX, y: mouseY });
    }

    function stopDrawing() {
        isDrawing = false;
        // Keep branches alive? Yes, they just drift off and die. 
        // But the main user line stops updating.
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', moveDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: true });
    canvas.addEventListener('touchmove', moveDrawing, { passive: true });
    canvas.addEventListener('touchend', stopDrawing);

    // Save Button Logic
    saveBtn.addEventListener('click', () => {
        const dataURL = canvas.toDataURL();
        localStorage.setItem('manifestoCanvas', dataURL);

        hasSaved = true;
        saveBtn.disabled = true;
        restartBtn.disabled = false; // Now they are allowed to Start Again

        // Stop current organic drawing loops until they draw again
        isDrawing = false;
        path = [];
        branches = [];
        cancelAnimationFrame(animationFrameId);

        // Show Modal
        savedPreview.src = dataURL;
        restartCountText.textContent = `You have restarted ${restartCount} times.`;
        saveModal.classList.add('visible');
    });

    // Close modal logic
    closeModalBtn.addEventListener('click', () => {
        saveModal.classList.remove('visible');
    });

    // "Start Again" button logic
    // They can ONLY click this if they have saved.
    restartBtn.addEventListener('click', () => {
        if (!hasSaved) return;

        // Clear the canvas completely
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Also clear from localStorage so a refresh doesn't bring the old save back
        localStorage.removeItem('manifestoCanvas');

        // Increment and save restart counter
        restartCount++;
        localStorage.setItem('manifestoRestartCount', restartCount.toString());

        isDrawing = false;
        path = [];
        branches = [];
        cancelAnimationFrame(animationFrameId);

        // Reset state for new line
        hasStarted = false;
        hasSaved = false;

        // Hide controls and show prompt again
        promptText.textContent = "Draw your path.";
        promptText.style.opacity = '1';
        controls.classList.remove('visible');
    });
}

// Initialization logic
document.addEventListener('DOMContentLoaded', () => {
    if (isSplitView) {
        // Manifesto page logic
        initCanvasDrawing();
    } else {
        // Index page logic
        initHomepageBackground();
        spawnNotes();
        startFloatingAnimation(); // Start the autonomous float
    }
});
